// Unit tests for the pure game engine. No test framework needed:
//   npm test
import assert from "node:assert/strict";
import { evaluateGuess, guessKey, computeStars, shuffle, starsForMistakes, linkMatches } from "../src/engine.ts";
import type { Category } from "../src/puzzles.ts";

const cat = (name: string, spokes: string[]): Category => ({ name, spokes, members: ["LINK", ...spokes] });

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const A = cat("A", ["ONE", "TWO", "THREE"]);
const B = cat("B", ["FOUR", "FIVE", "SIX"]);
const C = cat("C", ["SEVEN", "EIGHT", "NINE"]);

test("evaluateGuess solves an exact spoke set (order-independent)", () => {
  const r = evaluateGuess([A, B], ["THREE", "ONE", "TWO"], new Set());
  assert.equal(r.kind, "solved");
  if (r.kind === "solved") assert.equal(r.category.name, "A");
});

test("evaluateGuess flags a repeat of a known-wrong guess", () => {
  const past = new Set([guessKey(["ONE", "FOUR", "FIVE"])]);
  assert.equal(evaluateGuess([A, B], ["FOUR", "ONE", "FIVE"], past).kind, "repeat");
});

test("evaluateGuess wrong, not one-away when picks span three groups", () => {
  const r = evaluateGuess([A, B, C], ["ONE", "FOUR", "SEVEN"], new Set()); // 1 from each
  assert.equal(r.kind, "wrong");
  if (r.kind === "wrong") assert.equal(r.oneAway, false);
});

test("evaluateGuess flags one-away when two picks share a group", () => {
  const r = evaluateGuess([A, B, C], ["FOUR", "FIVE", "ONE"], new Set()); // FOUR+FIVE are B
  assert.equal(r.kind, "wrong");
  if (r.kind === "wrong") assert.equal(r.oneAway, true);
});

test("guessKey is order-independent", () => {
  assert.equal(guessKey(["B", "A", "C"]), guessKey(["C", "B", "A"]));
});

test("starsForMistakes: 0->3, 1->2, 2+->1", () => {
  assert.equal(starsForMistakes(0), 3);
  assert.equal(starsForMistakes(1), 2);
  assert.equal(starsForMistakes(3), 1);
});

test("computeStars docks for a missed link guess, floor 1", () => {
  assert.equal(computeStars({ mistakes: 0, linkGuessed: true, linkCorrect: true }), 3);
  assert.equal(computeStars({ mistakes: 0, linkGuessed: true, linkCorrect: false }), 2);
  assert.equal(computeStars({ mistakes: 1, linkGuessed: false, linkCorrect: false }), 2);
  assert.equal(computeStars({ mistakes: 3, linkGuessed: true, linkCorrect: false }), 1);
});

test("shuffle preserves the multiset and length", () => {
  const input = ["A", "B", "C", "D", "E"];
  const out = shuffle(input);
  assert.equal(out.length, input.length);
  assert.deepEqual([...out].sort(), [...input].sort());
  assert.deepEqual(input, ["A", "B", "C", "D", "E"]); // input not mutated
});

test("linkMatches: forgiving on case/space/plural, plus synonyms", () => {
  assert.equal(linkMatches("star", "STAR"), true);
  assert.equal(linkMatches("  Star ", "STAR"), true);
  assert.equal(linkMatches("STARS", "STAR"), true); // plural typed
  assert.equal(linkMatches("comet", "STAR"), false);
  assert.equal(linkMatches("", "STAR"), false);
  assert.equal(linkMatches("autumn", "FALL", ["AUTUMN"]), true); // synonym allowed
  assert.equal(linkMatches("winter", "FALL", ["AUTUMN"]), false);
});

console.log(`\n${passed} engine tests passed ✓`);
