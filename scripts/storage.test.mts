// Persistence. This is the module that decides whether a player who has spent
// a week on the campaign still has it next Tuesday, so the cases pinned here
// are the ones that actually happen inside the CrazyGames iframe:
//
//   • localStorage refused outright, or present-but-throwing (partitioned)
//   • localStorage wiped between visits while the platform still has the save
//   • the SDK arriving several seconds after the game mounts
//
// Each case loads a fresh copy of the module, because "does localStorage work"
// is probed once and cached in module scope.
import assert from "node:assert/strict";

let passed = 0;
async function test(name: string, fn: () => Promise<void> | void) {
  await fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

type Store = { getItem: unknown; setItem: unknown; removeItem: unknown };

/** A working localStorage over a Map. */
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

/** The CrazyGames data module, over a Map. */
function fakeSdkData(seed: Record<string, string> = {}) {
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

let caseId = 0;
async function load(opts: { local?: Store | null; data?: unknown }) {
  const g = globalThis as Record<string, unknown>;
  if (opts.local === null || opts.local === undefined) delete g.localStorage;
  else g.localStorage = opts.local;
  g.window = opts.data ? { CrazyGames: { SDK: { data: opts.data } } } : {};
  return import(`../src/storage.ts?case=${caseId++}`);
}

const PROGRESS = "wordgrid:progress";

await test("no storage at all: the session still works, and says it won't last", async () => {
  const s = await load({});
  s.writeItem(PROGRESS, "{\"stars\":1}");
  assert.equal(s.readItem(PROGRESS), "{\"stars\":1}");
  assert.equal(s.isDurable(), false);
});

await test("a localStorage that throws on write counts as no storage", async () => {
  // Exactly what a partitioned store can look like: the object is there and
  // getItem answers, but writing blows up. Trusting it loses the save silently.
  const s = await load({
    local: {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: () => {},
    },
  });
  assert.equal(s.isDurable(), false);
  s.writeItem(PROGRESS, "kept-in-memory");
  assert.equal(s.readItem(PROGRESS), "kept-in-memory");
});

await test("a working localStorage is durable and is written through", async () => {
  const local = fakeLocal();
  const s = await load({ local: local.api });
  s.writeItem(PROGRESS, "saved");
  assert.equal(s.isDurable(), true);
  assert.equal(local.map.get(PROGRESS), "saved");
  s.removeItem(PROGRESS);
  assert.equal(local.map.has(PROGRESS), false);
  assert.equal(s.readItem(PROGRESS), null);
});

await test("with the platform store present, every write lands in both", async () => {
  const local = fakeLocal();
  const data = fakeSdkData();
  const s = await load({ local: local.api, data: data.api });
  s.writeItem(PROGRESS, "both");
  assert.equal(local.map.get(PROGRESS), "both");
  assert.equal(data.map.get(PROGRESS), "both");
});

await test("a wiped localStorage is recovered from the platform store", async () => {
  // The visit that matters: the browser handed the embed an empty store, and
  // the only copy of a week's progress is the platform's.
  const local = fakeLocal();
  const data = fakeSdkData({ [PROGRESS]: "the-real-save" });
  const s = await load({ local: local.api, data: data.api });
  assert.equal(s.syncSdkStorage(), true);
  assert.equal(s.readItem(PROGRESS), "the-real-save");
  assert.equal(local.map.get(PROGRESS), "the-real-save"); // and put back locally
});

await test("a live local save is never overwritten by a stale platform copy", async () => {
  const local = fakeLocal({ [PROGRESS]: "today" });
  const data = fakeSdkData({ [PROGRESS]: "last-month" });
  const s = await load({ local: local.api, data: data.api });
  assert.equal(s.syncSdkStorage(), false); // nothing adopted
  assert.equal(s.readItem(PROGRESS), "today");
  assert.equal(data.map.get(PROGRESS), "today"); // pushed up instead
});

await test("a local-only save is pushed up before the browser can lose it", async () => {
  const local = fakeLocal({ [PROGRESS]: "mine" });
  const data = fakeSdkData();
  const s = await load({ local: local.api, data: data.api });
  s.syncSdkStorage();
  assert.equal(data.map.get(PROGRESS), "mine");
});

await test("no platform store: syncing is a no-op, not a crash", async () => {
  const local = fakeLocal({ [PROGRESS]: "mine" });
  const s = await load({ local: local.api });
  assert.equal(s.syncSdkStorage(), false);
  assert.equal(s.readItem(PROGRESS), "mine");
});

await test("the mirror waits for an SDK that loads late, then adopts", async () => {
  const local = fakeLocal();
  const data = fakeSdkData({ [PROGRESS]: "late-arrival" });
  const s = await load({ local: local.api });
  let adopted = false;
  const settled: boolean[] = [];
  s.startSdkMirror(
    () => {
      adopted = true;
    },
    (durable: boolean) => settled.push(durable)
  );
  // Durability is answered straight away (localStorage works) but the mirror
  // keeps waiting for the SDK script, which turns up a beat later.
  assert.deepEqual(settled, [true]);
  assert.equal(adopted, false);
  (globalThis as Record<string, unknown>).window = { CrazyGames: { SDK: { data: data.api } } };
  await new Promise((r) => setTimeout(r, 900));
  assert.equal(adopted, true);
  assert.equal(s.readItem(PROGRESS), "late-arrival");
});

await test("with nothing durable, the mirror never claims otherwise", async () => {
  const s = await load({});
  const settled: boolean[] = [];
  const stop = s.startSdkMirror(
    () => {},
    (durable: boolean) => settled.push(durable)
  );
  await new Promise((r) => setTimeout(r, 100));
  stop();
  // It keeps waiting for the SDK rather than crying wolf — the warning is only
  // raised once the poll runs out (~8s), and never says "durable" wrongly.
  assert.deepEqual(settled, []);
  assert.equal(s.isDurable(), false);
  await new Promise((r) => setTimeout(r, 900));
  assert.deepEqual(settled, []); // stopped means stopped
});

console.log(`\n${passed} storage tests passed ✓\n`);
