// Thin, defensive wrapper around the CrazyGames SDK. When the game is embedded
// on CrazyGames, `window.CrazyGames.SDK` exists and these calls drive ads,
// analytics, and the loading lifecycle. Locally (and on GitHub Pages) the SDK
// is absent, so every call is a safe no-op — the game plays identically.
//
// To go live on CrazyGames: add their SDK <script> to index.html and submit the
// build. The hooks below are already wired at the right moments:
//   - gameplayStart/Stop around an active level,
//   - showInterstitial between levels,
//   - requestRewarded for the hint (ad-for-hint),
//   - happytime on a win.

interface CrazySDK {
  init?: () => Promise<void>;
  game?: {
    gameplayStart?: () => void;
    gameplayStop?: () => void;
    happytime?: () => void;
  };
  ad?: {
    requestAd?: (type: "midgame" | "rewarded", callbacks?: Record<string, () => void>) => void;
  };
}

function sdk(): CrazySDK | null {
  try {
    return (window as unknown as { CrazyGames?: { SDK?: CrazySDK } }).CrazyGames?.SDK ?? null;
  } catch {
    return null;
  }
}

export function initSdk() {
  try {
    void sdk()?.init?.();
  } catch {
    /* ignore */
  }
}

export function gameplayStart() {
  try {
    sdk()?.game?.gameplayStart?.();
  } catch {
    /* ignore */
  }
}

export function gameplayStop() {
  try {
    sdk()?.game?.gameplayStop?.();
  } catch {
    /* ignore */
  }
}

export function happytime() {
  try {
    sdk()?.game?.happytime?.();
  } catch {
    /* ignore */
  }
}

export function showInterstitial() {
  try {
    sdk()?.ad?.requestAd?.("midgame");
  } catch {
    /* ignore */
  }
}

/**
 * Request a rewarded ad. Resolves true when the reward should be granted.
 * With no SDK present we resolve true immediately so the reward still works
 * for local/standalone play.
 */
export function requestRewarded(): Promise<boolean> {
  return new Promise((resolve) => {
    const s = sdk();
    if (!s?.ad?.requestAd) {
      resolve(true);
      return;
    }
    try {
      s.ad.requestAd("rewarded", {
        adFinished: () => resolve(true),
        adError: () => resolve(false),
        adStarted: () => {},
      });
    } catch {
      resolve(true);
    }
  });
}
