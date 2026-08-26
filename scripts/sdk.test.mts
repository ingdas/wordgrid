// The CrazyGames wrapper, pinned against what actually goes wrong on and off
// the platform:
//   - the SDK script is `async` and must be initialised before any call takes,
//     so calls made early have to queue, and a script that lands after React
//     mounts still has to be armed (the first shipped version never called
//     init() at all — a pre-init call latched the wrapper "dead" first);
//   - off-platform the script loads but is disabled (`sdkDisabled`), which must
//     latch quietly and leave the game playing as if there were no SDK;
//   - a rewarded ad that didn't play must not pay, while a place with no ad
//     system at all (Basic Launch, a disabled domain, no SDK) must not strand
//     the player behind a dead button;
//   - an interstitial mutes only while an ad is on screen, and holds the caller
//     until it is gone;
//   - gameplay start/stop send transitions only.
import assert from "node:assert/strict";

let passed = 0;
const rejections: unknown[] = [];
process.on("unhandledRejection", (err) => rejections.push(err));

/** What the real SDK throws when it isn't allowed to run on this domain. */
function disabledError() {
  return Object.assign(new Error("CrazySDK is disabled on this domain. Check docs.crazygames.com for more info."), {
    code: "sdkDisabled",
  });
}
/** What the real SDK throws — synchronously — from any call before init(). */
function notInitializedError() {
  return Object.assign(new Error("CrazySDK is not initialized yet. Check docs.crazygames.com for more info."), {
    code: "sdkNotInitialized",
  });
}
function adError(code: string) {
  return Object.assign(new Error(code), { code });
}

type Callbacks = { adStarted?: () => void; adFinished?: () => void; adError?: (err?: unknown) => void };
type AdScript = (type: string, cb: Callbacks) => void;

const tick = (ms = 0) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * A stand-in for the real v3 object: `environment` reads "uninitialized" and
 * every method throws sdkNotInitialized until init() has resolved — which is
 * exactly how the real one behaves.
 */
function fakeSdk(opts: {
  env?: string;
  initDelay?: number;
  initThrows?: unknown;
  ad?: AdScript;
  hasAdblock?: boolean | Promise<boolean>;
} = {}) {
  const calls: string[] = [];
  const map = new Map<string, string>();
  let ready = false;
  const need = () => {
    if (!ready) throw notInitializedError();
  };
  const game = (name: string) => () => {
    need();
    calls.push(name);
  };
  return {
    calls,
    get environment() {
      return ready ? opts.env ?? "crazygames" : "uninitialized";
    },
    init: async () => {
      if (opts.initDelay) await tick(opts.initDelay);
      if (opts.initThrows) throw opts.initThrows;
      ready = true;
    },
    game: {
      loadingStart: game("loadingStart"),
      loadingStop: game("loadingStop"),
      gameplayStart: game("gameplayStart"),
      gameplayStop: game("gameplayStop"),
      happytime: game("happytime"),
      inviteLink: (params: Record<string, unknown>) => {
        need();
        calls.push("inviteLink");
        return `https://www.crazygames.com/game/wordgrid?invitedById=abc${Object.keys(params).length ? "&x" : ""}`;
      },
    },
    data: {
      getItem: (k: string) => {
        need();
        return map.has(k) ? map.get(k)! : null;
      },
      setItem: (k: string, v: string) => {
        need();
        map.set(k, v);
      },
      removeItem: (k: string) => {
        need();
        map.delete(k);
      },
    },
    ad: {
      requestAd: (type: string, cb: Callbacks = {}) => {
        need();
        calls.push(`requestAd:${type}`);
        opts.ad?.(type, cb);
      },
      hasAdblock: () => opts.hasAdblock ?? false,
    },
  };
}

/**
 * Load a fresh copy of the module (its phase is module-level state) against a
 * given fake `window.CrazyGames.SDK` — or no window.CrazyGames at all.
 */
let caseId = 0;
async function load(sdk: unknown) {
  (globalThis as { window?: unknown }).window = sdk === undefined ? {} : { CrazyGames: { SDK: sdk } };
  return import(`../src/sdk.ts?case=${caseId++}`);
}

async function test(name: string, fn: () => Promise<void>) {
  await fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

/** Resolve the promise or blow up — nothing here may hang the game. */
function settles<T>(p: Promise<T>, ms = 1000): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`did not settle within ${ms}ms`)), ms)),
  ]);
}

// --- init ------------------------------------------------------------------

await test("no SDK at all: calls are no-ops, init gives up, rewards are free", async () => {
  const m = await load(undefined);
  m.gameplayStart(); // must not throw
  await settles(m.initSdk({ waitMs: 120 }));
  assert.equal(m.adsMode(), "free");
  assert.equal(await settles(m.requestRewarded()), true);
  await settles(m.showInterstitial());
  assert.equal(m.sdkData(), null);
});

await test("calls made before init settles are queued and replayed in order", async () => {
  const sdk = fakeSdk({ initDelay: 20 });
  const m = await load(sdk);
  m.loadingStart();
  m.loadingStop();
  m.gameplayStart(); // a first launch drops straight into a level
  assert.deepEqual(sdk.calls, [], "nothing reaches an uninitialised SDK");
  assert.equal(m.adsMode(), "free", "nothing can be watched before init — no 'watch' button yet");
  await settles(m.initSdk());
  assert.deepEqual(sdk.calls, ["loadingStart", "loadingStop", "gameplayStart"]);
  assert.equal(m.adsMode(), "ads");
});

await test("a pre-init call never latches the wrapper dead (the shipped bug)", async () => {
  const sdk = fakeSdk({ initDelay: 10 });
  const m = await load(sdk);
  m.loadingStart();
  await settles(m.initSdk());
  m.happytime();
  assert.deepEqual(sdk.calls, ["loadingStart", "happytime"]);
});

await test("the script landing after mount is still initialised, and gets the queue", async () => {
  const m = await load(undefined);
  const init = m.initSdk({ waitMs: 2000 });
  m.gameplayStart();
  await tick(60);
  const sdk = fakeSdk();
  (globalThis as { window: { CrazyGames?: unknown } }).window.CrazyGames = { SDK: sdk };
  await settles(init);
  assert.deepEqual(sdk.calls, ["gameplayStart"]);
  assert.ok(m.sdkData(), "the data module is there once init has run");
});

await test("a disabled domain latches quietly: nothing sent, nothing asked, rewards free", async () => {
  const sdk = fakeSdk({ env: "disabled" });
  const m = await load(sdk);
  m.gameplayStart();
  await settles(m.initSdk());
  assert.deepEqual(sdk.calls, []);
  assert.equal(m.adsMode(), "free");
  assert.equal(await settles(m.requestRewarded()), true, "watch & continue still works");
  await settles(m.showInterstitial());
  assert.deepEqual(sdk.calls, [], "a disabled SDK isn't asked for ads at all");
  assert.equal(m.sdkData(), null);
});

await test("init throwing sdkDisabled is the same as a disabled domain", async () => {
  const sdk = fakeSdk({ initThrows: disabledError() });
  const m = await load(sdk);
  await settles(m.initSdk());
  m.gameplayStart();
  assert.deepEqual(sdk.calls, []);
  assert.equal(await settles(m.requestRewarded()), true);
});

await test("sdkData is null before init and the live module after", async () => {
  const sdk = fakeSdk({ initDelay: 10 });
  const m = await load(sdk);
  assert.equal(m.sdkData(), null);
  await settles(m.initSdk());
  const data = m.sdkData();
  assert.ok(data);
  data.setItem("k", "v");
  assert.equal(data.getItem("k"), "v");
});

await test("a test double without init() is ready on sight (storage tests lean on this)", async () => {
  const data = { getItem: () => "x", setItem: () => {}, removeItem: () => {} };
  const m = await load({ data });
  assert.equal(m.sdkData(), data);
});

// --- gameplay --------------------------------------------------------------

await test("gameplay start/stop send only transitions", async () => {
  const sdk = fakeSdk();
  const m = await load(sdk);
  await settles(m.initSdk());
  m.gameplayStop(); // nothing running: nothing to say
  m.gameplayStart();
  m.gameplayStart(); // a resumed level is the same session
  m.gameplayStop();
  m.gameplayStop();
  m.gameplayStart();
  assert.deepEqual(sdk.calls, ["gameplayStart", "gameplayStop", "gameplayStart"]);
});

// --- rewarded --------------------------------------------------------------

await test("a rewarded ad that plays pays, and mutes exactly while it shows", async () => {
  const sdk = fakeSdk({
    ad: (_type, cb) => {
      cb.adStarted?.();
      setTimeout(() => cb.adFinished?.(), 5);
    },
  });
  const m = await load(sdk);
  await settles(m.initSdk());
  const breaks: boolean[] = [];
  m.onAdBreak((on: boolean) => breaks.push(on));
  assert.equal(await settles(m.requestRewarded()), true);
  assert.deepEqual(breaks, [true, false]);
  assert.deepEqual(sdk.calls, ["requestAd:rewarded"]);
});

await test("a rewarded ad that fails does not pay, and never mutes", async () => {
  const sdk = fakeSdk({ ad: (_type, cb) => cb.adError?.(adError("unfilled")) });
  const m = await load(sdk);
  await settles(m.initSdk());
  const breaks: boolean[] = [];
  m.onAdBreak((on: boolean) => breaks.push(on));
  assert.equal(await settles(m.requestRewarded()), false);
  assert.deepEqual(breaks, []);
  assert.equal(m.adsMode(), "ads", "an unfilled ad is a bad moment, not a missing ad system");
});

await test("Basic Launch (adsDisabledBasicLaunch) pays out and turns the buttons free", async () => {
  const sdk = fakeSdk({ ad: (_type, cb) => cb.adError?.(adError("adsDisabledBasicLaunch")) });
  const m = await load(sdk);
  await settles(m.initSdk());
  let notified = 0;
  m.subscribeAds(() => notified++);
  assert.equal(await settles(m.requestRewarded()), true, "no ad exists to watch; the reward is the player's");
  assert.equal(m.adsMode(), "free");
  assert.ok(notified >= 1, "the UI is told to drop the clapperboard");
  // Having learned there are no ads here, we stop asking.
  assert.equal(await settles(m.requestRewarded()), true);
  await settles(m.showInterstitial());
  assert.deepEqual(sdk.calls, ["requestAd:rewarded"]);
});

await test("an ad blocker makes rewards unavailable, not free", async () => {
  const sdk = fakeSdk({ hasAdblock: Promise.resolve(true) });
  const m = await load(sdk);
  await settles(m.initSdk());
  await tick();
  assert.equal(m.adsMode(), "blocked");
  assert.equal(await settles(m.requestRewarded()), false);
  await settles(m.showInterstitial());
  assert.deepEqual(sdk.calls, [], "nothing is requested against a blocker");
});

await test("a silent SDK times out to no reward rather than hanging the offer", async () => {
  const sdk = fakeSdk({ ad: () => {} }); // accepts the request, never calls back
  const m = await load(sdk);
  await settles(m.initSdk());
  // The wrapper reads setTimeout off the global at call time, so shrinking it
  // here exercises the timeout without a ten-second test.
  const real = globalThis.setTimeout;
  globalThis.setTimeout = ((fn: () => void, ms?: number) =>
    real(fn, ms && ms > 100 ? 5 : ms)) as typeof globalThis.setTimeout;
  try {
    assert.equal(await settles(m.requestRewarded()), false);
  } finally {
    globalThis.setTimeout = real;
  }
});

// --- interstitial ----------------------------------------------------------

await test("an interstitial holds the caller while it shows, and mutes only then", async () => {
  const sdk = fakeSdk({
    ad: (_type, cb) => {
      cb.adStarted?.();
      setTimeout(() => cb.adFinished?.(), 15);
    },
  });
  const m = await load(sdk);
  await settles(m.initSdk());
  m.resetAdGap();
  const breaks: boolean[] = [];
  m.onAdBreak((on: boolean) => breaks.push(on));
  let over = false;
  const p = m.showInterstitial().then(() => {
    over = true;
  });
  await tick(2);
  assert.equal(over, false, "the next board waits for the ad");
  assert.deepEqual(breaks, [true]);
  await settles(p);
  assert.deepEqual(breaks, [true, false]);
  assert.deepEqual(sdk.calls, ["requestAd:midgame"]);
  // Straight after one, the gap keeps a run of short boards from asking again.
  await settles(m.showInterstitial());
  assert.deepEqual(sdk.calls, ["requestAd:midgame"]);
});

await test("an interstitial that errors resolves at once without ever muting", async () => {
  const sdk = fakeSdk({ ad: (_type, cb) => cb.adError?.(adError("other")) });
  const m = await load(sdk);
  await settles(m.initSdk());
  m.resetAdGap();
  const breaks: boolean[] = [];
  m.onAdBreak((on: boolean) => breaks.push(on));
  await settles(m.showInterstitial());
  assert.deepEqual(breaks, []);
});

await test("interstitials never throw off-platform", async () => {
  const m = await load(fakeSdk({ env: "disabled" }));
  await settles(m.initSdk());
  await settles(m.showInterstitial());
  await settles(m.showInterstitial());
});

// --- share -----------------------------------------------------------------

await test("shareUrl is the CrazyGames page on the platform, the bare page elsewhere", async () => {
  (globalThis as { location?: unknown }).location = {
    origin: "https://ingdas.github.io",
    pathname: "/wordgrid/",
    href: "https://ingdas.github.io/wordgrid/?debug",
  };
  const on = await load(fakeSdk({ env: "crazygames" }));
  await settles(on.initSdk());
  assert.match(on.shareUrl(), /^https:\/\/www\.crazygames\.com\/game\/wordgrid/);
  const off = await load(fakeSdk({ env: "disabled" }));
  await settles(off.initSdk());
  assert.equal(off.shareUrl(), "https://ingdas.github.io/wordgrid/", "no query — never `?debug`");
});

// A rejected SDK promise we forgot to catch is exactly what put
// `GeneralError: sdkDisabled` in the console.
await new Promise((r) => setTimeout(r, 20));
assert.deepEqual(rejections, [], "no unhandled rejections escaped the wrapper");

console.log(`\n${passed} sdk tests passed ✓\n`);
