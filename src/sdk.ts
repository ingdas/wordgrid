// Thin, defensive wrapper around the CrazyGames SDK v3.
//
// On the platform the game runs in an iframe with `window.CrazyGames.SDK` on the
// page, put there by the `async` script tag in index.html. Three facts about
// that object shape everything below:
//
//   1. **It must be initialised before any other call.** Until `init()` has
//      resolved every method throws `sdkNotInitialized` — synchronously, with a
//      console error of its own — and records nothing. The game's first calls
//      (loading, then `gameplayStart` on a first launch) happen the moment React
//      mounts, so anything asked for before init settles is *queued* here and
//      replayed, in order, once it has.
//   2. **The script is `async`,** so it lands before or after React mounts
//      depending on the cache. `initSdk()` waits for it instead of assuming.
//   3. **Off-platform the SDK is present but disabled** (a local file, GitHub
//      Pages): `environment === "disabled"` and every call fails `sdkDisabled`.
//      That is permanent for the page, so it is latched once and the game plays
//      exactly as if there were no SDK. `localhost` is the exception — the SDK
//      runs in `"local"` mode with fake ads, which is how these flows are
//      exercised by hand.
//
// What the game asks of it:
//   - `loadingStart`/`loadingStop` once; `gameplayStart`/`gameplayStop` around
//     every board. Both are deduplicated — only a change of state is sent — and
//     neither is tied to tab focus: the platform's docs are explicit that a
//     focus change is not a game break.
//   - `happytime` when a boss falls (the docs ask for it sparingly).
//   - `showInterstitial` between boards. It resolves when the ad is gone (or
//     was never going to show), so the caller can hold the next board back, and
//     it reports through `onAdBreak` while an ad is actually on screen so the
//     game can mute — on the ad, not on the request.
//   - `requestRewarded` for the hint refill and the second chance. Three
//     honest outcomes: an ad was watched (reward), an ad failed (no reward —
//     nothing was watched), or there is no ad system here at all (reward: the
//     feature is the player's, and a dead button is a QA rejection). `adsMode`
//     tells the UI which of those worlds it is in, so a button never promises a
//     video that cannot exist.
//   - `sdkData` for the save mirror (storage.ts), `shareUrl` for the share card.

/** The SDK's own key/value store — survives storage partitioning in the embed. */
export interface CrazyData {
  getItem?: (key: string) => string | null;
  setItem?: (key: string, value: string) => void;
  removeItem?: (key: string) => void;
}

interface AdCallbacks {
  adStarted?: () => void;
  adFinished?: () => void;
  adError?: (err?: unknown) => void;
}

interface CrazySDK {
  init?: () => Promise<void> | void;
  /** "uninitialized" | "local" | "crazygames" | "disabled" */
  environment?: string;
  data?: CrazyData;
  game?: {
    gameplayStart?: () => void;
    gameplayStop?: () => void;
    happytime?: () => void;
    loadingStart?: () => void;
    loadingStop?: () => void;
    /** v2 names, kept as fallbacks */
    sdkGameLoadingStart?: () => void;
    sdkGameLoadingStop?: () => void;
    inviteLink?: (params: Record<string, string | number | boolean>) => string;
  };
  ad?: {
    requestAd?: (type: "midgame" | "rewarded", callbacks?: AdCallbacks) => Promise<void> | void;
    hasAdblock?: () => Promise<boolean> | boolean;
  };
}

// --- lifecycle -------------------------------------------------------------

/**
 * waiting — the script hasn't landed, or init hasn't settled: calls queue.
 * ready   — init resolved on a live domain: calls go straight through.
 * off     — no SDK, or disabled here, or init failed: calls are dropped.
 */
type Phase = "waiting" | "ready" | "off";
let phase: Phase = "waiting";
let initPromise: Promise<void> | null = null;
let environment = "";
let pending: Array<() => unknown> = [];
/** Only lifecycle calls ever queue; this is a leak guard, not a budget. */
const PENDING_CAP = 64;

/**
 * How long `initSdk` waits for the async script before giving up. The script
 * (107 kB) is requested from `<head>` before the 600 kB bundle whose arrival
 * mounts React, so by the time this clock starts it has nearly always landed;
 * eight more seconds says "blocked or offline", and the storage-warning
 * banner (which waits on this answer) shouldn't sit on the fence for longer.
 */
const SDK_WAIT_MS = 8_000;
const SDK_POLL_MS = 50;

function raw(): CrazySDK | null {
  try {
    return (window as unknown as { CrazyGames?: { SDK?: CrazySDK } }).CrazyGames?.SDK ?? null;
  } catch {
    return null;
  }
}

function isThenable(v: unknown): v is Promise<unknown> {
  return typeof (v as { then?: unknown } | null | undefined)?.then === "function";
}

function codeOf(err: unknown): string {
  const e = err as { code?: unknown } | null | undefined;
  return typeof e?.code === "string" ? e.code : "";
}

/** "sdkDisabled": this domain isn't served — nothing here will ever work. */
function isDisabledError(err: unknown): boolean {
  const e = err as { message?: unknown } | null | undefined;
  const text = `${codeOf(err)} ${typeof e?.message === "string" ? e.message : ""}`;
  return /sdkdisabled|disabled on this domain/i.test(text);
}

function shutDown() {
  phase = "off";
  pending = [];
  notifyAds();
}

function noteError(err: unknown) {
  if (isDisabledError(err)) shutDown();
}

/** Run one call, swallowing both a synchronous throw and a rejected promise. */
function run(fn: () => unknown) {
  try {
    const out = fn();
    if (isThenable(out)) out.then(undefined, noteError);
  } catch (err) {
    noteError(err);
  }
}

function readEnvironment(s: CrazySDK): string {
  try {
    return typeof s.environment === "string" ? s.environment : "";
  } catch {
    return "";
  }
}

/**
 * The init handshake, started at most once per page. Runs synchronously up to
 * the first real await, so an SDK that initialises synchronously (a test
 * double without `init`) is `ready` by the time this returns.
 */
function arm(s: CrazySDK): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      const out = s.init?.();
      if (isThenable(out)) await out;
      environment = readEnvironment(s);
      if (environment === "disabled") {
        shutDown();
        return;
      }
      phase = "ready";
      const queue = pending;
      pending = [];
      for (const fn of queue) run(fn);
      probeAdblock(s);
      notifyAds();
    } catch (err) {
      noteError(err);
      shutDown();
    }
  })();
  return initPromise;
}

/** Arm the SDK the moment anyone notices it, even before `initSdk` is called. */
function armIfSeen() {
  if (phase !== "waiting" || initPromise) return;
  const s = raw();
  if (s) void arm(s);
}

/**
 * Queue-or-run: a call made before init settles is replayed after it; a call
 * against a dead SDK is dropped; otherwise it goes straight through.
 */
function guard(fn: () => unknown) {
  armIfSeen();
  if (phase === "off") return;
  if (phase === "waiting") {
    if (pending.length < PENDING_CAP) pending.push(fn);
    return;
  }
  run(fn);
}

/**
 * Wait for the SDK script, initialise it, and settle — never rejects. Callers
 * that need the SDK to be *ready* (the save mirror) wait on this; everything
 * else may be called before it and is queued.
 */
export function initSdk(opts: { waitMs?: number } = {}): Promise<void> {
  if (initPromise) return initPromise;
  const waitMs = opts.waitMs ?? SDK_WAIT_MS;
  const now = raw();
  if (now) return arm(now);
  return new Promise<void>((resolve) => {
    const started = Date.now();
    const poll = () => {
      if (initPromise) {
        initPromise.then(resolve, resolve);
        return;
      }
      if (phase === "off") return resolve();
      const s = raw();
      if (s) {
        arm(s).then(resolve, resolve);
        return;
      }
      if (Date.now() - started >= waitMs) {
        shutDown();
        return resolve();
      }
      setTimeout(poll, SDK_POLL_MS);
    };
    poll();
  });
}

/**
 * Has the SDK question been settled in the negative — no script, a disabled
 * domain, a failed init? Then nothing platform-side is ever coming, and a
 * caller waiting on it (the save mirror) can stop waiting.
 */
export function sdkUnavailable(): boolean {
  armIfSeen();
  return phase === "off";
}

/**
 * The platform's own storage, once the SDK is ready for it. CrazyGames serves
 * the game from an iframe on someone else's domain, where `localStorage` can
 * be partitioned, emptied between visits, or refused outright — this module
 * is the save that survives that. Null before init and everywhere off-platform,
 * so every caller has to cope with null.
 */
export function sdkData(): CrazyData | null {
  armIfSeen();
  if (phase !== "ready") return null;
  const d = raw()?.data;
  return d && typeof d.getItem === "function" && typeof d.setItem === "function" ? d : null;
}

/** Tell the platform we're loading (call as early as possible). */
export function loadingStart() {
  guard(() => {
    const g = raw()?.game;
    return (g?.loadingStart ?? g?.sdkGameLoadingStart)?.();
  });
}

/** Tell the platform loading is done and the game is interactive. */
export function loadingStop() {
  guard(() => {
    const g = raw()?.game;
    return (g?.loadingStop ?? g?.sdkGameLoadingStop)?.();
  });
}

// Only transitions are sent: a board that starts twice (a resumed level, a
// restart after a loss) is one session to the platform, and a stop with
// nothing running is nothing at all.
let playing = false;

/** A board is in front of the player: start, resume, next level, retry. */
export function gameplayStart() {
  if (playing) return;
  playing = true;
  guard(() => raw()?.game?.gameplayStart?.());
}

/** A break: the board ended, or the player left for a menu. Not a tab switch. */
export function gameplayStop() {
  if (!playing) return;
  playing = false;
  guard(() => raw()?.game?.gameplayStop?.());
}

export function happytime() {
  guard(() => raw()?.game?.happytime?.());
}

// --- ads -------------------------------------------------------------------

/**
 * Which world the rewarded buttons live in.
 *   ads     — a real ad plays for the reward (the platform, or local dev).
 *   free    — there is no ad system here (off-platform, or the platform has
 *             ads switched off, as in Basic Launch): the reward is just given,
 *             so the button must not say "watch".
 *   blocked — an ad blocker: the reward is unavailable, and the button says
 *             why instead of pretending.
 */
export type AdsMode = "ads" | "free" | "blocked";

let adsBlocked = false;
let adsOff = false;
const adsListeners = new Set<() => void>();

export function adsMode(): AdsMode {
  if (adsBlocked) return "blocked";
  // Until init has settled nothing can be watched (and `requestRewarded`
  // grants), so a button must not say "watch" yet — a blocked script takes
  // SDK_WAIT_MS to become "off", and a player can lose a board in that time.
  if (phase !== "ready" || adsOff) return "free";
  return "ads";
}

/** Re-render on a change of `adsMode()`; shaped for `useSyncExternalStore`. */
export function subscribeAds(fn: () => void): () => void {
  adsListeners.add(fn);
  return () => {
    adsListeners.delete(fn);
  };
}

function notifyAds() {
  for (const fn of [...adsListeners]) {
    try {
      fn();
    } catch {
      /* a broken listener is not this module's problem */
    }
  }
}

function probeAdblock(s: CrazySDK) {
  const apply = (blocked: unknown) => {
    if (blocked === true && !adsBlocked) {
      adsBlocked = true;
      notifyAds();
    }
  };
  try {
    const out = s.ad?.hasAdblock?.();
    if (isThenable(out)) out.then(apply, () => {});
    else apply(out);
  } catch {
    /* the probe is a courtesy; a failed one changes nothing */
  }
}

/**
 * Classify a failed ad request. Returns true when the failure means *there is
 * no ad system here* — the domain is disabled, or the platform has ads off
 * for everyone (Basic Launch answers every request with
 * `adsDisabledBasicLaunch`) — and latches that so the UI stops offering
 * videos. Anything else (unfilled, an ad blocker, "other") is an ad that
 * didn't play, and returns false.
 */
function noAdSystem(err: unknown): boolean {
  if (isDisabledError(err)) {
    shutDown();
    return true;
  }
  const code = codeOf(err);
  if (code === "adsDisabledBasicLaunch") {
    if (!adsOff) {
      adsOff = true;
      notifyAds();
    }
    return true;
  }
  if (/adblock/i.test(code) && !adsBlocked) {
    adsBlocked = true;
    notifyAds();
  }
  return false;
}

// While an ad is actually on screen the game should be silent and still. The
// listener is the game's, wired by App; the wrapper only says when.
const adBreakListeners = new Set<(showing: boolean) => void>();

/** Called with true when an ad (any kind) starts showing, false when it ends. */
export function onAdBreak(fn: (showing: boolean) => void): () => void {
  adBreakListeners.add(fn);
  return () => {
    adBreakListeners.delete(fn);
  };
}

function setShowing(on: boolean) {
  for (const fn of [...adBreakListeners]) {
    try {
      fn(on);
    } catch {
      /* ignore */
    }
  }
}

// The platform manages interstitial frequency itself (at most one every few
// minutes); this gap only keeps a run of very short boards (Endless) from
// asking after every single one, and — seeded at load — keeps the first
// minute of a session ad-free, which the ad guidelines ask for.
const MIN_AD_GAP_MS = 60_000;
let lastInterstitial = Date.now();

/** Test seam: forget the last interstitial so the next request goes through. */
export function resetAdGap(): void {
  lastInterstitial = 0;
}

// How long we wait for the SDK to say *anything* about a request before
// treating it as a request that isn't going to be answered.
const AD_REQUEST_TIMEOUT_MS = 10_000;
// Once an ad is rolling it owns the screen for as long as it needs; this is
// only a last-resort backstop against a wedged player.
const AD_WATCHDOG_MS = 5 * 60_000;

/**
 * Ask for a midgame ad and resolve once it is over — immediately when no ad
 * can show here. The caller holds the next board until then; audio is muted
 * through `onAdBreak` only while the ad is actually on screen.
 */
export function showInterstitial(): Promise<void> {
  if (phase !== "ready" || adsOff || adsBlocked) return Promise.resolve();
  const now = Date.now();
  if (now - lastInterstitial < MIN_AD_GAP_MS) return Promise.resolve();
  lastInterstitial = now;
  const s = raw();
  const requestAd = s?.ad?.requestAd;
  if (!s?.ad || !requestAd) return Promise.resolve();

  return new Promise((resolve) => {
    let settled = false;
    let showing = false;
    let timer: ReturnType<typeof setTimeout>;
    const settle = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (showing) {
        showing = false;
        setShowing(false);
      }
      resolve();
    };
    const arm = (ms: number) => {
      clearTimeout(timer);
      timer = setTimeout(settle, ms);
    };
    arm(AD_REQUEST_TIMEOUT_MS);
    const fail = (err?: unknown) => {
      noAdSystem(err);
      settle();
    };
    try {
      const out = requestAd.call(s.ad, "midgame", {
        adStarted: () => {
          showing = true;
          setShowing(true);
          arm(AD_WATCHDOG_MS);
        },
        adFinished: settle,
        adError: fail,
      });
      if (isThenable(out)) out.then(undefined, fail);
    } catch (err) {
      fail(err);
    }
  });
}

/**
 * Request a rewarded ad. Resolves true when the reward should be granted.
 *
 * Granted: the ad finished, or there is no ad system here (no SDK, disabled
 * domain, platform-wide ads off) — the reward is the player's, there is just
 * nothing to watch first. Refused: the ad errored, went unfilled, is blocked,
 * or the SDK never answered — nothing was watched, so nothing is owed. It
 * never rejects and always settles.
 */
export function requestRewarded(): Promise<boolean> {
  if (phase !== "ready" || adsOff) return Promise.resolve(true);
  if (adsBlocked) return Promise.resolve(false);
  const s = raw();
  const requestAd = s?.ad?.requestAd;
  if (!s?.ad || !requestAd) return Promise.resolve(true);

  return new Promise((resolve) => {
    let settled = false;
    let showing = false;
    let timer: ReturnType<typeof setTimeout>;
    const settle = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (showing) {
        showing = false;
        setShowing(false);
      }
      resolve(ok);
    };
    const arm = (ms: number, outcome: boolean) => {
      clearTimeout(timer);
      timer = setTimeout(() => settle(outcome), ms);
    };
    arm(AD_REQUEST_TIMEOUT_MS, false);
    const fail = (err?: unknown) => settle(noAdSystem(err));
    try {
      const out = requestAd.call(s.ad, "rewarded", {
        adStarted: () => {
          showing = true;
          setShowing(true);
          // The ad did start; if the SDK then loses the thread, the player
          // still sat through it.
          arm(AD_WATCHDOG_MS, true);
        },
        adFinished: () => settle(true),
        adError: fail,
      });
      if (isThenable(out)) out.then(undefined, fail);
    } catch (err) {
      fail(err);
    }
  });
}

// --- links -----------------------------------------------------------------

/**
 * The address to put on a share card. On the platform that is the game's
 * CrazyGames page (via `inviteLink`, which is what the SDK provides for
 * exactly this), never the bare iframe URL; elsewhere the page itself, minus
 * any query — `?debug` is not something to hand a friend.
 */
export function shareUrl(): string {
  if (phase === "ready" && environment === "crazygames") {
    try {
      const url = raw()?.game?.inviteLink?.({});
      if (typeof url === "string" && /^https?:\/\//i.test(url)) return url;
    } catch {
      /* fall through to the page URL */
    }
  }
  try {
    return location.origin + location.pathname;
  } catch {
    return "";
  }
}
