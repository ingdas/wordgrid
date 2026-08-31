// Reading the community numbers back out of Umami (src/umamiLevels.ts).
//
// The happy path is two GETs and some arithmetic; what needs pinning is every
// way it can go wrong, because this runs in a game and the analytics box is one
// small container:
//
//   • not configured — no share slug, no requests, no community numbers;
//   • the share flow — a read token minted with no credential, reused rather
//     than re-minted, and never used for another website's numbers;
//   • a struggling server — the second read is skipped when the first fails,
//     failures escalate a cooldown that *survives a reload*, `Retry-After` is
//     honoured, and a config failure (no share) goes quiet for a day instead of
//     retrying all afternoon;
//   • nonsense — a non-array, absurd rows, negative totals, a level number
//     nobody has: sanitised or dropped, never thrown;
//   • the 100-row cap the whole design leans on.
//
// Each case loads a fresh copy of the module; the analytics config and the
// storage it shares are reset between them.
import assert from "node:assert/strict";
import { LEVELS } from "../src/puzzles.ts";
import { resetAnalyticsCache } from "../src/analytics.ts";

let passed = 0;
const rejections: unknown[] = [];
process.on("unhandledRejection", (err) => rejections.push(err));

async function test(name: string, fn: () => Promise<void> | void) {
  await fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const ORIGIN = "https://umami.example.test";
const SCRIPT = `${ORIGIN}/script.js`;
const WEBSITE = "11111111-2222-3333-4444-555555555555";
const SLUG = "abcd1234efgh";
const TOKEN = "share-token-value";

interface Call {
  url: string;
  headers: Record<string, string>;
}

type Reply =
  | { ok: true; json: unknown }
  | { status: number; retryAfter?: string }
  | "throw"
  | "hang";

/** A fetch stand-in driven by a per-URL script, recording what it was asked. */
function fakeFetch(reply: (url: string) => Reply) {
  const calls: Call[] = [];
  const fn = async (url: string, init?: { headers?: Record<string, string>; signal?: AbortSignal }) => {
    calls.push({ url: String(url), headers: init?.headers ?? {} });
    const out = reply(String(url));
    if (out === "throw") throw new Error("network down");
    if (out === "hang") {
      // Resolve only when the module's own AbortController fires, the way a
      // real timeout plays out.
      return new Promise((_, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
      });
    }
    if ("ok" in out) {
      return { ok: true, status: 200, json: async () => out.json, headers: { get: () => null } };
    }
    return {
      ok: false,
      status: out.status,
      json: async () => ({}),
      headers: { get: (h: string) => (h.toLowerCase() === "retry-after" ? (out.retryAfter ?? null) : null) },
    };
  };
  return { calls, fn };
}

/** The aggregate rows Umami answers with: a number property comes back as text. */
function rows(counts: Record<number, number>) {
  return Object.entries(counts).map(([level, total]) => ({ value: `${level}.0000`, total }));
}

let caseId = 0;
const store = new Map<string, string>();

/** Boot a fresh copy of the module against a given configuration. */
async function load(opts: {
  slug?: string | null;
  script?: string | null;
  fetch?: (url: string, init?: unknown) => Promise<unknown>;
  keepStorage?: boolean;
  online?: boolean;
} = {}) {
  const g = globalThis as Record<string, unknown>;
  if (!opts.keepStorage) store.clear();
  g.window = { addEventListener() {}, removeEventListener() {} };
  g.localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
  };
  Object.defineProperty(g, "navigator", { value: { onLine: opts.online ?? true }, configurable: true });
  const script = opts.script === undefined ? SCRIPT : opts.script;
  g.document = {
    querySelector: (sel: string) => {
      if (sel.includes("umami-script")) return script ? { getAttribute: () => script } : null;
      if (sel.includes("umami-website")) return { getAttribute: () => WEBSITE };
      if (sel.includes("umami-share")) {
        const s = opts.slug === undefined ? SLUG : opts.slug;
        return s ? { getAttribute: () => s } : null;
      }
      return null;
    },
    addEventListener() {},
    removeEventListener() {},
    visibilityState: "visible",
  };
  g.fetch = opts.fetch;
  // Both are imported by plain specifier, so every copy of the module under
  // test shares one instance of them.
  (await import("../src/storage.ts")).resetStorageCache();
  resetAnalyticsCache();
  return await import(`../src/umamiLevels.ts?case=${caseId++}`);
}

const shareUrl = (u: string) => u.includes("/api/share/");
const winUrl = (u: string) => u.includes("eventName=level_win");
const lossUrl = (u: string) => u.includes("eventName=level_loss");

// --- the design constraint --------------------------------------------------

await test("the campaign still fits Umami's 100-row answer", () => {
  // `event-data/values` is `order by total desc limit 100` with no paging, and
  // the game groups by `level`. At 101 campaign levels the least-played one
  // would vanish from the aggregate with no error anywhere: switch to
  // /event-data-pivot (it takes pageSize) before growing the campaign.
  assert.ok(
    LEVELS.length <= 100,
    `the campaign has ${LEVELS.length} levels; Umami's values endpoint returns only the top 100`
  );
});

// --- off by default ---------------------------------------------------------

await test("no share slug: nothing is read, and nothing is asked", async () => {
  const { calls, fn } = fakeFetch(() => ({ ok: true, json: [] }));
  const mod = await load({ slug: null, fetch: fn });
  assert.equal(mod.umamiLevelsEnabled(), false);
  assert.equal(await mod.fetchUmamiLevels(), null);
  assert.deepEqual(calls, [], "an unconfigured build must not touch the network");
  assert.equal(mod.umamiLevelsStatus().cooldownUntil, null, "and must not go into a cooldown either");
});

await test("no analytics host, or a junk slug, counts as unconfigured", async () => {
  const a = await load({ script: null });
  assert.equal(a.umamiLevelsEnabled(), false, "no Umami host means no numbers");
  const b = await load({ slug: "https://umami.example.test/share/abcd1234/x" });
  assert.equal(b.umamiLevelsEnabled(), false, "a whole URL pasted into the tag is not a slug");
  const c = await load({ slug: "short" });
  assert.equal(c.umamiLevelsEnabled(), false, "too short to be a share code");
  const d = await load({ slug: `  ${SLUG}  ` });
  assert.equal(d.umamiLevelsEnabled(), true, "whitespace around a real slug is forgiven");
});

// --- the happy path ---------------------------------------------------------

await test("wins and losses become plays, wins and nothing invented", async () => {
  const { calls, fn } = fakeFetch((u) => {
    if (shareUrl(u)) return { ok: true, json: { websiteId: WEBSITE, token: TOKEN } };
    if (winUrl(u)) return { ok: true, json: rows({ 1: 30, 2: 5 }) };
    if (lossUrl(u)) return { ok: true, json: rows({ 1: 10, 3: 4 }) };
    return { status: 404 };
  });
  const mod = await load({ fetch: fn });
  assert.equal(mod.umamiLevelsEnabled(), true);
  const body = await mod.fetchUmamiLevels();

  // The share token is minted first, then exactly two aggregate reads.
  assert.equal(calls.length, 3);
  assert.ok(shareUrl(calls[0].url) && calls[0].url.endsWith(SLUG));
  assert.ok(winUrl(calls[1].url) && lossUrl(calls[2].url), "wins then losses");
  for (const c of calls.slice(1)) {
    assert.equal(c.headers["x-umami-share-token"], TOKEN);
    assert.equal(c.headers["x-umami-share-context"], SLUG, "a share token is refused without a context");
    assert.ok(c.url.includes(`/api/websites/${WEBSITE}/event-data/values`));
    assert.ok(c.url.includes("propertyName=level"));
    assert.match(c.url, /startAt=\d+&endAt=\d+/);
  }

  // Keyed by the level's own id, which is stable across locales.
  const first = LEVELS[0].id;
  const second = LEVELS[1].id;
  const third = LEVELS[2].id;
  assert.deepEqual(body?.levels[first], { players: 0, solvers: 0, plays: 40, wins: 30 });
  assert.deepEqual(body?.levels[second], { players: 0, solvers: 0, plays: 5, wins: 5 });
  assert.deepEqual(body?.levels[third], { players: 0, solvers: 0, plays: 4, wins: 0 });
  assert.equal(LEVELS[3].id in (body?.levels ?? {}), false, "a level nobody has finished gets no row");
  // People counts are the one thing Umami can't answer, and are left at zero
  // for the dashboard to hide.
  assert.equal(body?.levels[first].solvers, 0);
  assert.equal(mod.umamiLevelsStatus().lastError, null);
  assert.equal(mod.umamiLevelsStatus().cooldownUntil, null);
});

await test("the read token is reused, not re-minted per refresh", async () => {
  const { calls, fn } = fakeFetch((u) =>
    shareUrl(u) ? { ok: true, json: { websiteId: WEBSITE, token: TOKEN } } : { ok: true, json: rows({ 1: 1 }) }
  );
  const mod = await load({ fetch: fn });
  await mod.fetchUmamiLevels();
  await mod.fetchUmamiLevels();
  assert.equal(calls.filter((c) => shareUrl(c.url)).length, 1, "one share call for both refreshes");
  assert.equal(calls.length, 5);
});

await test("an empty aggregate is an answer, not a failure", async () => {
  const { fn } = fakeFetch((u) =>
    shareUrl(u) ? { ok: true, json: { websiteId: WEBSITE, token: TOKEN } } : { ok: true, json: [] }
  );
  const mod = await load({ fetch: fn });
  // Nobody has finished a board yet. That must not read as an error anywhere:
  // the caller caches an empty answer and the dashboard says "no numbers yet"
  // rather than "last attempt failed".
  const body = await mod.fetchUmamiLevels();
  assert.deepEqual(body, { levels: {} });
  assert.equal(mod.umamiLevelsStatus().cooldownUntil, null, "nothing to back off from");
  assert.equal(mod.umamiLevelsStatus().lastError, null);
});

// --- a server that is struggling --------------------------------------------

await test("a failed first read skips the second: one request, not two", async () => {
  const { calls, fn } = fakeFetch((u) =>
    shareUrl(u) ? { ok: true, json: { websiteId: WEBSITE, token: TOKEN } } : { status: 500 }
  );
  const mod = await load({ fetch: fn });
  assert.equal(await mod.fetchUmamiLevels(), null);
  assert.equal(calls.filter((c) => winUrl(c.url)).length, 1);
  assert.equal(calls.filter((c) => lossUrl(c.url)).length, 0, "don't pile on a server that just failed");
  assert.equal(mod.umamiLevelsStatus().lastError, "HTTP 500");
  assert.ok(mod.umamiLevelsStatus().cooldownUntil! > Date.now());
});

await test("failures escalate the quiet, and it survives a reload", async () => {
  const { calls, fn } = fakeFetch((u) =>
    shareUrl(u) ? { ok: true, json: { websiteId: WEBSITE, token: TOKEN } } : { status: 502 }
  );
  const mod = await load({ fetch: fn });
  await mod.fetchUmamiLevels();
  const first = mod.umamiLevelsStatus().cooldownUntil!;
  assert.ok(first - Date.now() <= mod.COOLDOWN_MS[0] + 1000);

  // While resting, not a single request goes out.
  const before = calls.length;
  assert.equal(await mod.fetchUmamiLevels(), null);
  assert.equal(calls.length, before, "a cooling-down reader is silent");

  // The page is reloaded: a fresh module, the same storage. Still silent.
  const reloaded = await load({ fetch: fn, keepStorage: true });
  assert.ok(reloaded.umamiLevelsStatus().cooldownUntil! > Date.now(), "the cooldown outlives the page");
  const beforeReload = calls.length;
  assert.equal(await reloaded.fetchUmamiLevels(), null);
  assert.equal(calls.length, beforeReload, "reopening the game is not a way to hammer the server");
});

await test("429 with Retry-After waits as long as it was told", async () => {
  const { fn } = fakeFetch((u) =>
    shareUrl(u)
      ? { ok: true, json: { websiteId: WEBSITE, token: TOKEN } }
      : { status: 429, retryAfter: "7200" }
  );
  const mod = await load({ fetch: fn });
  await mod.fetchUmamiLevels();
  const wait = mod.umamiLevelsStatus().cooldownUntil! - Date.now();
  assert.ok(wait > 2 * 60 * 60 * 1000 - 5000, `honours Retry-After (waited ${wait}ms)`);
  assert.equal(mod.umamiLevelsStatus().lastError, "HTTP 429");
});

await test("an absurd Retry-After is capped, not obeyed", async () => {
  const { fn } = fakeFetch((u) =>
    shareUrl(u)
      ? { ok: true, json: { websiteId: WEBSITE, token: TOKEN } }
      : { status: 503, retryAfter: "99999999" }
  );
  const mod = await load({ fetch: fn });
  await mod.fetchUmamiLevels();
  const wait = mod.umamiLevelsStatus().cooldownUntil! - Date.now();
  assert.ok(wait <= 24 * 60 * 60 * 1000 + 1000, `capped at a day (got ${wait}ms)`);
});

await test("no share (404) rests for a day: it won't fix itself before someone acts", async () => {
  const { calls, fn } = fakeFetch(() => ({ status: 404 }));
  const mod = await load({ fetch: fn });
  assert.equal(await mod.fetchUmamiLevels(), null);
  const wait = mod.umamiLevelsStatus().cooldownUntil! - Date.now();
  assert.ok(wait > 6 * 60 * 60 * 1000, `straight to the longest wait (got ${wait}ms)`);
  assert.equal(mod.umamiLevelsStatus().lastError, "share HTTP 404");
  assert.equal(calls.length, 1, "and it never got as far as asking for numbers");
});

await test("a slug for another website is refused rather than read", async () => {
  const { calls, fn } = fakeFetch((u) =>
    shareUrl(u) ? { ok: true, json: { websiteId: "99999999-9999-9999-9999-999999999999", token: TOKEN } } : { ok: true, json: [] }
  );
  const mod = await load({ fetch: fn });
  assert.equal(await mod.fetchUmamiLevels(), null);
  assert.equal(mod.umamiLevelsStatus().lastError, "share is for another website");
  assert.equal(calls.length, 1, "someone else's numbers are never fetched");
});

await test("a network error and a timeout are the same quiet case", async () => {
  const a = fakeFetch(() => "throw");
  const modA = await load({ fetch: a.fn });
  assert.equal(await modA.fetchUmamiLevels(), null);
  assert.equal(modA.umamiLevelsStatus().lastError, "network");

  const b = fakeFetch((u) => (shareUrl(u) ? { ok: true, json: { websiteId: WEBSITE, token: TOKEN } } : "hang"));
  const modB = await load({ fetch: b.fn });
  const started = Date.now();
  assert.equal(await modB.fetchUmamiLevels(), null);
  const took = Date.now() - started;
  assert.ok(took < modB.REQUEST_TIMEOUT_MS + 2000, `gave up on its own after ${took}ms`);
  assert.equal(modB.umamiLevelsStatus().lastError, "network");
  assert.deepEqual(rejections, [], "a hung request must not surface as an unhandled rejection");
});

// --- the answer is untrusted input -----------------------------------------

await test("nonsense in the aggregate is dropped, not rendered", async () => {
  const junk = [
    { value: "1", total: 12 }, // the one good row
    { value: "0", total: 5 }, // no level 0 any more (the daily's old bucket)
    { value: `${LEVELS.length + 1}`, total: 5 }, // a level that doesn't exist
    { value: "-3", total: 5 },
    { value: "notanumber", total: 5 },
    { value: "2", total: -8 }, // negative attempts
    { value: "2", total: Number.NaN },
    { value: "3", total: "many" },
    null,
    "surprise",
  ];
  const { fn } = fakeFetch((u) =>
    shareUrl(u)
      ? { ok: true, json: { websiteId: WEBSITE, token: TOKEN } }
      : winUrl(u)
        ? { ok: true, json: junk }
        : { ok: true, json: { not: "an array" } }
  );
  const mod = await load({ fetch: fn });
  const body = await mod.fetchUmamiLevels();
  assert.deepEqual(Object.keys(body?.levels ?? {}), [LEVELS[0].id], "only the row that made sense survived");
  assert.deepEqual(body?.levels[LEVELS[0].id], { players: 0, solvers: 0, plays: 12, wins: 12 });
});

await test("tally and shape are pure and clamp on their own", async () => {
  const mod = await load({});
  assert.deepEqual([...mod.tally(rows({ 4: 7 }))], [[4, 7]]);
  assert.deepEqual([...mod.tally(null)], []);
  assert.deepEqual([...mod.tally("nope")], []);
  // A duplicated value (two rows for one level) adds up rather than clobbers.
  assert.deepEqual([...mod.tally([{ value: "4", total: 2 }, { value: "4", total: 3 }])], [[4, 5]]);
  // A level with only losses is a real row with a zero win count.
  const shaped = mod.shape(new Map(), new Map([[2, 3]]));
  assert.deepEqual(shaped.levels[LEVELS[1].id], { players: 0, solvers: 0, plays: 3, wins: 0 });
});

console.log(`\n${passed} umami-levels tests passed`);
