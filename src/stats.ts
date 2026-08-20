// Level telemetry: how many people clear a level, and how often an attempt
// ends in a win.
//
// The game is a static bundle on GitHub Pages / inside the CrazyGames iframe,
// so "how many people solved level 14" can only be answered by something
// outside it. This module is the client half: it posts one small event when a
// board starts and one when it ends, and reads back the aggregate the server
// has computed. The server half is `server/stats-server.mjs` — a
// dependency-free reference implementation of the two endpoints below.
//
// Three rules shape everything here, in this order:
//
//   1. **The game plays without it.** No endpoint configured, no network, a
//      server that 500s, a DNS hole, an ad blocker eating the request — all of
//      it is the same case: gameplay never waits on this module, nothing here
//      ever throws into a caller, and no failure is shown to the player. Called
//      with tracking off, `track*` is a no-op that doesn't even allocate.
//   2. **Offline is normal, not an error.** The service worker makes this an
//      installable offline game, so an event raised on a plane has to keep.
//      Events queue in the same storage the save uses and flush on the next
//      connection; the last aggregate is cached, so the community numbers are
//      still there (with an "as of" date) with no network at all.
//   3. **Anonymous by construction.** One random id per install — enough to
//      count *people* rather than plays, and to keep a replayed level from
//      counting twice — plus the level, the outcome and the clock. No account,
//      no IP kept by the reference server, nothing a player typed.
//
// Wire protocol (both directions JSON, CORS):
//
//   POST {endpoint}/events   {"events": [ {uid, player, id, level, kind,
//                                          mode, at, mistakes, timeMs, stars} ]}
//                            → 200 {"ok": true}
//   GET  {endpoint}/levels   → 200 {"levels": {"<level id>": {players, solvers,
//                                                             plays, wins}}}
//
// `uid` is client-generated so a retried flush is idempotent: a batch that got
// through but whose response was lost is stored once, not twice.
import { readItem, writeItem } from "./storage.ts";

// --- what the server sends back --------------------------------------------

/** One level's community record. */
export interface LevelStat {
  /** Distinct installs that have started this level. */
  players: number;
  /** Distinct installs that have ever won it — "how many people solved it". */
  solvers: number;
  /** Attempts that reached an end (win or loss); the rate's denominator. */
  plays: number;
  /** Attempts that ended in a win; the rate's numerator. */
  wins: number;
}

export type LevelStats = Record<string, LevelStat>;

export interface Snapshot {
  /** When this was fetched, so the UI can say how stale it is offline. */
  fetchedAt: number;
  levels: LevelStats;
}

// --- what we send ----------------------------------------------------------

export type PlayKind = "start" | "win" | "loss";
/** Endless is deliberately absent: it has no loss state, so it has no rate. */
export type PlayMode = "campaign" | "daily";

export interface PlayEvent {
  uid: string;
  player: string;
  /** Puzzle id — the same key the aggregate is returned under. */
  id: string;
  /** 1-based campaign level number; 0 for the daily. */
  level: number;
  kind: PlayKind;
  mode: PlayMode;
  at: number;
  mistakes?: number;
  timeMs?: number;
  stars?: number;
}

const QUEUE_KEY = "wordgrid:stats-queue";
const CACHE_KEY = "wordgrid:stats-cache";
const MINE_KEY = "wordgrid:stats-mine";
/** Mirrored to the platform store (see storage.ts KEYS) so a wiped
 *  localStorage inside the iframe doesn't read as a brand-new person. */
export const PLAYER_KEY = "wordgrid:player";

/** A queue that grows without bound is a memory leak with a plan. */
export const QUEUE_CAP = 250;
/** Events per POST. Small enough that one bad batch costs little. */
const BATCH = 50;
/** Refetch the aggregate at most this often; it changes slowly. */
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
/** Backoff between failed flushes: give up on the tab, not on the data. */
const RETRY_MS = [5_000, 20_000, 60_000, 300_000];

// --- configuration ---------------------------------------------------------

/**
 * Where to send. Two ways in, because the two deploys differ: a build sets
 * `VITE_STATS_URL`, and the committed `docs/` build can be pointed at a server
 * later by editing one `<meta>` tag instead of rebuilding.
 *
 * Neither present — the default, including every fork and local checkout —
 * means tracking is off and this module does nothing at all.
 */
function readEndpoint(): string {
  let url = "";
  try {
    url = (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_STATS_URL ?? "";
  } catch {
    /* not a Vite build (the node tests) */
  }
  if (!url) {
    try {
      url = document.querySelector('meta[name="wordgrid:stats"]')?.getAttribute("content") ?? "";
    } catch {
      /* no DOM */
    }
  }
  url = url.trim();
  // A placeholder left in the meta tag must not become a request.
  if (!/^https?:\/\//i.test(url)) return "";
  return url.replace(/\/+$/, "");
}

let endpoint: string | null = null;
function target(): string {
  if (endpoint === null) endpoint = readEndpoint();
  return endpoint;
}

/** Is anything being tracked at all? Everything else keys off this. */
export function statsEnabled(): boolean {
  return target() !== "";
}

// --- the anonymous install id ----------------------------------------------

function randomId(): string {
  try {
    const c = globalThis.crypto;
    if (c?.randomUUID) return c.randomUUID();
    if (c?.getRandomValues) {
      const b = c.getRandomValues(new Uint8Array(16));
      return [...b].map((n) => n.toString(16).padStart(2, "0")).join("");
    }
  } catch {
    /* fall through */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

let player: string | null = null;
function playerId(): string {
  if (player) return player;
  const stored = readItem(PLAYER_KEY);
  player = stored && stored.length >= 8 ? stored : randomId();
  if (player !== stored) writeItem(PLAYER_KEY, player);
  return player;
}

// --- pure helpers (the parts worth pinning in tests) ------------------------

/**
 * Share of finished attempts that were won, 0-1, or null when the sample is
 * too thin to mean anything. A "3% clear rate" drawn from two attempts is a
 * worse answer than no answer, on the level index and in the dashboard alike.
 */
export const MIN_SAMPLE = 5;

export function successRate(s: LevelStat | undefined, minSample = MIN_SAMPLE): number | null {
  if (!s || s.plays < minSample) return null;
  return s.wins / s.plays;
}

/** Add an event, oldest dropped first once the cap is reached. */
export function enqueue(queue: PlayEvent[], event: PlayEvent, cap = QUEUE_CAP): PlayEvent[] {
  const next = [...queue, event];
  return next.length > cap ? next.slice(next.length - cap) : next;
}

/**
 * Coerce whatever the server said into the shape the UI reads. Anything
 * missing, negative, non-finite or contradictory (more wins than plays) is
 * dropped rather than rendered: this payload is the one piece of the game that
 * comes from outside it.
 */
export function parseLevels(body: unknown): LevelStats | null {
  const levels = (body as { levels?: unknown } | null)?.levels;
  if (!levels || typeof levels !== "object") return null;
  const out: LevelStats = {};
  for (const [id, value] of Object.entries(levels as Record<string, unknown>)) {
    if (typeof id !== "string" || id.length > 64) continue;
    const v = value as Record<string, unknown>;
    const num = (x: unknown) => (typeof x === "number" && Number.isFinite(x) && x >= 0 ? Math.floor(x) : 0);
    const plays = num(v?.plays);
    const wins = Math.min(num(v?.wins), plays);
    const players = num(v?.players);
    // Nobody can have solved a level more times than they started it.
    const solvers = players ? Math.min(num(v?.solvers), players) : num(v?.solvers);
    if (!plays && !players) continue;
    out[id] = { players, solvers, plays, wins };
  }
  return out;
}

/** This install's own record for a level — what the dashboard falls back to. */
export interface MineStat {
  plays: number;
  wins: number;
}
export type MineStats = Record<string, MineStat>;

export function bumpMine(mine: MineStats, id: string, won: boolean): MineStats {
  const prev = mine[id] ?? { plays: 0, wins: 0 };
  return { ...mine, [id]: { plays: prev.plays + 1, wins: prev.wins + (won ? 1 : 0) } };
}

// --- stored state ----------------------------------------------------------

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = readItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    writeItem(key, JSON.stringify(value));
  } catch {
    /* storage is best-effort everywhere in this game */
  }
}

function readQueue(): PlayEvent[] {
  const q = readJson<PlayEvent[]>(QUEUE_KEY, []);
  return Array.isArray(q) ? q : [];
}

/**
 * Every attempt this install has finished, whether or not it was ever sent.
 * The dashboard shows it beside the community numbers, and it is the whole
 * answer for a build with no endpoint at all.
 */
export function myStats(): MineStats {
  const m = readJson<MineStats>(MINE_KEY, {});
  return m && typeof m === "object" ? m : {};
}

// --- the cached aggregate --------------------------------------------------

let snapshot: Snapshot | null = null;
let snapshotRead = false;

/**
 * The community numbers as they stand: freshly fetched, or the last ones we
 * saw. Null means we've never had any (never online since install, or tracking
 * is off) — callers show nothing rather than zeroes, which would read as "0
 * people solved this".
 */
export function communityStats(): Snapshot | null {
  if (!snapshotRead) {
    snapshotRead = true;
    const cached = readJson<Snapshot | null>(CACHE_KEY, null);
    if (cached && typeof cached.fetchedAt === "number" && cached.levels) {
      const levels = parseLevels(cached);
      if (levels) snapshot = { fetchedAt: cached.fetchedAt, levels };
    }
  }
  return snapshot;
}

// Cheap subscription so a fetch landing re-renders the screens that show it.
const listeners = new Set<() => void>();

export function subscribeStats(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function announce(): void {
  for (const fn of [...listeners]) {
    try {
      fn();
    } catch {
      /* a broken listener is not this module's problem */
    }
  }
}

// --- network ---------------------------------------------------------------

let lastError: string | null = null;
let lastSync: number | null = null;
let inflight: Promise<boolean> | null = null;
let retry = 0;
let retryTimer: ReturnType<typeof setTimeout> | undefined;

function online(): boolean {
  try {
    // `onLine === false` is a reliable "definitely not"; true is only a hint,
    // which is fine — a hopeful request that fails just re-queues.
    return navigator.onLine !== false;
  } catch {
    return true;
  }
}

/** fetch with a timeout, resolving to null instead of rejecting. Ever. */
async function post(url: string, body: unknown, timeoutMs = 8000): Promise<Response | null> {
  try {
    const f = globalThis.fetch;
    if (!f) return null;
    const ctrl = typeof AbortController === "function" ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : undefined;
    try {
      return await f(url, {
        method: "POST",
        // A "simple" content type keeps this a CORS request without a
        // preflight — one round trip, and no OPTIONS to configure.
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: JSON.stringify(body),
        signal: ctrl?.signal,
        // The tab may be closing: let the request outlive it.
        keepalive: true,
      });
    } finally {
      if (timer) clearTimeout(timer);
    }
  } catch {
    return null;
  }
}

async function get(url: string, timeoutMs = 8000): Promise<unknown> {
  try {
    const f = globalThis.fetch;
    if (!f) return null;
    const ctrl = typeof AbortController === "function" ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : undefined;
    try {
      // `no-cache` revalidates rather than reusing a stored copy: the server
      // sends a short max-age for proxies, and without this a browser that
      // fetched an empty aggregate a minute ago would keep showing it.
      const res = await f(url, { method: "GET", cache: "no-cache", signal: ctrl?.signal });
      if (!res || !res.ok) return null;
      return await res.json();
    } finally {
      if (timer) clearTimeout(timer);
    }
  } catch {
    return null;
  }
}

function scheduleRetry(): void {
  if (retryTimer !== undefined) return;
  const wait = RETRY_MS[Math.min(retry, RETRY_MS.length - 1)];
  retry++;
  try {
    retryTimer = setTimeout(() => {
      retryTimer = undefined;
      void flush();
    }, wait);
    // Don't hold a Node test process (or a headless run) open on this.
    (retryTimer as unknown as { unref?: () => void }).unref?.();
  } catch {
    /* no timers: the next event or the next load will try again */
  }
}

/**
 * Send what's queued. Safe to call at any time — concurrent calls collapse
 * onto the one in flight, a failure leaves the queue exactly as it was, and
 * success removes only the events that were actually accepted (events raised
 * mid-flight survive).
 *
 * @returns true if a batch was accepted.
 */
export function flush(): Promise<boolean> {
  // A second caller joins the first rather than racing it — and if that one
  // succeeded but left events behind (a batch is capped), it takes the next
  // batch itself, so `await flush()` really does mean "the queue went out".
  if (inflight) return inflight.then((ok) => (ok && readQueue().length ? flush() : ok));
  const run = runFlush().finally(() => {
    inflight = null;
  });
  inflight = run;
  return run;
}

async function runFlush(): Promise<boolean> {
  if (!statsEnabled()) return false;
  const queued = readQueue();
  if (!queued.length) return false;
  if (!online()) {
    lastError = "offline";
    return false;
  }
  const batch = queued.slice(0, BATCH);
  const res = await post(`${target()}/events`, { v: 1, events: batch });
  if (!res || !res.ok) {
    lastError = res ? `HTTP ${res.status}` : "network";
    scheduleRetry();
    return false;
  }
  const sent = new Set(batch.map((e) => e.uid));
  writeJson(QUEUE_KEY, readQueue().filter((e) => !sent.has(e.uid)));
  lastError = null;
  lastSync = Date.now();
  retry = 0;
  return true;
}

/**
 * Fetch the aggregate. Cheap to call on every screen that shows it: a fresh
 * enough cache short-circuits, and a failure quietly keeps the old snapshot.
 */
export async function refreshStats(force = false): Promise<Snapshot | null> {
  if (!statsEnabled()) return null;
  const have = communityStats();
  if (!force && have && Date.now() - have.fetchedAt < CACHE_TTL_MS) return have;
  if (!online()) return have;
  const body = await get(`${target()}/levels`);
  const levels = parseLevels(body);
  if (!levels) {
    lastError = "no aggregate";
    return have;
  }
  snapshot = { fetchedAt: Date.now(), levels };
  snapshotRead = true;
  writeJson(CACHE_KEY, snapshot);
  lastError = null;
  announce();
  return snapshot;
}

// --- recording -------------------------------------------------------------

function record(event: Omit<PlayEvent, "uid" | "player" | "at">): void {
  if (!statsEnabled()) return;
  const full: PlayEvent = { ...event, uid: randomId(), player: playerId(), at: Date.now() };
  writeJson(QUEUE_KEY, enqueue(readQueue(), full));
  void flush();
}

export interface PlayInfo {
  id: string;
  level: number;
  mode: PlayMode;
}

/**
 * A board was dealt. This is the denominator: without it a level nobody
 * finishes looks like a level nobody played.
 */
export function trackStart(info: PlayInfo): void {
  record({ ...info, kind: "start" });
}

/**
 * A board ended. Recorded locally whether or not tracking is on, so the
 * dashboard has something true to show in an untracked build.
 */
export function trackFinish(
  info: PlayInfo & { won: boolean; mistakes: number; timeMs: number; stars?: number }
): void {
  writeJson(MINE_KEY, bumpMine(myStats(), info.id, info.won));
  record({
    id: info.id,
    level: info.level,
    mode: info.mode,
    kind: info.won ? "win" : "loss",
    mistakes: info.mistakes,
    timeMs: Math.round(info.timeMs),
    stars: info.stars ?? 0,
  });
}

// --- lifecycle -------------------------------------------------------------

let started = false;

/**
 * Wire the module up: drain anything left from a previous session, pull the
 * aggregate, and try again whenever the connection comes back or the tab is
 * about to go away. Idempotent, and a no-op when tracking is off.
 */
export function startStats(): () => void {
  if (!statsEnabled() || started) return () => {};
  started = true;
  void flush();
  void refreshStats();

  const onOnline = () => {
    retry = 0;
    void flush();
  };
  const onHide = () => {
    if (document.visibilityState === "hidden") void flush();
  };
  try {
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onHide);
  } catch {
    /* no DOM (tests) */
  }
  return () => {
    started = false;
    try {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onHide);
    } catch {
      /* ignore */
    }
    if (retryTimer !== undefined) {
      clearTimeout(retryTimer);
      retryTimer = undefined;
    }
  };
}

/** What the developer dashboard reports about the pipe itself. */
export interface StatsStatus {
  enabled: boolean;
  endpoint: string;
  pending: number;
  lastSync: number | null;
  lastError: string | null;
  fetchedAt: number | null;
  online: boolean;
}

export function statsStatus(): StatsStatus {
  return {
    enabled: statsEnabled(),
    endpoint: target(),
    pending: readQueue().length,
    lastSync,
    lastError,
    fetchedAt: communityStats()?.fetchedAt ?? null,
    online: online(),
  };
}

/** Test seam: forget the endpoint, the id and the cached aggregate. */
export function resetStatsCache(): void {
  endpoint = null;
  player = null;
  snapshot = null;
  snapshotRead = false;
  lastError = null;
  lastSync = null;
  retry = 0;
  started = false;
  inflight = null;
  if (retryTimer !== undefined) {
    clearTimeout(retryTimer);
    retryTimer = undefined;
  }
}
