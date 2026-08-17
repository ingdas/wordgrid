// The CrazyGames wrapper, pinned against the case that actually bites: the SDK
// script *loads* but is disabled for the domain (local dev, GitHub Pages), so
// every call throws or rejects with `sdkDisabled`. When that happens the
// rewarded flows — watch & continue, hint refill — must still hand the player
// their reward instead of hanging on a spinner or silently declining.
import assert from "node:assert/strict";

let passed = 0;
const rejections: unknown[] = [];
process.on("unhandledRejection", (err) => rejections.push(err));

/** Errors thrown by the real SDK when it isn't allowed to run here. */
function disabledError() {
  return Object.assign(new Error("CrazySDK is disabled on this domain. Check docs.crazygames.com for more info."), {
    code: "sdkDisabled",
  });
}

type Callbacks = Record<string, (err?: unknown) => void>;

/**
 * Load a fresh copy of the module (its "this domain is dead" flag is
 * module-level state) against a given fake `window.CrazyGames.SDK`.
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

/** Resolve the promise or blow up — a rewarded request must never hang. */
function settles<T>(p: Promise<T>, ms = 1000): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`did not settle within ${ms}ms`)), ms)),
  ]);
}

await test("no SDK at all: the reward is granted immediately", async () => {
  const { requestRewarded, gameplayStart } = await load(undefined);
  gameplayStart(); // must not throw
  assert.equal(await settles(requestRewarded()), true);
});

await test("init reveals the domain is disabled: the SDK is abandoned", async () => {
  let calls = 0;
  const sdk = {
    init: () => {
      throw disabledError();
    },
    game: {
      gameplayStart: () => {
        throw disabledError();
      },
    },
    ad: {
      requestAd: () => {
        calls++;
        throw disabledError();
      },
    },
  };
  const { initSdk, gameplayStart, requestRewarded } = await load(sdk);
  initSdk();
  gameplayStart();
  assert.equal(await settles(requestRewarded()), true, "watch & continue still works");
  assert.equal(calls, 0, "a disabled SDK isn't asked for ads at all");
});

await test("requestAd throws sdkDisabled: reward granted, then no more asking", async () => {
  let calls = 0;
  const sdk = {
    ad: {
      requestAd: () => {
        calls++;
        throw disabledError();
      },
    },
  };
  const { requestRewarded } = await load(sdk);
  assert.equal(await settles(requestRewarded()), true, "watch & continue still works");
  assert.equal(calls, 1);
  // Having learned the domain is disabled, we stop poking the SDK entirely.
  assert.equal(await settles(requestRewarded()), true);
  assert.equal(calls, 1, "no second request against a disabled SDK");
});

await test("requestAd rejects and never calls back: reward granted", async () => {
  const sdk = {
    init: () => Promise.reject(disabledError()),
    ad: { requestAd: () => Promise.reject(disabledError()) },
  };
  const { initSdk, requestRewarded } = await load(sdk);
  initSdk();
  assert.equal(await settles(requestRewarded()), true);
});

await test("adError is not a refusal: the reward is still granted", async () => {
  const sdk = {
    ad: {
      requestAd: (_type: string, cb?: Callbacks) => {
        cb?.adError?.(new Error("no fill"));
      },
    },
  };
  const { requestRewarded } = await load(sdk);
  assert.equal(await settles(requestRewarded()), true);
});

await test("a real ad plays through: adStarted then adFinished", async () => {
  const seen: string[] = [];
  const sdk = {
    ad: {
      requestAd: (type: string, cb?: Callbacks) => {
        seen.push(type);
        cb?.adStarted?.();
        setTimeout(() => cb?.adFinished?.(), 5);
      },
    },
  };
  const { requestRewarded } = await load(sdk);
  assert.equal(await settles(requestRewarded()), true);
  assert.deepEqual(seen, ["rewarded"]);
});

await test("a silent SDK times out rather than hanging the offer", async () => {
  const sdk = { ad: { requestAd: () => {} } }; // accepts the request, never calls back
  const { requestRewarded } = await load(sdk);
  // The wrapper reads setTimeout off the global at call time, so shrinking it
  // here lets us exercise the timeout without a five-second test.
  const real = globalThis.setTimeout;
  globalThis.setTimeout = ((fn: () => void, ms?: number) =>
    real(fn, ms && ms > 100 ? 5 : ms)) as typeof globalThis.setTimeout;
  try {
    assert.equal(await settles(requestRewarded()), true);
  } finally {
    globalThis.setTimeout = real;
  }
});

await test("interstitials never throw off-platform", async () => {
  const sdk = {
    ad: {
      requestAd: () => {
        throw disabledError();
      },
    },
  };
  const { showInterstitial } = await load(sdk);
  // Seeded gap means the first call is skipped anyway; either way, no throw.
  showInterstitial();
  showInterstitial();
});

// A rejected SDK promise we forgot to catch is exactly what put
// `GeneralError: sdkDisabled` in the console.
await new Promise((r) => setTimeout(r, 20));
assert.deepEqual(rejections, [], "no unhandled rejections escaped the wrapper");

console.log(`\n${passed} sdk tests passed ✓\n`);
