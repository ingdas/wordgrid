// Chapter-key gating. This is the one system that can take a level AWAY from a
// player, so its rules are pinned here rather than eyeballed in the browser:
// a boss waits for its key, a beaten boss never re-locks, and the campaign can
// always continue even when a key is unsolved.
import assert from "node:assert/strict";
import { CHAPTERS, LEVELS, chapterKey, keyLevels } from "../src/puzzles.ts";
import {
  bankedLetters,
  isUnlocked,
  bossAwaitingKey,
  keyLockedBoss,
  keyReady,
  keySolved,
  loadProgress,
  markSeen,
  newlyUnlocked,
  solveKey,
  unlockedIds,
  type Progress,
} from "../src/progress.ts";

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

/** A save with the given level indices cleared at 3 stars. */
function withCleared(indices: number[], keys: number[] = []): Progress {
  const p = loadProgress(); // no localStorage under node → the fresh default
  const stars: Record<string, number> = {};
  indices.forEach((i) => (stars[LEVELS[i].id] = 3));
  return { ...p, stars, keys, seen: [] };
}

const CH0 = 0;
const boss0 = CHAPTERS[CH0].boss;
const levels0 = keyLevels(CH0);

test("every chapter banks exactly as many letters as its key needs", () => {
  CHAPTERS.forEach((_, ci) => {
    assert.equal(keyLevels(ci).length, chapterKey(ci).length, `chapter ${ci + 1}`);
    assert.ok(!keyLevels(ci).includes(CHAPTERS[ci].boss), "the boss must not bank its own key letter");
  });
});

test("banked letters count cleared non-boss levels, and only those", () => {
  assert.equal(bankedLetters(withCleared([]), CH0), 0);
  assert.equal(bankedLetters(withCleared(levels0.slice(0, 2)), CH0), 2);
  // Clearing the boss (however that happened) never banks a letter.
  assert.equal(bankedLetters(withCleared([boss0]), CH0), 0);
  assert.equal(bankedLetters(withCleared(levels0), CH0), chapterKey(CH0).length);
});

test("the key is only attemptable once every letter is banked", () => {
  assert.equal(keyReady(withCleared(levels0.slice(0, -1)), CH0), false);
  assert.equal(keyReady(withCleared(levels0), CH0), true);
});

test("a boss stays shut until its key is solved, then opens", () => {
  const done = withCleared(levels0);
  assert.equal(keyLockedBoss(done, boss0), true);
  assert.equal(isUnlocked(done, boss0), false, "boss is inside the window but key-locked");

  const opened = solveKey(done, CH0);
  assert.equal(keySolved(opened, CH0), true);
  assert.equal(keyLockedBoss(opened, boss0), false);
  assert.equal(isUnlocked(opened, boss0), true);
});

test("a boss you have already beaten never re-locks", () => {
  // No key solved, but the boss is cleared — e.g. a save from before keys
  // existed. Taking it away would remove something already earned.
  const veteran = withCleared([...levels0, boss0]);
  assert.equal(keyLockedBoss(veteran, boss0), false);
  assert.equal(isUnlocked(veteran, boss0), true);
});

test("only bosses are key-gated", () => {
  const p = withCleared(levels0);
  for (const i of levels0) assert.equal(keyLockedBoss(p, i), false, `level ${i + 1}`);
});

test("only a boss you can actually reach advertises its key", () => {
  // Chapter 1 done but its key unsolved: that boss is genuinely waiting on you.
  const p = withCleared(levels0);
  assert.equal(bossAwaitingKey(p, boss0), true);
  // A later chapter's boss is key-locked too, but it's far outside the window —
  // "go spell a key" would be nonsense advice there, so it must read as locked.
  const later = CHAPTERS[1].boss;
  assert.equal(keyLockedBoss(p, later), true, "still gated");
  assert.equal(bossAwaitingKey(p, later), false, "…but not the binding reason");
});

test("an unsolved key never deadlocks the campaign", () => {
  // The whole chapter cleared except the boss, key unsolved. The player must
  // still be able to keep playing, or the game is over for them.
  let p = withCleared(levels0);
  const playable = LEVELS.map((_, i) => i).filter((i) => i !== boss0 && isUnlocked(p, i));
  assert.ok(
    playable.some((i) => i > boss0),
    "levels past the shut boss must still be reachable",
  );
  // And clearing those keeps the window moving forward.
  p = withCleared([...levels0, boss0 + 1, boss0 + 2]);
  assert.ok(isUnlocked(p, boss0 + 3), "progress past the boss keeps opening new levels");
  assert.equal(isUnlocked(p, boss0), false, "…while the boss itself still waits for its key");
});

test("solving a key gives the boss its own unlock reveal", () => {
  // unlockedIds hides a key-locked boss, so it reads as newly unlocked the
  // moment the key opens it — that's what drives the map's reveal + banner.
  const shut = markSeen(withCleared(levels0));
  assert.ok(!unlockedIds(shut).includes(LEVELS[boss0].id));
  assert.ok(!newlyUnlocked(shut).includes(LEVELS[boss0].id));

  const opened = solveKey(shut, CH0);
  assert.ok(unlockedIds(opened).includes(LEVELS[boss0].id));
  assert.deepEqual(newlyUnlocked(opened), [LEVELS[boss0].id]);
});

test("markSeen only ever grows, and settles", () => {
  const p = solveKey(markSeen(withCleared(levels0)), CH0);
  const once = markSeen(p);
  assert.ok(once.seen.length > p.seen.length, "the freshly opened boss is recorded");
  assert.equal(markSeen(once), once, "a second pass is a no-op (same object)");
  assert.deepEqual(newlyUnlocked(once), []);
});

console.log(`\n${passed} progress tests passed ✓\n`);
