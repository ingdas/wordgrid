// Product analytics (src/analytics.ts), pinned on the cases that decide whether
// a third-party tracker can be in a game at all:
//
//   • not configured (every fork, every local checkout) — no script is put on
//     the page, nothing is buffered, nothing is sent;
//   • configured — the tracker is injected after start with the attributes we
//     rely on (no auto-tracking), everything raised before it lands waits in a
//     capped buffer and goes out behind `identify`, in order, once;
//   • a blocked or unreachable tracker — nothing throws, the buffer keeps, the
//     next `online` tries again;
//   • debug play is never tracked, and a tracker that throws or rejects is the
//     tracker's problem.
//
// Each case loads a fresh copy of the module: the config and the session state
// are read once and cached in module scope.
import assert from "node:assert/strict";
import { resetDebugCache, setDebug } from "../src/debug.ts";

let passed = 0;
const rejections: unknown[] = [];
process.on("unhandledRejection", (err) => rejections.push(err));

async function test(name: string, fn: () => Promise<void> | void) {
  await fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const SCRIPT = "https://umami.example.test/u.js";
const WEBSITE = "0b1e3c2a-1111-2222-3333-444455556666";

const tick = () => new Promise((r) => setTimeout(r, 5));

interface FakeScript {
  src: string;
  async: boolean;
  attrs: Record<string, string>;
  onload: null | (() => void);
  onerror: null | (() => void);
  removed: boolean;
  setAttribute(k: string, v: string): void;
  remove(): void;
}

interface Call {
  fn: "track" | "identify";
  args: unknown[];
}

/** A stand-in for `window.umami`, recording what it was asked. */
function fakeUmami(behaviour: "ok" | "throw" | "reject" = "ok") {
  const calls: Call[] = [];
  const act = (fn: Call["fn"], args: unknown[]) => {
    calls.push({ fn, args });
    if (behaviour === "throw") throw new Error("tracker exploded");
    if (behaviour === "reject") return Promise.reject(new Error("tracker rejected"));
    return Promise.resolve();
  };
  return {
    calls,
    api: {
      track: (...args: unknown[]) => act("track", args),
      identify: (...args: unknown[]) => act("identify", args),
    },
  };
}

let caseId = 0;

/** Boot a fresh copy of analytics.ts in a browser-shaped environment. */
async function load(opts: { script?: string | null; website?: string | null; online?: boolean } = {}) {
  const g = globalThis as Record<string, unknown>;
  const scripts: FakeScript[] = [];
  const listeners: Record<string, Array<() => void>> = {};
  const win: Record<string, unknown> = {
    addEventListener: (type: string, fn: () => void) => {
      (listeners[type] ??= []).push(fn);
    },
    removeEventListener: (type: string, fn: () => void) => {
      listeners[type] = (listeners[type] ?? []).filter((f) => f !== fn);
    },
  };
  g.window = win;
  const store = new Map<string, string>();
  g.localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
  };
  // Node ships a read-only `navigator` global, so this one has to be defined
  // over the top of it rather than assigned.
  Object.defineProperty(g, "navigator", { value: { onLine: opts.online ?? true }, configurable: true });
  g.document = {
    // The runtime override the committed build uses: two <meta> tags.
    querySelector: (sel: string) => {
      if (sel.includes("umami-script")) return opts.script ? { getAttribute: () => opts.script } : null;
      if (sel.includes("umami-website")) return opts.website ? { getAttribute: () => opts.website } : null;
      return null;
    },
    createElement: (tag: string) => {
      assert.equal(tag, "script");
      const el: FakeScript = {
        src: "",
        async: false,
        attrs: {},
        onload: null,
        onerror: null,
        removed: false,
        setAttribute(k, v) {
          this.attrs[k] = v;
        },
        remove() {
          this.removed = true;
        },
      };
      return el;
    },
    head: {
      appendChild: (el: FakeScript) => {
        scripts.push(el);
      },
    },
  };
  (await import("../src/storage.ts")).resetStorageCache();
  const mod = await import(`../src/analytics.ts?case=${caseId++}`);
  return { mod, scripts, listeners, win };
}

/** The tracker script "executed": it defines window.umami, then fires load. */
function land(win: Record<string, unknown>, script: FakeScript, behaviour?: "ok" | "throw" | "reject") {
  const u = fakeUmami(behaviour);
  win.umami = u.api;
  script.onload?.();
  return u;
}

// --- off by default ---------------------------------------------------------

await test("not configured: no script, no buffer, no work", async () => {
  const { mod, scripts } = await load({ script: null, website: null });
  assert.equal(mod.analyticsEnabled(), false);
  const stop = mod.startAnalytics();
  mod.trackScreen("home");
  mod.trackEvent("level_start", { mode: "campaign", level: 1, id: "star" });
  await tick();
  assert.deepEqual(scripts, [], "an unconfigured build must not put a script on the page");
  const s = mod.analyticsStatus();
  assert.equal(s.enabled, false);
  assert.equal(s.buffered, 0, "nothing should be buffered, ever");
  stop();
});

await test("half a config, or a placeholder that isn't a URL, counts as absent", async () => {
  const a = await load({ script: SCRIPT, website: null });
  assert.equal(a.mod.analyticsEnabled(), false, "a script without a website id is off");
  const b = await load({ script: "PUT THE TRACKER URL HERE", website: WEBSITE });
  assert.equal(b.mod.analyticsEnabled(), false, "a placeholder must not become a request");
  const c = await load({ script: `  ${SCRIPT}  `, website: ` ${WEBSITE} ` });
  assert.equal(c.mod.analyticsEnabled(), true, "whitespace around a value is forgiven");
  assert.equal(c.mod.analyticsStatus().script, SCRIPT);
  assert.equal(c.mod.analyticsStatus().website, WEBSITE);
});

// --- the happy path ---------------------------------------------------------

await test("configured: injected after start, silent by itself, buffered until it lands", async () => {
  const { mod, scripts, win } = await load({ script: SCRIPT, website: WEBSITE });
  assert.equal(mod.analyticsEnabled(), true);
  // Raised before start — a screen effect can run before the boot effect.
  mod.trackScreen("home");
  const stop = mod.startAnalytics();
  assert.deepEqual(scripts, [], "the script waits for an idle slot, not the mount");
  mod.trackEvent("level_start", { mode: "campaign", level: 1, id: "star", twist: "none" });
  assert.equal(mod.analyticsStatus().buffered, 2);
  await tick();
  assert.equal(scripts.length, 1, "one tracker script on the page");
  const el = scripts[0];
  assert.equal(el.src, SCRIPT);
  assert.equal(el.async, true);
  assert.equal(el.attrs["data-website-id"], WEBSITE);
  assert.equal(el.attrs["data-auto-track"], "false", "the tracker must not send anything on its own");
  assert.equal(el.attrs["data-do-not-track"], "true");
  assert.equal(mod.analyticsStatus().loaded, false);

  const u = land(win, el);
  assert.equal(mod.analyticsStatus().loaded, true);
  assert.equal(mod.analyticsStatus().buffered, 0, "the buffer drained on load");
  // identify first, with the same anonymous install id level tracking uses.
  assert.equal(u.calls[0].fn, "identify");
  assert.equal(typeof u.calls[0].args[0], "string");
  assert.ok((u.calls[0].args[0] as string).length >= 8);
  // Then the screen, as a virtual pageview that keeps the first real referrer.
  assert.equal(u.calls[1].fn, "track");
  const shape = u.calls[1].args[0] as (d: Record<string, unknown>) => Record<string, unknown>;
  assert.equal(typeof shape, "function");
  const view = shape({ url: "/wordgrid/?x=1", title: "WordGrid", referrer: "https://www.crazygames.com/" });
  assert.equal(view.url, "/home");
  assert.equal(view.title, "Home");
  assert.equal(view.referrer, "https://www.crazygames.com/");
  // Then the event, name + bag, in order.
  assert.equal(u.calls[2].fn, "track");
  assert.deepEqual(u.calls[2].args, ["level_start", { mode: "campaign", level: 1, id: "star", twist: "none" }]);

  // Live now: straight through, and the same screen twice is one view.
  mod.trackScreen("home");
  assert.equal(u.calls.length, 3, "a repeated screen is not a second pageview");
  mod.trackScreen("game");
  assert.equal(u.calls.length, 4);
  const second = (u.calls[3].args[0] as (d: Record<string, unknown>) => Record<string, unknown>)({
    url: "/",
    referrer: "https://www.crazygames.com/",
  });
  assert.equal(second.url, "/game");
  assert.equal(second.referrer, "", "later views don't repeat the referrer");
  mod.trackEvent("hint", { kind: "theme", mode: "campaign", level: 1 });
  assert.deepEqual(u.calls[4].args, ["hint", { kind: "theme", mode: "campaign", level: 1 }]);
  assert.equal(mod.analyticsStatus().handed, 5);
  assert.equal(mod.analyticsStatus().lastError, null);

  // A second start is a no-op — one script, one listener.
  mod.startAnalytics();
  await tick();
  assert.equal(scripts.length, 1);
  stop();
});

await test("the buffer is capped: the oldest events go, the newest survive", async () => {
  const { mod, scripts, win } = await load({ script: SCRIPT, website: WEBSITE });
  const stop = mod.startAnalytics();
  for (let i = 0; i < mod.BUFFER_CAP + 20; i++) mod.trackEvent("hint", { kind: "letter", n: i });
  const s = mod.analyticsStatus();
  assert.equal(s.buffered, mod.BUFFER_CAP);
  assert.equal(s.dropped, 20);
  await tick();
  const u = land(win, scripts[0]);
  const tracked = u.calls.filter((c) => c.fn === "track");
  assert.equal(tracked.length, mod.BUFFER_CAP);
  assert.equal((tracked[0].args[1] as { n: number }).n, 20, "the first survivor is the 21st event");
  assert.equal(mod.analyticsStatus().buffered, 0);
  stop();
});

// --- a tracker that never comes ---------------------------------------------

await test("blocked: nothing throws, the buffer keeps, `online` tries again", async () => {
  const { mod, scripts, listeners, win } = await load({ script: SCRIPT, website: WEBSITE });
  const stop = mod.startAnalytics();
  await tick();
  assert.equal(scripts.length, 1);
  scripts[0].onerror?.(); // an ad blocker, a DNS hole, the host down
  assert.equal(scripts[0].removed, true, "a failed script tag is taken off the page");
  let s = mod.analyticsStatus();
  assert.equal(s.loaded, false);
  assert.equal(s.lastError, "blocked");
  mod.trackEvent("level_win", { mode: "campaign", level: 1, stars: 3 });
  assert.equal(mod.analyticsStatus().buffered, 1, "events keep while the tracker is missing");

  // The connection comes back: one more attempt.
  for (const fn of listeners.online ?? []) fn();
  assert.equal(scripts.length, 2, "an `online` event re-injects the script");
  const u = land(win, scripts[1]);
  s = mod.analyticsStatus();
  assert.equal(s.loaded, true);
  assert.equal(s.lastError, null);
  assert.equal(s.buffered, 0);
  assert.deepEqual(
    u.calls.map((c) => c.fn),
    ["identify", "track"]
  );
  stop();
});

await test("stop: the listener is gone and a second script is never added", async () => {
  const { mod, scripts, listeners } = await load({ script: SCRIPT, website: WEBSITE });
  const stop = mod.startAnalytics();
  await tick();
  assert.equal((listeners.online ?? []).length, 1);
  stop();
  assert.equal((listeners.online ?? []).length, 0);
  scripts[0].onerror?.(); // a failure after stop schedules nothing that lands
  await tick();
  assert.equal(scripts.length, 1);
});

// --- what must never be tracked ---------------------------------------------

await test("a session that starts in debug never even fetches the tracker", async () => {
  const { mod, scripts } = await load({ script: SCRIPT, website: WEBSITE });
  setDebug(true);
  try {
    const stop = mod.startAnalytics();
    await tick();
    assert.deepEqual(scripts, [], "a ?debug page must not put an analytics script on the page");
    // ...and it stays quiet, rather than buffering for a tracker that never comes.
    mod.trackScreen("home");
    mod.trackEvent("level_win", { mode: "campaign", level: 1, stars: 3 });
    assert.equal(mod.analyticsStatus().buffered, 0);
    stop();
  } finally {
    setDebug(false);
    resetDebugCache();
  }
});

await test("debug play is never tracked", async () => {
  const { mod, scripts, win } = await load({ script: SCRIPT, website: WEBSITE });
  const stop = mod.startAnalytics();
  await tick();
  const u = land(win, scripts[0]);
  setDebug(true);
  try {
    mod.trackEvent("level_win", { mode: "campaign", level: 99, stars: 3 });
    mod.trackScreen("levels");
    assert.equal(u.calls.filter((c) => c.fn === "track").length, 0, "a debug session sends no events");
    assert.equal(mod.analyticsStatus().buffered, 0);
  } finally {
    setDebug(false);
    resetDebugCache();
  }
  // Back off debug (the Settings toggle): tracked again.
  mod.trackEvent("hint", { kind: "theme" });
  assert.equal(u.calls.filter((c) => c.fn === "track").length, 1);
  stop();
});

await test("a tracker that throws or rejects is contained", async () => {
  const a = await load({ script: SCRIPT, website: WEBSITE });
  a.mod.startAnalytics();
  a.mod.trackEvent("hint", { kind: "theme" });
  await tick();
  land(a.win, a.scripts[0], "throw");
  a.mod.trackScreen("home");
  a.mod.trackEvent("share", { won: true, method: "copy" });
  assert.equal(a.mod.analyticsStatus().buffered, 0, "a throwing tracker doesn't back up the buffer");

  const b = await load({ script: SCRIPT, website: WEBSITE });
  b.mod.startAnalytics();
  await tick();
  land(b.win, b.scripts[0], "reject");
  b.mod.trackEvent("hint", { kind: "theme" });
  await tick();
  assert.deepEqual(rejections, [], "a rejecting tracker must not surface as an unhandled rejection");
});

await test("property bags are clipped to what we mean to send", async () => {
  const { mod, scripts, win } = await load({ script: SCRIPT, website: WEBSITE });
  mod.startAnalytics();
  await tick();
  const u = land(win, scripts[0]);
  mod.trackEvent("share", {
    long: "x".repeat(500),
    gone: null,
    also: undefined,
    nan: Number.NaN,
    precise: 1.23456789,
    flag: true,
    // @ts-expect-error — a nested object is not part of the contract and is dropped
    nested: { a: 1 },
  });
  const bag = u.calls.at(-1)!.args[1] as Record<string, unknown>;
  assert.equal((bag.long as string).length, 100);
  assert.equal("gone" in bag, false);
  assert.equal("also" in bag, false);
  assert.equal("nested" in bag, false);
  assert.equal(bag.nan, 0);
  assert.equal(bag.precise, 1.2346);
  assert.equal(bag.flag, true);
});

console.log(`\n${passed} analytics tests passed`);
