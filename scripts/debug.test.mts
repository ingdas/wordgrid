// The debug switch. It is the one flag that can hand a player the whole game,
// so how it turns on (the URL, and only the URL), that it does not outlive that
// URL, and what it opens up (every level, every boss door) are pinned here
// rather than eyeballed.
import assert from "node:assert/strict";

// A minimal browser surface, installed before the modules under test are
// imported. The switch reads the query string; localStorage is here for
// progress.ts, which the gating cases go through — the switch itself must
// never touch it, and the cases below check that it doesn't.
const store = new Map<string, string>();
const g = globalThis as Record<string, unknown>;
g.localStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => void store.set(k, String(v)),
  removeItem: (k: string) => void store.delete(k),
};
const location = { search: "" };
g.window = { location };

const { isDebug, setDebug, resetDebugCache, debugRequested } = await import("../src/debug.ts");
// progress.ts reads through src/storage.ts, which keeps its own in-memory copy
// of every key — clearing the fake store alone would leave that copy standing.
const { resetStorageCache } = await import("../src/storage.ts");
const { isUnlocked, keyLockedBoss, loadProgress } = await import("../src/progress.ts");
const { CHAPTERS, LEVELS } = await import("../src/puzzles.ts");

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

/** Start each case from a known state: storage empty, no query, no cache. */
function reset(search = "") {
  store.clear();
  resetStorageCache();
  location.search = search;
  resetDebugCache();
}

test("off unless ?debug is in the URL", () => {
  reset();
  assert.equal(debugRequested(), false);
  assert.equal(isDebug(), false);
});

test("?debug turns it on, for this page only", () => {
  reset("?debug");
  assert.equal(debugRequested(), true);
  assert.equal(isDebug(), true);
  assert.equal(store.has("wordgrid:debug"), false, "the switch must not be written to storage");
  // The next load without the query is an ordinary player's.
  location.search = "";
  resetDebugCache();
  assert.equal(isDebug(), false, "the switch must not outlive the URL that set it");
});

test("?debug rides along with other parameters; ?debug=0 counts as absent", () => {
  reset("?lang=es&debug");
  assert.equal(isDebug(), true);
  reset("?debug=1");
  assert.equal(isDebug(), true);
  reset("?debug=0");
  assert.equal(debugRequested(), false);
  assert.equal(isDebug(), false);
});

test("the Settings toggle flips it live, for this session only", () => {
  reset("?debug");
  setDebug(false);
  assert.equal(isDebug(), false, "no reload should be needed");
  setDebug(true);
  assert.equal(isDebug(), true);
  assert.equal(store.has("wordgrid:debug"), false, "toggling must not write to storage");
  // A reload answers to the URL again, whatever the toggle last said.
  resetDebugCache();
  assert.equal(isDebug(), true);
  setDebug(true);
  location.search = "";
  resetDebugCache();
  assert.equal(isDebug(), false, "an earlier toggle must not be remembered without the query");
});

test("debug opens every level and every boss door", () => {
  reset();
  const p = loadProgress(); // nothing cleared
  const last = LEVELS.length - 1;
  const boss0 = CHAPTERS[0].boss;
  assert.equal(isUnlocked(p, last), false);
  assert.equal(keyLockedBoss(p, boss0), true);

  setDebug(true);
  assert.equal(isUnlocked(p, last), true);
  assert.equal(keyLockedBoss(p, boss0), false);

  // …and turning it off puts the gates straight back, from the same save.
  setDebug(false);
  assert.equal(isUnlocked(p, last), false);
  assert.equal(keyLockedBoss(p, boss0), true);
});

console.log(`\n${passed} debug tests passed ✓\n`);
