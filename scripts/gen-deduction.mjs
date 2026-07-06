// Generator for Deduction Grid levels (the pure-logic mode).
//
// A level is an abstract grid of 12 cells split into 4 hidden groups of 3.
// Groups are ANY shapes — they do not have to be connected — so the space of
// layouts is large (12 cells → 15,400 partitions). Some tiles carry a
// plain-text clue about their neighbours:
//
//   deg n : "None / One / Two of my neighbours are in my group"
//   dir   : "The tile above/below/left/right of me is (not) in my group"
//
// A level is fair only if a human-style reasoner — tracking same/different
// relations between cells with counting + transitivity, zero guessing — can
// solve it from the shown clues alone. That also implies a unique solution,
// which we additionally verify by brute-force enumeration.
//
// Run:  node scripts/gen-deduction.mjs   (writes src/deductionLevels.ts)
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Deterministic RNG so the generated file is reproducible.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- geometry ---------------------------------------------------------------
function grid(rows, cols) {
  const N = rows * cols;
  const neighbors = [], dirNbr = [];
  for (let i = 0; i < N; i++) {
    const r = (i / cols) | 0, c = i % cols, ns = [], d = {};
    if (r > 0) { ns.push(i - cols); d.up = i - cols; }
    if (r < rows - 1) { ns.push(i + cols); d.down = i + cols; }
    if (c > 0) { ns.push(i - 1); d.left = i - 1; }
    if (c < cols - 1) { ns.push(i + 1); d.right = i + 1; }
    neighbors.push(ns);
    dirNbr.push(d);
  }
  return { N, neighbors, dirNbr };
}

// All partitions of N cells into 4 unlabeled groups of 3 (15,400 for N=12),
// as colour arrays with canonical labels (group id by first occurrence).
function allPartitions(N) {
  const out = [];
  const color = new Array(N).fill(-1);
  const rec = (gid) => {
    let first = -1;
    for (let i = 0; i < N; i++) if (color[i] < 0) { first = i; break; }
    if (first < 0) { out.push(color.slice()); return; }
    const rest = [];
    for (let i = first + 1; i < N; i++) if (color[i] < 0) rest.push(i);
    for (let a = 0; a < rest.length; a++)
      for (let b = a + 1; b < rest.length; b++) {
        color[first] = color[rest[a]] = color[rest[b]] = gid;
        rec(gid + 1);
        color[first] = color[rest[a]] = color[rest[b]] = -1;
      }
  };
  rec(0);
  return out;
}

// ---- clues ------------------------------------------------------------------
// { cell, kind: "deg", n }                      — n neighbours share my group
// { cell, kind: "dir", dir, same }              — that neighbour is (not) mine
const degOf = (c, color, neighbors) =>
  neighbors[c].reduce((n, j) => n + (color[j] === color[c] ? 1 : 0), 0);

const clueHolds = (clue, color, geo) =>
  clue.kind === "deg"
    ? degOf(clue.cell, color, geo.neighbors) === clue.n
    : (color[geo.dirNbr[clue.cell][clue.dir]] === color[clue.cell]) === clue.same;

// ---- human-style relation solver ---------------------------------------------
// Tracks same/different for every cell pair; propagates counting (each cell has
// exactly 2 group-mates), transitivity, and the neighbour-count clues (which
// also bound group-mates among NON-neighbours to 2−n). No guessing: if it
// reaches a fully-decided consistent state, the level is human-solvable.
function relationSolve(clues, rows, cols) {
  const { N, neighbors, dirNbr } = grid(rows, cols);
  const U = 0, S = 1, D = 2;
  const rel = new Int8Array(N * N); // symmetric, diag unused
  const get = (i, j) => rel[i * N + j];
  let bad = false, changed = true;
  const set = (i, j, v) => {
    const cur = get(i, j);
    if (cur === v) return;
    if (cur !== U) { bad = true; return; }
    rel[i * N + j] = rel[j * N + i] = v;
    changed = true;
  };
  for (const cl of clues)
    if (cl.kind === "dir") set(cl.cell, dirNbr[cl.cell][cl.dir], cl.same ? S : D);

  const countRule = (i, cells, target) => {
    let s = 0, unk = [];
    for (const j of cells) {
      const v = get(i, j);
      if (v === S) s++;
      else if (v === U) unk.push(j);
    }
    if (s > target || s + unk.length < target) { bad = true; return; }
    if (s === target) for (const j of unk) set(i, j, D);
    else if (s + unk.length === target) for (const j of unk) set(i, j, S);
  };

  while (changed && !bad) {
    changed = false;
    // every cell has exactly 2 group-mates overall
    for (let i = 0; i < N && !bad; i++) {
      const others = [];
      for (let j = 0; j < N; j++) if (j !== i) others.push(j);
      countRule(i, others, 2);
    }
    // neighbour-count clues (and their non-neighbour complement)
    for (const cl of clues) {
      if (bad) break;
      if (cl.kind !== "deg") continue;
      const i = cl.cell;
      countRule(i, neighbors[i], cl.n);
      const far = [];
      for (let j = 0; j < N; j++) if (j !== i && !neighbors[i].includes(j)) far.push(j);
      countRule(i, far, 2 - cl.n);
    }
    // transitivity
    for (let i = 0; i < N && !bad; i++)
      for (let j = 0; j < N && !bad; j++) {
        if (j === i || get(i, j) !== S) continue;
        for (let k = 0; k < N; k++) {
          if (k === i || k === j) continue;
          const vjk = get(j, k);
          if (vjk !== U) set(i, k, vjk);
          if (bad) break;
        }
      }
  }
  if (bad) return null;
  for (let i = 0; i < N; i++)
    for (let j = i + 1; j < N; j++) if (get(i, j) === U) return null; // stuck
  // extract the partition
  const color = new Array(N).fill(-1);
  let gid = 0;
  for (let i = 0; i < N; i++) {
    if (color[i] >= 0) continue;
    color[i] = gid;
    for (let j = 0; j < N; j++) if (j !== i && get(i, j) === S) color[j] = gid;
    gid++;
  }
  if (gid !== 4 || color.some((c) => c < 0)) return null;
  return color;
}

const LEVEL_COUNT = 20;

// Difficulty = how many clue tiles are shown. Hard is the minimal set the
// relation solver still cracks; Easy/Medium pad it with extra clues.
const TIER_OF = (k) => (k < 7 ? 1 : k < 14 ? 2 : 3);
const EXTRA = { 1: 4, 2: 2, 3: 0 };

const SHAPES = [[3, 4], [4, 3]];
const levels = [];

for (let k = 0; k < LEVEL_COUNT; k++) {
  const rng = mulberry32(0xc0ffee + k * 7919);
  const [rows, cols] = SHAPES[k % SHAPES.length];
  const geo = grid(rows, cols);
  const { N } = geo;
  const parts = allPartitions(N);

  // Sample solution partitions until the full deg-clue set is relation-solvable.
  let color = null, fullClues = null;
  for (let attempt = 0; attempt < 400; attempt++) {
    const cand = parts[Math.floor(rng() * parts.length)];
    const cl = [...Array(N).keys()].map((c) => ({ cell: c, kind: "deg", n: degOf(c, cand, geo.neighbors) }));
    if (relationSolve(cl, rows, cols)) { color = cand; fullClues = cl; break; }
  }
  if (!color) throw new Error(`no solvable partition found for level ${k}`);

  // Greedy-minimise the clue set (several random orders, keep the smallest).
  let best = fullClues;
  for (let trial = 0; trial < 30; trial++) {
    let cur = [...fullClues];
    const order = [...cur].sort(() => rng() - 0.5);
    for (const cl of order) {
      const without = cur.filter((x) => x !== cl);
      if (relationSolve(without, rows, cols)) cur = without;
    }
    if (cur.length < best.length) best = cur;
  }

  // Pad easier tiers with extra clues (cells not already shown).
  const tier = TIER_OF(k);
  let clues = [...best];
  const shownCells = new Set(clues.map((c) => c.cell));
  let extra = EXTRA[tier];
  for (const cl of fullClues) {
    if (extra <= 0) break;
    if (shownCells.has(cl.cell)) continue;
    clues.push(cl); shownCells.add(cl.cell); extra--;
  }

  // Flavour pass: swap some degree clues for directional ones where the level
  // stays solvable — text variety ("the tile below me is in my group").
  for (const cl of [...clues]) {
    if (cl.kind !== "deg" || rng() < 0.5) continue;
    const dirs = Object.keys(geo.dirNbr[cl.cell]);
    const dir = dirs[Math.floor(rng() * dirs.length)];
    const swap = { cell: cl.cell, kind: "dir", dir, same: color[geo.dirNbr[cl.cell][dir]] === color[cl.cell] };
    const next = clues.map((x) => (x === cl ? swap : x));
    if (relationSolve(next, rows, cols)) clues = next;
  }

  levels.push({ id: `logic-${k + 1}`, rows, cols, tier, clues, solution: color });
}

// ---- hard verification -------------------------------------------------------
for (const lv of levels) {
  const geo = grid(lv.rows, lv.cols);
  const color = lv.solution;
  // every shown clue must actually hold in the solution
  for (const cl of lv.clues) if (!clueHolds(cl, color, geo)) throw new Error(`${lv.id}: clue lies`);
  // human relation solver cracks it with zero guessing
  const solved = relationSolve(lv.clues, lv.rows, lv.cols);
  if (!solved) throw new Error(`${lv.id}: not human-solvable from shown clues`);
  // and brute-force: exactly ONE of all partitions satisfies the clues
  let count = 0;
  for (const p of allPartitions(lv.rows * lv.cols)) if (lv.clues.every((cl) => clueHolds(cl, p, geo))) count++;
  if (count !== 1) throw new Error(`${lv.id}: ${count} solutions from shown clues`);
}
console.log(`clues per level: ${levels.map((l) => l.clues.length).join(",")}`);
console.log(`dir clues per level: ${levels.map((l) => l.clues.filter((c) => c.kind === "dir").length).join(",")}`);

const out = `// AUTO-GENERATED by scripts/gen-deduction.mjs — do not edit by hand.
// Deduction Grid levels: an abstract grid of 12 cells split into 4 hidden
// groups of 3. Groups can be ANY shapes (they do not have to touch). Some
// tiles carry a plain-text clue about their neighbours ("None of my
// neighbours are in my group", "The tile below me is in my group", …). Every
// level is solvable by pure reasoning from its shown clues alone — verified to
// have exactly one solution. Fewer clues = harder (tier 1 Easy … 3 Hard).
// solution[] is the group id (0-3) per cell, row-major (cols per row).

export type DeductionClue =
  | { cell: number; kind: "deg"; n: number }
  | { cell: number; kind: "dir"; dir: "up" | "down" | "left" | "right"; same: boolean };

export interface DeductionLevel {
  id: string;
  rows: number;
  cols: number;
  /** 1 Easy, 2 Medium, 3 Hard — fewer shown clues as the tier rises. */
  tier: number;
  clues: DeductionClue[];
  solution: number[];
}

export const DEDUCTION_LEVELS: DeductionLevel[] = ${JSON.stringify(levels, null, 2)};
`;
writeFileSync(join(ROOT, "src/deductionLevels.ts"), out);
console.log(`wrote src/deductionLevels.ts with ${levels.length} levels`);
