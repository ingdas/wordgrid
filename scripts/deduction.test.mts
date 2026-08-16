// Tests for the Logic Grid's rules and for every level that ships.
//
// Two things must hold or the mode is broken in a way the player can't work
// around: a clue must mean the same thing to the board as it did to the
// generator, and every level must be crackable by forced reasoning alone.
// Both are checked here against src/deductionRules.ts — the single definition
// the generator, the board and these tests all share.
//
//   npm test
import assert from "node:assert/strict";
import {
  clueHolds,
  countScope,
  countSolutions,
  clueTarget,
  grid,
  lineClueHolds,
  relationSolve,
  samePairsInLine,
} from "../src/deductionRules.ts";
import { DEDUCTION_LEVELS } from "../src/deductionLevels.ts";
import type { DeductionClue, DeductionLineClue } from "../src/deductionLevels.ts";

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

// A 3×4 board to reason about by hand:
//   0 1 2 3      A A B B
//   4 5 6 7      A C B C
//   8 9 10 11    D D D C
const G = grid(3, 4);
const COLOR = [0, 0, 1, 1, 0, 2, 1, 2, 3, 3, 3, 2];

// --- geometry ---------------------------------------------------------------

test("neighbours are orthogonal only, and edges have fewer of them", () => {
  assert.deepEqual([...G.neighbors[5]].sort((a, b) => a - b), [1, 4, 6, 9]);
  assert.deepEqual([...G.neighbors[0]].sort((a, b) => a - b), [1, 4]); // corner
  assert.ok(!G.neighbors[5].includes(0)); // diagonal is not a neighbour
});

test("rows, columns and corners are the shapes the clues talk about", () => {
  assert.deepEqual(G.lineCells("row", 1), [4, 5, 6, 7]);
  assert.deepEqual(G.lineCells("col", 2), [2, 6, 10]);
  assert.equal(G.lineOf("row", 6), 1);
  assert.equal(G.lineOf("col", 6), 2);
  assert.deepEqual(G.corners, [0, 3, 8, 11]);
});

test("dir and diag clues point at the right tile", () => {
  assert.equal(clueTarget({ cell: 5, kind: "dir", dir: "up", same: true }, G), 1);
  assert.equal(clueTarget({ cell: 5, kind: "diag", dir: "downRight", same: true }, G), 10);
  assert.equal(G.diagNbr[0].upLeft, undefined); // off the board
});

// --- what each clue kind claims ---------------------------------------------

test("deg counts only same-group orthogonal neighbours", () => {
  // cell 0 (group A) touches 1 (A) and 4 (A) → 2
  assert.ok(clueHolds({ cell: 0, kind: "deg", n: 2 }, COLOR, G));
  assert.ok(!clueHolds({ cell: 0, kind: "deg", n: 1 }, COLOR, G));
  // cell 5 (group C) touches 1,4,6,9 — none of them C → 0
  assert.ok(clueHolds({ cell: 5, kind: "deg", n: 0 }, COLOR, G));
});

test("dir and diag assert one named tile, either way round", () => {
  assert.ok(clueHolds({ cell: 0, kind: "dir", dir: "right", same: true }, COLOR, G)); // 0,1 both A
  assert.ok(clueHolds({ cell: 1, kind: "dir", dir: "right", same: false }, COLOR, G)); // 1 A, 2 B
  assert.ok(clueHolds({ cell: 5, kind: "diag", dir: "downRight", same: false }, COLOR, G)); // 5 C, 10 D
  // 7's up-left is 2: C vs B, so the "not in my group" form is the true one
  assert.ok(clueHolds({ cell: 7, kind: "diag", dir: "upLeft", same: false }, COLOR, G));
  assert.ok(!clueHolds({ cell: 7, kind: "diag", dir: "upLeft", same: true }, COLOR, G));
});

test("line counts group-mates in the rest of my row or column", () => {
  // cell 0 (A) shares row 0 with 1 (A) → one group-mate in the row
  assert.ok(clueHolds({ cell: 0, kind: "line", axis: "row", n: 1 }, COLOR, G));
  // and shares column 0 with 4 (A) → one in the column too
  assert.ok(clueHolds({ cell: 0, kind: "line", axis: "col", n: 1 }, COLOR, G));
  // cell 8 (D) shares row 2 with 9 and 10, both D → two
  assert.ok(clueHolds({ cell: 8, kind: "line", axis: "row", n: 2 }, COLOR, G));
  assert.ok(!clueHolds({ cell: 8, kind: "line", axis: "row", n: 1 }, COLOR, G));
});

test("parity is odd COUNTING the tile itself — 0 or 2 group-mates alongside", () => {
  const scope = countScope({ cell: 0, kind: "parity", axis: "row" }, G)!;
  assert.deepEqual(scope.targets, [0, 2]);
  assert.deepEqual(scope.cells, [1, 2, 3]); // never the tile itself
  // row 2 is D,D,D + C: cell 8 has two group-mates there → 3 counting itself, odd
  assert.ok(clueHolds({ cell: 8, kind: "parity", axis: "row" }, COLOR, G));
  // row 0 is A,A,B,B: cell 0 has one group-mate → 2 counting itself, even
  assert.ok(!clueHolds({ cell: 0, kind: "parity", axis: "row" }, COLOR, G));
});

test("corners counts group-mates among the four corner tiles", () => {
  // corners are 0(A) 3(B) 8(D) 11(C); cell 0's mates are 1 and 4, neither a corner
  assert.ok(clueHolds({ cell: 0, kind: "corners", n: 0 }, COLOR, G));
  // cell 9 (D) has 8 (a corner) in its group
  assert.ok(clueHolds({ cell: 9, kind: "corners", n: 1 }, COLOR, G));
});

test("a counting clue never counts the tile it sits on", () => {
  for (const cl of [
    { cell: 5, kind: "deg", n: 0 },
    { cell: 5, kind: "line", axis: "row", n: 1 },
    { cell: 5, kind: "parity", axis: "col" },
    { cell: 0, kind: "corners", n: 0 },
  ] as DeductionClue[]) {
    assert.ok(!countScope(cl, G)!.cells.includes(cl.cell), `${cl.kind} counts itself`);
  }
});

test("line clues judge the whole line: rainbow = 0 pairs, onepair = exactly 1", () => {
  // row 0 is A,A,B,B → two matching pairs: neither clue holds
  assert.equal(samePairsInLine({ axis: "row", index: 0, kind: "rainbow" }, COLOR, G), 2);
  assert.ok(!lineClueHolds({ axis: "row", index: 0, kind: "rainbow" }, COLOR, G));
  assert.ok(!lineClueHolds({ axis: "row", index: 0, kind: "onepair" }, COLOR, G));
  // row 1 is A,C,B,C → exactly one pair (5 and 7)
  assert.ok(lineClueHolds({ axis: "row", index: 1, kind: "onepair" }, COLOR, G));
  // column 1 is A,C,D → all different
  assert.ok(lineClueHolds({ axis: "col", index: 1, kind: "rainbow" }, COLOR, G));
});

// --- the solver only makes forced moves -------------------------------------

test("the solver refuses a board that would need a guess", () => {
  // One lonely clue leaves the rest of the grid wide open.
  assert.equal(relationSolve([{ cell: 0, kind: "deg", n: 2 }], [], 3, 4), null);
  assert.equal(relationSolve([], [], 3, 4), null);
});

test("the solver rejects contradictory clues instead of inventing an answer", () => {
  const contradiction: DeductionClue[] = [
    { cell: 0, kind: "dir", dir: "right", same: true },
    { cell: 1, kind: "dir", dir: "left", same: false }, // the same pair, both ways
  ];
  assert.equal(relationSolve(contradiction, [], 3, 4), null);
});

test("a rainbow line forbids every pair in it", () => {
  const line: DeductionLineClue = { axis: "row", index: 0, kind: "rainbow" };
  // With row 0 all-different, no colouring that pairs 0 and 1 can survive.
  assert.ok(!lineClueHolds(line, [0, 0, 1, 1, 0, 2, 1, 2, 3, 3, 3, 2], G));
});

// --- every level that ships --------------------------------------------------

test(`all ${DEDUCTION_LEVELS.length} levels: clues are true of their own solution`, () => {
  for (const lv of DEDUCTION_LEVELS) {
    const geo = grid(lv.rows, lv.cols);
    for (const cl of lv.clues)
      assert.ok(clueHolds(cl, lv.solution, geo), `${lv.id}: ${cl.kind} on cell ${cl.cell} is false`);
    for (const ln of lv.lines)
      assert.ok(lineClueHolds(ln, lv.solution, geo), `${lv.id}: ${ln.kind} on ${ln.axis} ${ln.index} is false`);
  }
});

test("all levels: the solution is a real partition into 4 groups of 3", () => {
  for (const lv of DEDUCTION_LEVELS) {
    assert.equal(lv.solution.length, lv.rows * lv.cols, `${lv.id}: wrong cell count`);
    const sizes = [0, 0, 0, 0];
    for (const c of lv.solution) {
      assert.ok(c >= 0 && c < 4, `${lv.id}: colour ${c} out of range`);
      sizes[c]++;
    }
    assert.deepEqual(sizes, [3, 3, 3, 3], `${lv.id}: groups are not all 3`);
  }
});

test("all levels: at most one clue per tile, and every clue is on the board", () => {
  for (const lv of DEDUCTION_LEVELS) {
    const cells = lv.clues.map((c) => c.cell);
    assert.equal(new Set(cells).size, cells.length, `${lv.id}: two clues on one tile`);
    for (const c of cells) assert.ok(c >= 0 && c < lv.rows * lv.cols, `${lv.id}: clue off the board`);
    for (const ln of lv.lines)
      assert.ok(ln.index < (ln.axis === "row" ? lv.rows : lv.cols), `${lv.id}: line clue off the board`);
  }
});

test("all levels: crackable by forced reasoning, landing on the stored solution", () => {
  for (const lv of DEDUCTION_LEVELS) {
    const solved = relationSolve(lv.clues, lv.lines, lv.rows, lv.cols);
    assert.ok(solved, `${lv.id}: needs a guess — no human can solve it as shown`);
    // Group ids are labels, not identities: compare the partition itself.
    const canon = (c: number[]) => {
      const map = new Map<number, number>();
      return c.map((v) => {
        if (!map.has(v)) map.set(v, map.size);
        return map.get(v);
      });
    };
    assert.deepEqual(canon(solved!.color), canon(lv.solution), `${lv.id}: solver found a different answer`);
  }
});

test("all levels: exactly one colouring satisfies the shown clues (brute force)", () => {
  for (const lv of DEDUCTION_LEVELS) {
    const n = countSolutions(lv.clues, lv.lines, lv.rows, lv.cols);
    assert.equal(n, 1, `${lv.id}: ${n} solutions`);
  }
});

test("all levels: the tier chip reflects measured inference depth", () => {
  const depths = DEDUCTION_LEVELS.map((lv) => ({
    tier: lv.tier,
    rounds: relationSolve(lv.clues, lv.lines, lv.rows, lv.cols)!.rounds,
  }));
  for (const t of [1, 2, 3]) assert.ok(depths.some((d) => d.tier === t), `no tier-${t} levels`);
  const mean = (t: number) => {
    const xs = depths.filter((d) => d.tier === t).map((d) => d.rounds);
    return xs.reduce((a, b) => a + b, 0) / xs.length;
  };
  assert.ok(mean(1) <= mean(2), "Easy levels run deeper than Medium ones");
  assert.ok(mean(2) <= mean(3), "Medium levels run deeper than Hard ones");
});

test("the clue vocabulary is introduced gradually, not all at once", () => {
  const kindsOf = (i: number) =>
    new Set([...DEDUCTION_LEVELS[i].clues.map((c) => c.kind), ...DEDUCTION_LEVELS[i].lines.map((l) => l.kind)]);
  const first = new Set<string>();
  for (let i = 0; i < 4; i++) for (const k of kindsOf(i)) first.add(k);
  assert.deepEqual([...first].sort(), ["deg", "dir"], "the opening levels should speak only the first two kinds");
  const all = new Set<string>();
  for (let i = 0; i < DEDUCTION_LEVELS.length; i++) for (const k of kindsOf(i)) all.add(k);
  assert.equal(all.size, 8, `only ${all.size} of the 8 clue kinds are used anywhere`);
});

console.log(`\n${passed} deduction tests passed ✓\n`);
