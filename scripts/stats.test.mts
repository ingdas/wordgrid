// Level tracking. The cases pinned here are the ones that decide whether the
// feature can ship at all, because they are the ones where a telemetry module
// usually starts hurting the game:
//
//   • no endpoint configured (every fork, every local checkout) — nothing is
//     collected, nothing is queued, no request is made;
//   • offline — events keep, and go out on the next connection, in order,
//     exactly once;
//   • a server that is down, slow, or answering with nonsense — the queue is
//     not dropped, the cached community numbers are not lost, and nothing
//     throws into the game;
//   • the aggregate itself, which is the one thing the game renders that came
//     from outside it, and is therefore not trusted.
//
// Each case loads a fresh copy of the module: the endpoint and the anonymous
// id are read once and cached in module scope.
import assert from "node:assert/strict";

let passed = 0;
async function test(name: string, fn: () => Promise<void> | void) {
  await fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const ENDPOINT = "https://stats.example.test";

/** localStorage over a Map, shared across a case so reloads see the same data. */
function fakeLocal(seed: Record<string, string> = {}) {
  const map = new Map(Object.entries(seed));
  return {
    map,
    api: {
      getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
      setItem: (k: string, v: string) => void map.set(k, String(v)),
      removeItem: (k: string) => void map.delete(k),
    },
  };
}

interface Call {
  url: string;
  method: string;
  body?: unknown;
}

/** A fetch stand-in with a scripted outcome, recording what it was asked. */
function fakeFetch(handler: (call: Call) => { ok: boolean; status?: number; json?: unknown } | "throw") {
  const calls: Call[] = [];
  const fn = async (url: string, init?: { method?: string; body?: string }) => {
    const call: Call = {
      url: String(url),
      method: init?.method ?? "GET",
      body: init?.body ? JSON.parse(init.body) : undefined,
    };
    calls.push(call);
    const out = handler(call);
    if (out === "throw") throw new Error("network down");
    return {
      ok: out.ok,
      status: out.status ?? (out.ok ? 200 : 500),
      json: async () => out.json,
    };
  };
  return { calls, fn };
}

let caseId = 0;

/** Boot a fresh copy of stats.ts in a browser-shaped environment. */
async function load(opts: {
  endpoint?: string | null;
  local?: ReturnType<typeof fakeLocal>;
  online?: boolean;
  fetch?: (url: string, init?: unknown) => Promise<unknown>;
}) {
  const g = globalThis as Record<string, unknown>;
  const local = opts.local ?? fakeLocal();
  g.localStorage = local.api;
  g.window = { addEventListener() {}, removeEventListener() {} };
  // Node ships a read-only `navigator` global, so this one has to be defined
  // over the top of it rather than assigned.
  Object.defineProperty(g, "navigator", { value: { onLine: opts.online ?? true }, configurable: true });
  g.document = {
    // The runtime override the committed build uses: a <meta> tag.
    querySelector: (sel: string) =>
      opts.endpoint && sel.includes("wordgrid:stats")
        ? { getAttribute: () => opts.endpoint }
        : null,
    addEventListener() {},
    removeEventListener() {},
    visibilityState: "visible",
  };
  g.fetch = opts.fetch;
  // storage.ts is imported by plain specifier, so every copy of stats.ts
  // shares one instance of it — including its in-memory fallback map and its
  // cached "does localStorage work" probe. Clear both, or a case inherits the
  // last one's saved state.
  (await import("../src/storage.ts")).resetStorageCache();
  const mod = await import(`../src/stats.ts?case=${caseId++}`);
  return { mod, local };
}

// --- off by default ---------------------------------------------------------

await test("no endpoint: nothing is collected, nothing is queued, nothing is sent", async () => {
  const { calls, fn } = fakeFetch(() => ({ ok: true }));
  const { mod, local } = await load({ endpoint: null, fetch: fn });
  assert.equal(mod.statsEnabled(), false);
  mod.trackStart({ id: "lvl-1", level: 1, mode: "campaign" });
  mod.trackFinish({ id: "lvl-1", level: 1, mode: "campaign", won: true, mistakes: 0, timeMs: 1000, stars: 3 });
  mod.startStats();
  await mod.flush();
  await mod.refreshStats(true);
  assert.deepEqual(calls, [], "an untracked build must not touch the network");
  assert.equal(local.map.has("wordgrid:stats-queue"), false, "nothing should be queued, ever");
  assert.equal(mod.communityStats(), null);
  // ...but the player's own record is still kept, so the dashboard has
  // something true to show.
  assert.deepEqual(mod.myStats()["lvl-1"], { plays: 1, wins: 1 });
});

// --- the happy path ---------------------------------------------------------

await test("configured: a finished level goes out as start + win, once", async () => {
  const { calls, fn } = fakeFetch(() => ({ ok: true }));
  const { mod, local } = await load({ endpoint: ENDPOINT, fetch: fn });
  assert.equal(mod.statsEnabled(), true);
  mod.trackStart({ id: "lvl-7", level: 7, mode: "campaign" });
  await new Promise((r) => setTimeout(r, 0));
  mod.trackFinish({ id: "lvl-7", level: 7, mode: "campaign", won: false, mistakes: 4, timeMs: 90_000 });
  await new Promise((r) => setTimeout(r, 0));
  await mod.flush();

  const posts = calls.filter((c) => c.method === "POST");
  assert.ok(posts.length >= 1);
  assert.ok(posts.every((c) => c.url === `${ENDPOINT}/events`));
  const sent = posts.flatMap((c) => (c.body as { events: Record<string, unknown>[] }).events);
  assert.deepEqual(sent.map((e) => e.kind), ["start", "loss"]);
  assert.equal(sent[0].id, "lvl-7");
  assert.equal(sent[1].mistakes, 4);
  // One anonymous id for the install, and it is not the level or the save.
  assert.equal(sent[0].player, sent[1].player);
  assert.ok(String(sent[0].player).length >= 8);
  assert.notEqual(sent[0].uid, sent[1].uid, "every event needs its own id to dedupe on");
  assert.equal(JSON.parse(local.map.get("wordgrid:stats-queue")!).length, 0, "an accepted batch leaves the queue");
});

// --- offline ----------------------------------------------------------------

await test("offline: events keep, and go out intact on the next connection", async () => {
  const local = fakeLocal();
  const dead = fakeFetch(() => "throw");
  {
    const { mod } = await load({ endpoint: ENDPOINT, local, online: false, fetch: dead.fn });
    mod.trackStart({ id: "lvl-3", level: 3, mode: "campaign" });
    mod.trackFinish({ id: "lvl-3", level: 3, mode: "campaign", won: true, mistakes: 1, timeMs: 42_000, stars: 2 });
    await mod.flush();
    assert.deepEqual(dead.calls, [], "known-offline: don't even try");
    assert.equal(JSON.parse(local.map.get("wordgrid:stats-queue")!).length, 2);
    assert.equal(mod.statsStatus().pending, 2);
  }
  // Next session, back online — the same storage, a working server.
  const live = fakeFetch(() => ({ ok: true }));
  const { mod } = await load({ endpoint: ENDPOINT, local, online: true, fetch: live.fn });
  assert.equal(await mod.flush(), true);
  const sent = live.calls.flatMap((c) => (c.body as { events: { id: string; kind: string }[] }).events);
  assert.deepEqual(sent.map((e) => e.kind), ["start", "win"], "queued in order, sent in order");
  assert.equal(JSON.parse(local.map.get("wordgrid:stats-queue")!).length, 0);
});

await test("a dead server keeps the queue; the next flush retries the same events", async () => {
  const local = fakeLocal();
  const down = fakeFetch(() => ({ ok: false, status: 502 }));
  const first = await load({ endpoint: ENDPOINT, local, fetch: down.fn });
  first.mod.trackStart({ id: "lvl-9", level: 9, mode: "campaign" });
  await first.mod.flush();
  assert.equal(first.mod.statsStatus().pending, 1);
  assert.equal(first.mod.statsStatus().lastError, "HTTP 502");

  const up = fakeFetch(() => ({ ok: true }));
  const second = await load({ endpoint: ENDPOINT, local, fetch: up.fn });
  assert.equal(await second.mod.flush(), true);
  const sent = up.calls.flatMap((c) => (c.body as { events: { uid: string }[] }).events);
  assert.equal(sent.length, 1, "the event survived a failed send, and was not duplicated");
});

await test("the queue is capped, dropping the oldest — it can never grow without bound", async () => {
  const { mod } = await load({ endpoint: null });
  const event = (uid: string) =>
    ({ uid, player: "p", id: "x", level: 1, kind: "start", mode: "campaign", at: 0 }) as never;
  let q: { uid: string }[] = [];
  for (let i = 0; i < 10; i++) q = mod.enqueue(q, event(`e${i}`), 4);
  assert.deepEqual(q.map((e) => e.uid), ["e6", "e7", "e8", "e9"]);
});

// --- reading the aggregate --------------------------------------------------

await test("the aggregate is cached, survives a reload, and outlives the network", async () => {
  const local = fakeLocal();
  const body = {
    levels: {
      "lvl-1": { players: 120, solvers: 118, plays: 130, wins: 118 },
      "lvl-2": { players: 90, solvers: 40, plays: 140, wins: 41 },
    },
  };
  const server = fakeFetch((c) => (c.method === "GET" ? { ok: true, json: body } : { ok: true }));
  const first = await load({ endpoint: ENDPOINT, local, fetch: server.fn });
  const snap = await first.mod.refreshStats(true);
  assert.equal(server.calls[0].url, `${ENDPOINT}/levels`);
  assert.equal(snap.levels["lvl-2"].solvers, 40);
  assert.equal(Math.round(first.mod.successRate(snap.levels["lvl-2"])! * 100), 29);

  // A later session with no network at all still has the numbers, dated.
  const offline = fakeFetch(() => "throw");
  const second = await load({ endpoint: ENDPOINT, local, online: false, fetch: offline.fn });
  const cached = second.mod.communityStats();
  assert.equal(cached.levels["lvl-1"].solvers, 118);
  assert.ok(cached.fetchedAt > 0);
  await second.mod.refreshStats(true);
  assert.equal(second.mod.communityStats().levels["lvl-1"].solvers, 118, "a failed refresh must not erase what we had");
});

await test("a thin sample has no rate at all — a percentage from 3 attempts is a lie", async () => {
  const { mod } = await load({ endpoint: null });
  assert.equal(mod.successRate({ players: 3, solvers: 1, plays: 3, wins: 1 }), null);
  assert.equal(mod.successRate(undefined), null);
  assert.equal(mod.successRate({ players: 9, solvers: 4, plays: 10, wins: 4 }), 0.4);
});

await test("the server's answer is not trusted: junk is dropped, impossible counts clamped", async () => {
  const { mod } = await load({ endpoint: null });
  assert.equal(mod.parseLevels(null), null);
  assert.equal(mod.parseLevels({ levels: "everything" }), null);
  const out = mod.parseLevels({
    levels: {
      ok: { players: 10, solvers: 4, plays: 12, wins: 5 },
      liar: { players: 2, solvers: 900, plays: 4, wins: 4000 },
      junk: { players: "many", solvers: null, plays: -3, wins: NaN },
      empty: {},
    },
  });
  assert.deepEqual(out.ok, { players: 10, solvers: 4, plays: 12, wins: 5 });
  assert.deepEqual(out.liar, { players: 2, solvers: 2, plays: 4, wins: 4 });
  assert.equal("junk" in out, false);
  assert.equal("empty" in out, false);
});

await test("this install's own record counts every finished attempt", async () => {
  const { mod } = await load({ endpoint: null });
  let mine = {};
  mine = mod.bumpMine(mine, "lvl-4", false);
  mine = mod.bumpMine(mine, "lvl-4", true);
  assert.deepEqual(mine, { "lvl-4": { plays: 2, wins: 1 } });
});

// --- the module can't hurt the game ----------------------------------------

await test("no fetch, no storage, no DOM: every entry point is still a no-op", async () => {
  const g = globalThis as Record<string, unknown>;
  delete g.localStorage;
  delete g.fetch;
  g.window = {};
  Object.defineProperty(g, "navigator", { value: { onLine: true }, configurable: true });
  g.document = {
    querySelector: () => ({ getAttribute: () => ENDPOINT }),
    addEventListener() {},
    removeEventListener() {},
    visibilityState: "visible",
  };
  (await import("../src/storage.ts")).resetStorageCache();
  const mod = await import(`../src/stats.ts?case=${caseId++}`);
  // Configured, but the platform gives us nothing to work with.
  mod.trackStart({ id: "lvl-1", level: 1, mode: "campaign" });
  mod.trackFinish({ id: "lvl-1", level: 1, mode: "campaign", won: true, mistakes: 0, timeMs: 10, stars: 3 });
  assert.equal(await mod.flush(), false);
  assert.equal(await mod.refreshStats(true), null);
  const stop = mod.startStats();
  stop();
  assert.equal(mod.statsStatus().enabled, true);
});

console.log(`\n${passed} stats tests passed ✓\n`);
