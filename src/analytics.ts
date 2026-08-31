// Product analytics through a self-hosted Umami (https://umami.is).
//
// Level tracking (src/stats.ts) answers one question — who clears which level
// — and reads the answer back into the game. This module answers the rest:
// which screens players reach, what they spend, which offers they take, which
// settings they change, where the tutorial loses them. Nothing is ever read
// back; it is a one-way pipe into a dashboard, and the game is exactly the
// same with or without it.
//
// The rules are level tracking's, in the same order:
//
//   1. **The game plays without it.** Not configured (every fork, every local
//      checkout) means nothing is loaded and `track*` is a no-op that doesn't
//      even allocate. Configured, the tracker script is fetched *after* the
//      game has mounted, on an idle slot, and never awaited by anything.
//      Events raised before it lands are buffered in memory and replayed; a
//      script that fails to load (blocked, offline, host down) is retried a
//      few times and again when the connection comes back, and the buffer is
//      capped so a session that never gets through costs a few kilobytes and
//      nothing else. Nothing here throws into a caller.
//   2. **Anonymous by construction.** Umami sets no cookie and stores nothing
//      in the browser: a visitor is a hash of IP + user agent + a salt the
//      server rotates. We hand it the same random per-install id level tracking
//      uses (`identify`), so one player keeps being one player across the salt
//      rotation and inside the CrazyGames iframe, where storage is partitioned.
//      Event properties are ids, numbers and enums — never copy, never a word
//      the player typed, never a puzzle's answer.
//   3. **Debug play is never tracked.** A board a tool auto-solved is not a
//      player's behaviour.
//
// The tracker is loaded with `data-auto-track="false"`, so it sends nothing on
// its own: screen changes go out as virtual pageviews (`/home`, `/levels`,
// `/game`, …) — which is what Umami's page, journey and funnel reports read —
// and everything else as a named event with a small property bag.
//
// Event vocabulary (kept here on purpose, so a rename happens in one place):
//
//   level_start     mode, level, id, twist          a board was dealt
//   level_win       mode, level, id, stars, mistakes, timeS, link, combo, twist
//   level_loss      mode, level, id, mistakes, timeS, twist
//   endless_end     solved                          an Endless run ended
//   hint            kind (theme | letter), mode, level
//   rewarded        placement (hints | continue), result (granted | failed)
//   continue_offer  choice (watch | decline)        the second-chance card
//   early_call      result (hit | miss), open       groups still open at the call
//   tutorial        step (started | skipped | completed)
//   quest           id, set                         a quest paid out (set = the day's set)
//   achievement     id, tier
//   chapter_key     chapter
//   share           won, method (files | text | copy)
//   setting         name (sound | music | calm | locale), value
//   storage         durable                         nothing durable to save to
//   progress_reset  —
//
// `mode` is campaign | daily | endless; `level` is the 1-based campaign number
// and 0 for the daily and Endless. Unlike level tracking, Endless *is* counted
// here — mode adoption is exactly what analytics is for; Endless is left out of
// level tracking only because it has no loss state and therefore no rate.
//
// Umami's limits on event data: strings ≤ 500 characters, ≤ 50 properties,
// numbers to 4 decimals. Everything sent here is far inside them.
import { isDebug } from "./debug.ts";
import { playerId } from "./stats.ts";

export type EventName =
  | "level_start"
  | "level_win"
  | "level_loss"
  | "endless_end"
  | "hint"
  | "rewarded"
  | "continue_offer"
  | "early_call"
  | "tutorial"
  | "quest"
  | "achievement"
  | "chapter_key"
  | "share"
  | "setting"
  | "storage"
  | "progress_reset";

export type EventData = Record<string, string | number | boolean | null | undefined>;

/** The surface of the tracker script this module relies on. */
interface Umami {
  track(): unknown;
  track(name: string, data?: Record<string, unknown>): unknown;
  track(payload: (defaults: Record<string, unknown>) => Record<string, unknown>): unknown;
  identify(id: string, data?: Record<string, unknown>): unknown;
}

/** Events kept in memory while the tracker is still on its way (or blocked). */
export const BUFFER_CAP = 100;
/** Backoff between load attempts after a failed one; then only `online` retries. */
export const RETRY_MS = [5_000, 30_000, 120_000];
/** Longest a property string may be — a guard against a stray blob, not a budget. */
const MAX_STRING = 100;
/**
 * Honour the browser's Do Not Track switch. The data is anonymous either way;
 * this is the polite default and costs a few percent of a dashboard.
 */
const HONOR_DNT = true;

// --- configuration ---------------------------------------------------------

export interface AnalyticsConfig {
  /** Full URL of the tracker script — whatever `TRACKER_SCRIPT_NAME` made it. */
  script: string;
  /** The website id from the Umami dashboard. */
  website: string;
}

/**
 * Where to send, and as what. Two ways in, like level tracking: a build sets
 * `VITE_UMAMI_SCRIPT` + `VITE_UMAMI_WEBSITE`, and the committed `docs/` build
 * can be switched on later by filling the two `<meta name="wordgrid:umami-…">`
 * tags instead of rebuilding.
 *
 * Neither present — the default — means analytics is off and this module does
 * nothing at all. A placeholder that isn't an http(s) URL counts as absent.
 */
function readConfig(): AnalyticsConfig | null {
  let script = "";
  let website = "";
  try {
    const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
    script = env?.VITE_UMAMI_SCRIPT ?? "";
    website = env?.VITE_UMAMI_WEBSITE ?? "";
  } catch {
    /* not a Vite build (the node tests) */
  }
  if (!script || !website) {
    try {
      const meta = (name: string) =>
        document.querySelector(`meta[name="wordgrid:umami-${name}"]`)?.getAttribute("content") ?? "";
      script = script || meta("script");
      website = website || meta("website");
    } catch {
      /* no DOM */
    }
  }
  script = script.trim();
  website = website.trim();
  if (!/^https?:\/\//i.test(script) || !website) return null;
  return { script, website };
}

let config: AnalyticsConfig | null | undefined;
function cfg(): AnalyticsConfig | null {
  if (config === undefined) config = readConfig();
  return config;
}

/** Is anything being collected at all? Everything else keys off this. */
export function analyticsEnabled(): boolean {
  return cfg() !== null;
}

// --- the tracker -----------------------------------------------------------

function tracker(): Umami | null {
  try {
    const u = (window as unknown as { umami?: Partial<Umami> }).umami;
    return u && typeof u.track === "function" && typeof u.identify === "function" ? (u as Umami) : null;
  } catch {
    return null;
  }
}

type Job = (u: Umami) => unknown;

const buffer: Job[] = [];
let handed = 0;
let dropped = 0;
let lastError: string | null = null;
let loaded = false;
let identified = false;
let started = false;
let attempts = 0;
let scriptEl: { remove?: () => void } | null = null;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let idleHandle: number | undefined;
let lastScreen: string | null = null;

/** Hand one job to the tracker, swallowing a sync throw and a rejection alike. */
function run(u: Umami, job: Job): void {
  try {
    const out = job(u) as { then?: unknown } | null | undefined;
    if (out && typeof out.then === "function") {
      (out as Promise<unknown>).then(undefined, () => {});
    }
    handed++;
  } catch {
    /* the tracker's problem, not the game's */
  }
}

/** The tracker landed: introduce the player, then send what queued up. */
function drain(): void {
  const u = tracker();
  if (!u) return;
  if (!identified) {
    identified = true;
    run(u, (t) => t.identify(playerId()));
  }
  while (buffer.length) run(u, buffer.shift()!);
}

function enqueue(job: Job): void {
  if (!analyticsEnabled() || isDebug()) return;
  const u = started && loaded ? tracker() : null;
  if (u) {
    if (!identified) drain();
    run(u, job);
    return;
  }
  if (buffer.length >= BUFFER_CAP) {
    buffer.shift();
    dropped++;
  }
  buffer.push(job);
}

/** Clip the property bag to what Umami stores and what we mean to send. */
function clean(data?: EventData): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  if (!data) return out;
  for (const [k, v] of Object.entries(data)) {
    if (v === null || v === undefined) continue;
    if (typeof v === "string") out[k] = v.length > MAX_STRING ? v.slice(0, MAX_STRING) : v;
    else if (typeof v === "number") out[k] = Number.isFinite(v) ? Math.round(v * 10_000) / 10_000 : 0;
    else if (typeof v === "boolean") out[k] = v;
  }
  return out;
}

// --- recording -------------------------------------------------------------

/** A named event with a small property bag. See the vocabulary above. */
export function trackEvent(name: EventName, data?: EventData): void {
  if (!analyticsEnabled() || isDebug()) return;
  const props = clean(data);
  enqueue((u) => u.track(name, props));
}

/**
 * A screen came up. Sent as a virtual pageview (`/home`, `/game`, …) so the
 * game's five screens read as pages in Umami — the same screen twice in a row
 * (a StrictMode double effect, a redundant caller) is one view.
 */
export function trackScreen(screen: string): void {
  if (!analyticsEnabled() || isDebug()) return;
  if (screen === lastScreen) return;
  const from = lastScreen;
  lastScreen = screen;
  const url = `/${screen}`;
  const title = screen.charAt(0).toUpperCase() + screen.slice(1);
  enqueue((u) =>
    u.track((defaults) => ({
      ...defaults,
      url,
      title,
      // The first view keeps the real referrer — that is where the player came
      // from. Later ones would just repeat it and inflate the referrer report.
      referrer: from === null ? defaults.referrer : "",
    }))
  );
}

// --- lifecycle -------------------------------------------------------------

function whenIdle(fn: () => void): void {
  try {
    const ric = (globalThis as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number })
      .requestIdleCallback;
    if (ric) {
      idleHandle = ric(fn, { timeout: 3000 });
      return;
    }
  } catch {
    /* fall through */
  }
  const t = setTimeout(fn, 0);
  (t as unknown as { unref?: () => void }).unref?.();
}

function scheduleRetry(): void {
  if (retryTimer !== undefined) return;
  if (attempts > RETRY_MS.length) return; // from here on only `online` retries
  const wait = RETRY_MS[Math.min(attempts - 1, RETRY_MS.length - 1)];
  try {
    retryTimer = setTimeout(() => {
      retryTimer = undefined;
      inject();
    }, wait);
    (retryTimer as unknown as { unref?: () => void }).unref?.();
  } catch {
    /* no timers: the next `online` will try again */
  }
}

/** Put the tracker script on the page. Safe to call again after a failure. */
function inject(): void {
  const c = cfg();
  if (!c || !started || loaded || scriptEl) return;
  attempts++;
  try {
    const el = document.createElement("script");
    el.async = true;
    el.src = c.script;
    el.setAttribute("data-website-id", c.website);
    // We say when something happened; the tracker never guesses.
    el.setAttribute("data-auto-track", "false");
    el.setAttribute("data-exclude-search", "true");
    el.setAttribute("data-exclude-hash", "true");
    if (HONOR_DNT) el.setAttribute("data-do-not-track", "true");
    el.onload = () => {
      loaded = true;
      lastError = null;
      drain();
    };
    el.onerror = () => {
      lastError = "blocked";
      scriptEl = null;
      try {
        el.remove();
      } catch {
        /* ignore */
      }
      scheduleRetry();
    };
    scriptEl = el;
    (document.head ?? document.body ?? document.documentElement).appendChild(el);
  } catch {
    lastError = "inject";
    scriptEl = null;
    scheduleRetry();
  }
}

/**
 * Wire the module up: load the tracker once the browser has a moment, and try
 * again whenever the connection comes back. Idempotent, and a no-op when
 * analytics is off. Returns a stop function (tests; StrictMode).
 */
export function startAnalytics(): () => void {
  // A `?debug` page is the owner's: it sends nothing (every `track*` is a
  // no-op), so fetching a tracker for it would be pure waste — and it keeps the
  // headless suites, which all open `?debug`, off the analytics host entirely.
  // Debug turned on mid-session stops the events, not the already-loaded
  // tracker; a session that *starts* in debug never loads one at all.
  if (!analyticsEnabled() || isDebug() || started) return () => {};
  started = true;
  whenIdle(inject);

  const onOnline = () => {
    if (loaded) return;
    attempts = 0;
    inject();
  };
  try {
    window.addEventListener("online", onOnline);
  } catch {
    /* no DOM (tests) */
  }
  return () => {
    started = false;
    try {
      window.removeEventListener("online", onOnline);
    } catch {
      /* ignore */
    }
    if (retryTimer !== undefined) {
      clearTimeout(retryTimer);
      retryTimer = undefined;
    }
    if (idleHandle !== undefined) {
      try {
        (globalThis as { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback?.(idleHandle);
      } catch {
        /* ignore */
      }
      idleHandle = undefined;
    }
  };
}

/** What Settings → Developer reports about the pipe itself. */
export interface AnalyticsStatus {
  enabled: boolean;
  script: string;
  website: string;
  loaded: boolean;
  /** Events handed to the tracker this session. */
  handed: number;
  /** Events waiting for the tracker to arrive. */
  buffered: number;
  /** Events the capped buffer had to let go of. */
  dropped: number;
  lastError: string | null;
}

export function analyticsStatus(): AnalyticsStatus {
  const c = cfg();
  return {
    enabled: c !== null,
    script: c?.script ?? "",
    website: c?.website ?? "",
    loaded,
    handed,
    buffered: buffer.length,
    dropped,
    lastError,
  };
}

/** Test seam: forget the config and every bit of session state. */
export function resetAnalyticsCache(): void {
  config = undefined;
  buffer.length = 0;
  handed = 0;
  dropped = 0;
  lastError = null;
  loaded = false;
  identified = false;
  started = false;
  attempts = 0;
  scriptEl = null;
  lastScreen = null;
  if (retryTimer !== undefined) {
    clearTimeout(retryTimer);
    retryTimer = undefined;
  }
  idleHandle = undefined;
}
