// Thin, defensive wrapper around the CrazyGames SDK. When the game is embedded
// on CrazyGames, `window.CrazyGames.SDK` exists and these calls drive ads,
// analytics, and the loading lifecycle. Locally (and on GitHub Pages) the SDK
// script is either absent or *present but disabled* — CrazyGames only serves
// domains it knows — so every call has to degrade to a no-op and the game plays
// identically.
//
// The hooks below are wired at the right moments:
//   - gameplayStart/Stop around an active level,
//   - showInterstitial between levels,
//   - requestRewarded for the hint (ad-for-hint) and the second chance,
//   - happytime on a win.

/** The SDK's own key/value store — survives storage partitioning in the embed. */
export interface CrazyData {
  getItem?: (key: string) => string | null;
  setItem?: (key: string, value: string) => void;
  removeItem?: (key: string) => void;
}

interface CrazySDK {
  init?: () => Promise<void> | void;
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
  };
  ad?: {
    requestAd?: (
      type: "midgame" | "rewarded",
      callbacks?: Record<string, (err?: unknown) => void>
    ) => Promise<void> | void;
  };
}

// Set once the SDK tells us it can't work here ("sdkDisabled" on an unknown
// domain, ad blocker, offline). From then on we skip it entirely instead of
// throwing a fresh error — and rewarded flows behave exactly like no-SDK play.
let unusable = false;

function sdk(): CrazySDK | null {
  if (unusable) return null;
  try {
    return (window as unknown as { CrazyGames?: { SDK?: CrazySDK } }).CrazyGames?.SDK ?? null;
  } catch {
    return null;
  }
}

function isThenable(v: unknown): v is Promise<unknown> {
  return typeof (v as { then?: unknown } | null | undefined)?.then === "function";
}

/** "sdkDisabled" means this domain isn't served — nothing here will ever work. */
function isDisabledError(err: unknown): boolean {
  const e = err as { code?: unknown; message?: unknown } | null | undefined;
  const text = `${typeof e?.code === "string" ? e.code : ""} ${
    typeof e?.message === "string" ? e.message : ""
  }`;
  return /sdkdisabled|disabled on this domain|not initialized/i.test(text);
}

function noteError(err: unknown) {
  if (isDisabledError(err)) unusable = true;
}

/**
 * Run an SDK call, swallowing both synchronous throws and rejected promises.
 * The v3 SDK is async: an unhandled rejection is what surfaces the
 * `GeneralError: sdkDisabled` noise in the console off-platform.
 */
function guard(fn: () => unknown) {
  if (unusable) return;
  try {
    const out = fn();
    if (isThenable(out)) out.then(undefined, noteError);
  } catch (err) {
    noteError(err);
  }
}

/**
 * Initialise the SDK. Never rejects — the returned promise settles once the
 * platform has had its say, so callers that need the SDK to be *ready* (the
 * save mirror below) can wait for it without risking an unhandled rejection.
 */
export function initSdk(): Promise<void> {
  return new Promise((resolve) => {
    if (unusable) return resolve();
    try {
      const out = sdk()?.init?.();
      if (isThenable(out)) {
        out.then(
          () => resolve(),
          (err) => {
            noteError(err);
            resolve();
          }
        );
        return;
      }
    } catch (err) {
      noteError(err);
    }
    resolve();
  });
}

/**
 * The platform's own storage, when it's there. CrazyGames serves the game from
 * an iframe on someone else's domain, where `localStorage` can be partitioned,
 * emptied between visits, or refused outright — this module is the save that
 * survives that. Absent everywhere else (local dev, GitHub Pages), so every
 * caller has to cope with null.
 */
export function sdkData(): CrazyData | null {
  const d = sdk()?.data;
  return d && typeof d.getItem === "function" && typeof d.setItem === "function" ? d : null;
}

/** Tell the platform we're loading (call as early as possible). */
export function loadingStart() {
  guard(() => {
    const g = sdk()?.game;
    return (g?.loadingStart ?? g?.sdkGameLoadingStart)?.();
  });
}

/** Tell the platform loading is done and the game is interactive. */
export function loadingStop() {
  guard(() => {
    const g = sdk()?.game;
    return (g?.loadingStop ?? g?.sdkGameLoadingStop)?.();
  });
}

export function gameplayStart() {
  guard(() => sdk()?.game?.gameplayStart?.());
}

export function gameplayStop() {
  guard(() => sdk()?.game?.gameplayStop?.());
}

export function happytime() {
  guard(() => sdk()?.game?.happytime?.());
}

// CrazyGames policy: never show two midgame ads back to back. Levels are short
// (and Endless/Pairs shorter still), so gate the break on a minimum gap rather
// than firing one after every single board.
const MIN_AD_GAP_MS = 60_000;
// Seeded at load so the first minute of a session is also ad-free.
let lastInterstitial = Date.now();

export function showInterstitial() {
  const now = Date.now();
  if (now - lastInterstitial < MIN_AD_GAP_MS) return;
  lastInterstitial = now;
  guard(() => sdk()?.ad?.requestAd?.("midgame"));
}

// How long we wait for the SDK to say *anything* about a rewarded request
// before assuming no ad is coming. A disabled SDK usually throws or rejects,
// but it can also simply never call back — and a request that never settles
// would leave the player on a spinner with no way out.
const AD_CALLBACK_TIMEOUT_MS = 5_000;
// Once an ad is actually rolling it owns the screen for as long as it needs;
// this is only a last-resort backstop against a wedged player.
const AD_WATCHDOG_MS = 5 * 60_000;

/**
 * Request a rewarded ad. Resolves true when the reward should be granted.
 *
 * The reward — a hint refill, the second chance — is the player's, not the ad
 * network's. So every failure path grants it: no SDK (local/GitHub Pages play),
 * an SDK that's disabled on this domain, a blocked or unfilled ad, or an SDK
 * that never calls back at all. It never rejects and always settles.
 */
export function requestRewarded(): Promise<boolean> {
  const s = sdk();
  const requestAd = s?.ad?.requestAd;
  if (!s?.ad || !requestAd) return Promise.resolve(true);

  return new Promise((resolve) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout>;
    const settle = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(ok);
    };
    const arm = (ms: number) => {
      clearTimeout(timer);
      timer = setTimeout(() => settle(true), ms);
    };
    arm(AD_CALLBACK_TIMEOUT_MS);

    try {
      const out = requestAd.call(s.ad, "rewarded", {
        // An ad is on screen: stop counting, the player is watching.
        adStarted: () => arm(AD_WATCHDOG_MS),
        adFinished: () => settle(true),
        adError: (err?: unknown) => {
          noteError(err);
          settle(true);
        },
      });
      if (isThenable(out)) {
        out.then(undefined, (err) => {
          noteError(err);
          settle(true);
        });
      }
    } catch (err) {
      noteError(err);
      settle(true);
    }
  });
}
