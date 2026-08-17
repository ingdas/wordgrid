// The debug switch. It is the one flag that can hand a player the whole game,
// so how it turns on (URL, Settings toggle, storage) and what it opens up
// (every level, every boss door) are pinned here rather than eyeballed.
import assert from "node:assert/strict";

// A minimal browser surface, since the switch lives in localStorage and reads
// the query string. Installed before the modules under test are imported.
const store = new Map<string, string>();
const g = globalThis as Record<string, unknown>;
g.localStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => void store.set(k, String(v)),
  removeItem: (k: string) => void store.delete(k),
};
const location = { search: "" };
g.window = { location };

const { isDebug, setDebug, resetDebugCache } = await import("../src/debug.ts");
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
  location.search = search;
  resetDebugCache();
}

test("off unless something turns it on", () => {
  reset();
  assert.equal(isDebug(), false);
});

test("?debug turns it on and is remembered without the query", () => {
  reset("?debug");
  assert.equal(isDebug(), true);
  location.search = "";
  resetDebugCache();
  assert.equal(isDebug(), true, "the switch should outlive the URL that set it");
});

test("?debug=0 turns it back off, and that sticks too", () => {
  reset("?debug");
  assert.equal(isDebug(), true);
  location.search = "?debug=0";
  resetDebugCache();
  assert.equal(isDebug(), false);
  location.search = "";
  resetDebugCache();
  assert.equal(isDebug(), false);
});

test("the Settings toggle flips it live, and persists", () => {
  reset();
  setDebug(true);
  assert.equal(isDebug(), true, "no reload should be needed");
  resetDebugCache();
  assert.equal(isDebug(), true);
  setDebug(false);
  assert.equal(isDebug(), false);
  resetDebugCache();
  assert.equal(isDebug(), false);
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
