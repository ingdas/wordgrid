// Daily quests. Three things can go wrong here and all three cost the player
// something real: a quest pays twice (free hints forever), a quest never pays
// (the card lies), or yesterday's counts carry into today (the card is already
// finished when you open it). Pinned here rather than eyeballed.
import assert from "node:assert/strict";
import {
  QUEST_POOL,
  QUESTS_PER_DAY,
  QUEST_REWARD,
  QUEST_SET_BONUS,
  SET_ID,
  freshQuests,
  questDone,
  questProgress,
  questsDone,
  questsFor,
  recordQuest,
  todaysQuests,
  type QuestState,
} from "../src/quests.ts";

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

/** Play every event a day's three quests ask for, in one go. */
function completeAll(date: string): { state: QuestState; reward: number; setDone: boolean } {
  let state = freshQuests(date);
  let reward = 0;
  let setDone = false;
  for (const def of todaysQuests(date)) {
    for (let i = 0; i < def.goal; i++) {
      const out = recordQuest(state, def.event, date);
      state = out.state;
      reward += out.reward;
      setDone = setDone || out.setDone;
    }
  }
  return { state, reward, setDone };
}

test("the day's draw is three distinct quests", () => {
  const q = todaysQuests("2026-8-19");
  assert.equal(q.length, QUESTS_PER_DAY);
  assert.equal(new Set(q.map((d) => d.id)).size, QUESTS_PER_DAY);
  q.forEach((d) => assert.ok(QUEST_POOL.some((p) => p.id === d.id)));
});

test("the same day always draws the same three", () => {
  const a = todaysQuests("2026-8-19").map((d) => d.id);
  const b = todaysQuests("2026-8-19").map((d) => d.id);
  assert.deepEqual(a, b);
});

test("consecutive days are not the same three", () => {
  // Not a shuffle guarantee — just that the seed actually moves. Checked over a
  // fortnight so one unlucky collision can't pass it.
  let differed = 0;
  for (let d = 1; d <= 14; d++) {
    const today = todaysQuests(`2026-8-${d}`).map((q) => q.id).join();
    const tomorrow = todaysQuests(`2026-8-${d + 1}`).map((q) => q.id).join();
    if (today !== tomorrow) differed++;
  }
  assert.equal(differed, 14);
});

test("an unrelated event moves nothing", () => {
  const date = "2026-8-19";
  const drawn = new Set(todaysQuests(date).map((d) => d.event));
  const absent = QUEST_POOL.find((d) => !drawn.has(d.event));
  if (!absent) return; // every event drawn today; nothing to assert
  const out = recordQuest(freshQuests(date), absent.event, date);
  assert.equal(out.reward, 0);
  assert.deepEqual(out.completed, []);
});

test("a quest pays exactly once, however many times you do it", () => {
  const date = "2026-8-19";
  const def = todaysQuests(date)[0];
  let state = freshQuests(date);
  let paid = 0;
  for (let i = 0; i < def.goal + 4; i++) {
    const out = recordQuest(state, def.event, date);
    state = out.state;
    paid += out.completed.length;
  }
  assert.equal(paid, 1);
  assert.ok(questDone(state, def));
  assert.equal(questProgress(state, def), def.goal); // capped at the goal
});

test("a multi-step quest only pays on the last step", () => {
  const date = "2026-8-19";
  const def = todaysQuests(date).find((d) => d.goal > 1);
  if (!def) return;
  let state = freshQuests(date);
  for (let i = 0; i < def.goal - 1; i++) {
    const out = recordQuest(state, def.event, date);
    state = out.state;
    assert.equal(out.reward, 0);
  }
  const last = recordQuest(state, def.event, date);
  assert.equal(last.completed.length, 1);
  assert.equal(last.reward, QUEST_REWARD);
});

test("finishing all three pays the set bonus, once", () => {
  const date = "2026-8-19";
  const { state, reward, setDone } = completeAll(date);
  assert.ok(setDone);
  assert.equal(reward, QUESTS_PER_DAY * QUEST_REWARD + QUEST_SET_BONUS);
  assert.equal(questsDone(state, date), QUESTS_PER_DAY);
  assert.ok(state.claimed.includes(SET_ID));
  // Anything else that happens today is free of charge.
  const extra = recordQuest(state, todaysQuests(date)[0].event, date);
  assert.equal(extra.reward, 0);
});

test("yesterday's card is not today's", () => {
  const yesterday = "2026-8-18";
  const { state } = completeAll(yesterday);
  const rolled = questsFor(state, "2026-8-19");
  assert.equal(rolled.date, "2026-8-19");
  assert.deepEqual(rolled.counts, {});
  assert.deepEqual(rolled.claimed, []);
  // And recording against the new date rolls over on its own.
  const out = recordQuest(state, todaysQuests("2026-8-19")[0].event, "2026-8-19");
  assert.equal(out.state.date, "2026-8-19");
  assert.ok(out.reward <= QUEST_REWARD + QUEST_SET_BONUS);
});

test("a save with no quests at all starts clean", () => {
  const out = recordQuest(undefined, "solve", "2026-8-19");
  assert.equal(out.state.date, "2026-8-19");
  assert.equal(out.state.counts.solve, 1);
});

test("recording never mutates the state it was given", () => {
  const date = "2026-8-19";
  const before = freshQuests(date);
  const snapshot = JSON.stringify(before);
  recordQuest(before, todaysQuests(date)[0].event, date);
  assert.equal(JSON.stringify(before), snapshot);
});

console.log(`\n${passed} quest tests passed ✓\n`);
