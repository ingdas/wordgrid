// Reading the community numbers back out of Umami.
//
// `analytics.ts` is a one-way pipe by design. This module is the single
// exception, and it exists for one line of copy: the level index says "62% of
// players clear this one", which can only be answered by other players. The
// numbers come from the `level_win` / `level_loss` events the game already
// sends — Umami has aggregated them anyway, so nothing new is collected to
// support this.
//
// **No credential ships in the game.** Umami can mint a read-only token from a
// *share* slug with no authentication at all, which is what the public share
// dashboard uses:
//
//   GET  {origin}/api/share/{slug}                    → { websiteId, token }
//   GET  {origin}/api/websites/{id}/event-data/values
//          ?startAt&endAt&eventName=level_win&propertyName=level
//        headers: x-umami-share-token, x-umami-share-context
//                                                     → [{ value: "14", total: 37 }]
//
// Two of those (wins, then losses) are the whole aggregate: `plays` is their
// sum and `wins` is the first. Grouping by `level` is why `analytics.ts` sends
// that property **only for campaign boards** — the query is
// `order by total desc limit 100` with no paging, so a 101st distinct value
// (the daily's old `level: 0`) would silently push the least-played level out
// of the answer. 100 levels, 100 rows, nothing dropped. `scripts/
// umamiLevels.test.mts` fails if the campaign ever outgrows that.
//
// What this cannot answer: **how many distinct people** cleared a level. Every
// Umami aggregate counts events, not visitors-per-property-value. So `plays`
// and `wins` are real and `players`/`solvers` come back zero, and the author's
// dashboard hides those rather than printing a number that doesn't mean what
// its label says.
//
// ## Degradation
//
// The game is a puzzle, not a dashboard: nothing here is allowed to cost a
// player anything, and a struggling Umami must get *quieter*, not busier.
//
//   • Not configured (no share slug) — no requests at all, and the index shows
//     no clear-rate line. This is the default and the fork's state.
//   • Every request is bounded (`REQUEST_TIMEOUT_MS`) and nothing here ever
//     throws into a caller; a failure resolves to null and the last good
//     snapshot keeps being shown, dated, by `stats.ts`.
//   • The two aggregate reads are **sequential, and the second is skipped if
//     the first fails** — half the load on a server that is already hurting.
//   • **A cooldown, persisted across reloads.** Consecutive failures escalate
//     15 min → 1 h → 6 h → 24 h, so a page that keeps being reopened doesn't
//     keep asking. `429`/`503` honour `Retry-After` when it is sane, and a
//     config failure (`401`/`403`/`404` — share disabled, revoked, or never
//     created) jumps straight to the longest wait instead of retrying all day.
//   • **Jittered refresh** (`stats.ts`): a thousand players returning after a
//     deploy don't all ask in the same second.
//   • The answer is untrusted input: row count, value range and totals are all
//     clamped here, and the result then goes through `stats.parseLevels` like
//     any other server's would.
import { LEVELS } from "./puzzles.ts";
import { umamiTarget } from "./analytics.ts";
import { readItem, writeItem } from "./storage.ts";

/** How long a minted read token is reused before asking for another. */
const SHARE_TTL_MS = 25 * 60 * 1000;
/** Per request. Short: this is a background nicety, never a wait. */
export const REQUEST_TIMEOUT_MS = 6_000;
/** How far back to aggregate. A bounded window keeps the query cheap forever. */
const WINDOW_DAYS = 365;
/** A pathological payload is not this game's problem. */
const MAX_ROWS = 500;
/** Escalating quiet after consecutive failures. */
export const COOLDOWN_MS = [15 * 60 * 1000, 60 * 60 * 1000, 6 * 60 * 60 * 1000, 24 * 60 * 60 * 1000];
/** A `Retry-After` longer than this is ignored as nonsense (or hostility). */
const MAX_RETRY_AFTER_MS = 24 * 60 * 60 * 1000;
const COOLDOWN_KEY = "wordgrid:levels-cooldown";

/** The shape `stats.parseLevels` accepts. Filled in as far as Umami can. */
export interface LevelsBody {
  levels: Record<string, { players: number; solvers: number; plays: number; wins: number }>;
}

// --- configuration ---------------------------------------------------------

/**
 * The share slug, from `VITE_UMAMI_SHARE` at build time or the
 * `<meta name="wordgrid:umami-share">` tag in the committed build. It is the
 * last path segment but one of a share URL:
 * `https://umami.example.com/share/<slug>/<name>`.
 *
 * Absent — the default — means the community numbers are simply not available,
 * which is a state the whole feature already handles.
 */
function readSlug(): string {
  let slug = "";
  try {
    slug = (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_UMAMI_SHARE ?? "";
  } catch {
    /* not a Vite build (the node tests) */
  }
  if (!slug) {
    try {
      slug = document.querySelector('meta[name="wordgrid:umami-share"]')?.getAttribute("content") ?? "";
    } catch {
      /* no DOM */
    }
  }
  slug = slug.trim();
  // Umami's own rule for a share code (SHARE_ID_REGEX), which also rejects a
  // placeholder or a whole URL pasted into the tag by mistake.
  return /^[A-Za-z0-9]{8,50}$/.test(slug) ? slug : "";
}

let slug: string | null = null;
function shareSlug(): string {
  if (slug === null) slug = readSlug();
  return slug;
}

/** Are the community numbers readable at all? Everything else keys off this. */
export function umamiLevelsEnabled(): boolean {
  return umamiTarget() !== null && shareSlug() !== "";
}

/** What the author's dashboard prints as the source of the numbers. */
export function umamiLevelsSource(): string {
  const t = umamiTarget();
  return t ? `${t.origin} (shared)` : "";
}

// --- the persisted cooldown -------------------------------------------------

interface Cooldown {
  /** Epoch ms; nothing is asked before this. */
  until: number;
  /** How far up COOLDOWN_MS the last failure got. */
  step: number;
}

let cooldown: Cooldown | null | undefined;

function readCooldown(): Cooldown | null {
  if (cooldown !== undefined) return cooldown;
  cooldown = null;
  try {
    const raw = readItem(COOLDOWN_KEY);
    if (raw) {
      const c = JSON.parse(raw) as Cooldown;
      if (typeof c?.until === "number" && Number.isFinite(c.until)) {
        cooldown = { until: c.until, step: typeof c.step === "number" && c.step >= 0 ? Math.min(c.step, 99) : 0 };
      }
    }
  } catch {
    /* a broken value is no cooldown */
  }
  return cooldown;
}

function writeCooldown(next: Cooldown | null): void {
  cooldown = next;
  try {
    if (next) writeItem(COOLDOWN_KEY, JSON.stringify(next));
    else writeItem(COOLDOWN_KEY, JSON.stringify({ until: 0, step: 0 }));
  } catch {
    /* storage is best-effort everywhere in this game */
  }
}

/** Epoch ms until which this module stays quiet, or null. */
export function cooldownUntil(): number | null {
  const c = readCooldown();
  return c && c.until > Date.now() ? c.until : null;
}

let lastError: string | null = null;

/**
 * Go quiet. `hard` skips the ladder for a failure that will not fix itself
 * before someone changes a setting; `retryAfterMs` honours a server that said
 * when to come back.
 */
function fail(reason: string, opts: { hard?: boolean; retryAfterMs?: number | null } = {}): null {
  lastError = reason;
  const prev = readCooldown();
  const step = opts.hard ? COOLDOWN_MS.length - 1 : Math.min((prev?.step ?? -1) + 1, COOLDOWN_MS.length - 1);
  const ladder = COOLDOWN_MS[step];
  const asked = opts.retryAfterMs != null && opts.retryAfterMs > 0 ? Math.min(opts.retryAfterMs, MAX_RETRY_AFTER_MS) : 0;
  writeCooldown({ until: Date.now() + Math.max(ladder, asked), step });
  return null;
}

// --- network ---------------------------------------------------------------

type ApiResult =
  | { ok: true; body: unknown }
  | { ok: false; status: number; retryAfterMs: number | null };

/** GET with a timeout, resolving to a verdict instead of throwing. Ever. */
async function apiGet(url: string, headers?: Record<string, string>): Promise<ApiResult> {
  try {
    const f = globalThis.fetch;
    if (!f) return { ok: false, status: 0, retryAfterMs: null };
    const ctrl = typeof AbortController === "function" ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS) : undefined;
    try {
      const res = await f(url, { method: "GET", cache: "no-cache", headers, signal: ctrl?.signal });
      if (!res || !res.ok) {
        let retryAfterMs: number | null = null;
        try {
          const header = res?.headers?.get?.("retry-after");
          if (header) {
            const secs = Number(header);
            if (Number.isFinite(secs) && secs > 0) retryAfterMs = secs * 1000;
          }
        } catch {
          /* no headers to read */
        }
        return { ok: false, status: res?.status ?? 0, retryAfterMs };
      }
      return { ok: true, body: await res.json() };
    } finally {
      if (timer) clearTimeout(timer);
    }
  } catch {
    // Timeout, DNS, CORS, offline, unparseable JSON — one case: no answer.
    return { ok: false, status: 0, retryAfterMs: null };
  }
}

// --- the read token --------------------------------------------------------

let token: { value: string; at: number } | null = null;

/** Mint (or reuse) the share's read token. No credential involved. */
async function readToken(origin: string, website: string): Promise<string | null> {
  if (token && Date.now() - token.at < SHARE_TTL_MS) return token.value;
  const res = await apiGet(`${origin}/api/share/${encodeURIComponent(shareSlug())}`);
  if (!res.ok) {
    // 404 = no such share (never created, or revoked). Nothing to retry soon.
    const hard = res.status === 404 || res.status === 401 || res.status === 403;
    return fail(res.status ? `share HTTP ${res.status}` : "network", { hard, retryAfterMs: res.retryAfterMs });
  }
  const body = res.body as { token?: unknown; websiteId?: unknown } | null;
  const value = typeof body?.token === "string" ? body.token : "";
  if (!value) return fail("share gave no token", { hard: true });
  // A slug for someone else's website would read someone else's numbers.
  if (typeof body?.websiteId === "string" && body.websiteId !== website) {
    return fail("share is for another website", { hard: true });
  }
  token = { value, at: Date.now() };
  return value;
}

// --- the aggregate ---------------------------------------------------------

/** `[{value,total}]` → level number ⇒ count, with every field distrusted. */
export function tally(rows: unknown): Map<number, number> {
  const out = new Map<number, number>();
  if (!Array.isArray(rows)) return out;
  for (const row of rows.slice(0, MAX_ROWS)) {
    const r = row as { value?: unknown; total?: unknown } | null;
    // Umami returns a number property as a string, sometimes "14.0000".
    const level = Math.floor(Number(r?.value));
    const total = Number(r?.total);
    if (!Number.isFinite(level) || level < 1 || level > LEVELS.length) continue;
    if (!Number.isFinite(total) || total < 0) continue;
    out.set(level, Math.floor(total) + (out.get(level) ?? 0));
  }
  return out;
}

/** Wins and losses per level ⇒ the body `stats.parseLevels` expects. */
export function shape(wins: Map<number, number>, losses: Map<number, number>): LevelsBody {
  const levels: LevelsBody["levels"] = {};
  LEVELS.forEach((lvl, i) => {
    const won = wins.get(i + 1) ?? 0;
    const lost = losses.get(i + 1) ?? 0;
    if (won + lost === 0) return; // nothing known: no row rather than a zero
    // Umami counts events, not people — see the header. The dashboard hides
    // its "solvers" line when the source can't fill these.
    levels[lvl.id] = { players: 0, solvers: 0, plays: won + lost, wins: won };
  });
  return { levels };
}

/**
 * The community numbers, or null when they aren't available *for any reason* —
 * not configured, cooling down, offline, refused, slow, or nonsense. The caller
 * keeps showing its last good snapshot; the player is never told.
 */
export async function fetchUmamiLevels(): Promise<LevelsBody | null> {
  const target = umamiTarget();
  if (!target || !shareSlug()) return null;
  if (cooldownUntil()) return null;

  const auth = await readToken(target.origin, target.website);
  if (!auth) return null; // readToken already set the cooldown

  const headers = {
    "x-umami-share-token": auth,
    // Only has to be present (Umami rejects a share token used "outside a
    // share context"); the slug is the honest thing to put in it.
    "x-umami-share-context": shareSlug(),
  };
  const endAt = Date.now();
  const startAt = endAt - WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const base = `${target.origin}/api/websites/${encodeURIComponent(target.website)}/event-data/values`;
  const query = `startAt=${startAt}&endAt=${endAt}&propertyName=level&eventName=`;

  // Sequential, and the second read is skipped when the first fails: a server
  // that is struggling gets one request from us, not two.
  const won = await apiGet(`${base}?${query}level_win`, headers);
  if (!won.ok) {
    if (won.status === 401 || won.status === 403) token = null; // stale token: re-mint next time
    return fail(won.status ? `HTTP ${won.status}` : "network", {
      hard: won.status === 403,
      retryAfterMs: won.retryAfterMs,
    });
  }
  const lost = await apiGet(`${base}?${query}level_loss`, headers);
  if (!lost.ok) {
    return fail(lost.status ? `HTTP ${lost.status}` : "network", { retryAfterMs: lost.retryAfterMs });
  }

  const wins = tally(won.body);
  const losses = tally(lost.body);
  // An empty answer is a legitimate "nobody has played yet", not a failure —
  // but neither is it worth caching over a snapshot that has numbers in it.
  if (!wins.size && !losses.size) {
    lastError = null;
    writeCooldown(null);
    return null;
  }
  lastError = null;
  writeCooldown(null);
  return shape(wins, losses);
}

/** What the author's dashboard reports about this pipe. */
export function umamiLevelsStatus(): {
  enabled: boolean;
  source: string;
  lastError: string | null;
  cooldownUntil: number | null;
} {
  return {
    enabled: umamiLevelsEnabled(),
    source: umamiLevelsSource(),
    lastError,
    cooldownUntil: cooldownUntil(),
  };
}

/** Test seam: forget the slug, the token and the cooldown. */
export function resetUmamiLevelsCache(): void {
  slug = null;
  token = null;
  cooldown = undefined;
  lastError = null;
}
