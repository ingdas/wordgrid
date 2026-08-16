// The rules of the Logic Grid, in one place.
//
// These definitions are the game: what a clue claims, when it holds, and what
// a human reasoner can force from it. They used to live twice — once in the
// generator, once in the board component — in two languages, with nothing
// checking the two agreed. A drift there is the worst bug this mode can have:
// the board rejects a correct solution and the player has no recourse. So the
// generator (`scripts/gen-deduction.mts`), the board (`src/Deduction.tsx`) and
// the tests (`scripts/deduction.test.mts`) all import from here.
import type { DeductionAxis, DeductionClue, DeductionLineClue } from "./deductionLevels";

export const DIAG_STEP: Record<string, [number, number]> = {
  upLeft: [-1, -1], upRight: [-1, 1], downLeft: [1, -1], downRight: [1, 1],
};
/** Row/column step per direction name, orthogonal and diagonal alike. */
export const DIR_STEP: Record<string, [number, number]> = {
  up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1], ...DIAG_STEP,
};

export interface Geo {
  N: number;
  rows: number;
  cols: number;
  /** Orthogonal neighbours — never diagonal. The mode's central definition. */
  neighbors: number[][];
  dirNbr: Record<string, number>[];
  diagNbr: Record<string, number>[];
  corners: number[];
  lineCells: (axis: DeductionAxis, index: number) => number[];
  lineOf: (axis: DeductionAxis, cell: number) => number;
}

export function grid(rows: number, cols: number): Geo {
  const N = rows * cols;
  const neighbors: number[][] = [];
  const dirNbr: Record<string, number>[] = [];
  const diagNbr: Record<string, number>[] = [];
  const rowCells: number[][] = Array.from({ length: rows }, () => []);
  const colCells: number[][] = Array.from({ length: cols }, () => []);
  for (let i = 0; i < N; i++) {
    const r = Math.floor(i / cols), c = i % cols;
    const ns: number[] = [], d: Record<string, number> = {}, dg: Record<string, number> = {};
    if (r > 0) { ns.push(i - cols); d.up = i - cols; }
    if (r < rows - 1) { ns.push(i + cols); d.down = i + cols; }
    if (c > 0) { ns.push(i - 1); d.left = i - 1; }
    if (c < cols - 1) { ns.push(i + 1); d.right = i + 1; }
    for (const [name, [dr, dc]] of Object.entries(DIAG_STEP)) {
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) dg[name] = rr * cols + cc;
    }
    neighbors.push(ns); dirNbr.push(d); diagNbr.push(dg);
    rowCells[r].push(i); colCells[c].push(i);
  }
  return {
    N, rows, cols, neighbors, dirNbr, diagNbr,
    corners: [0, cols - 1, (rows - 1) * cols, rows * cols - 1],
    lineCells: (axis, index) => (axis === "row" ? rowCells[index] : colCells[index]),
    lineOf: (axis, cell) => (axis === "row" ? Math.floor(cell / cols) : cell % cols),
  };
}

export function pairsOf(cells: number[]): [number, number][] {
  const out: [number, number][] = [];
  for (let a = 0; a < cells.length; a++)
    for (let b = a + 1; b < cells.length; b++) out.push([cells[a], cells[b]]);
  return out;
}

/** Where a `dir`/`diag` clue points. */
export function clueTarget(cl: DeductionClue & { dir: string }, geo: Geo): number {
  return (cl.kind === "dir" ? geo.dirNbr : geo.diagNbr)[cl.cell][cl.dir];
}

/**
 * For a counting clue: the cells it counts over — never the clue's own tile —
 * and every group-mate count it permits. A single-target clue (`dir`/`diag`)
 * counts nothing and returns null.
 */
export function countScope(cl: DeductionClue, geo: Geo): { cells: number[]; targets: number[] } | null {
  switch (cl.kind) {
    case "deg":
      return { cells: geo.neighbors[cl.cell], targets: [cl.n] };
    case "line":
      return { cells: geo.lineCells(cl.axis, geo.lineOf(cl.axis, cl.cell)).filter((j) => j !== cl.cell), targets: [cl.n] };
    case "parity":
      // "counting me, an odd number of this line is in my group": with me in
      // it that's 1 or 3, so 0 or 2 group-mates alongside me.
      return { cells: geo.lineCells(cl.axis, geo.lineOf(cl.axis, cl.cell)).filter((j) => j !== cl.cell), targets: [0, 2] };
    case "corners":
      return { cells: geo.corners.filter((j) => j !== cl.cell), targets: [cl.n] };
    default:
      return null;
  }
}

/** Is this tile clue true of that colouring? */
export function clueHolds(cl: DeductionClue, color: number[], geo: Geo): boolean {
  if (cl.kind === "dir" || cl.kind === "diag") {
    const t = clueTarget(cl, geo);
    return t != null && (color[t] === color[cl.cell]) === cl.same;
  }
  const scope = countScope(cl, geo);
  if (!scope) throw new Error(`unknown clue kind ${(cl as { kind: string }).kind}`);
  const n = scope.cells.reduce((acc, j) => acc + (color[j] === color[cl.cell] ? 1 : 0), 0);
  return scope.targets.includes(n);
}

/** How many pairs in a line share a group — what both line clues are about. */
export function samePairsInLine(ln: DeductionLineClue, color: number[], geo: Geo): number {
  return pairsOf(geo.lineCells(ln.axis, ln.index)).filter(([a, b]) => color[a] === color[b]).length;
}

export function lineClueHolds(ln: DeductionLineClue, color: number[], geo: Geo): boolean {
  return samePairsInLine(ln, color, geo) === (ln.kind === "rainbow" ? 0 : 1);
}

// --- the human-style relation solver ----------------------------------------
// Tracks same/different for every pair of cells and propagates only FORCED
// conclusions: counting over a scope (each cell has exactly 2 group-mates
// overall, plus whatever each clue claims), the pair-count of a "one pair"
// line, and transitivity. No guessing — so if this reaches a fully-decided
// consistent state, a human can get there the same way.

const U = 0, S = 1, D = 2;

export interface SolveResult {
  color: number[];
  /** Propagation passes needed — the mode's difficulty measure. */
  rounds: number;
}

export function relationSolve(
  clues: DeductionClue[],
  lines: DeductionLineClue[],
  rows: number,
  cols: number
): SolveResult | null {
  const geo = grid(rows, cols);
  const { N } = geo;
  const rel = new Int8Array(N * N); // symmetric, diagonal unused
  const get = (i: number, j: number) => rel[i * N + j];
  let bad = false, changed = true, rounds = 0;
  const set = (i: number, j: number, v: number) => {
    const cur = get(i, j);
    if (cur === v) return;
    if (cur !== U) { bad = true; return; }
    rel[i * N + j] = rel[j * N + i] = v;
    changed = true;
  };

  // Clues that name a single other tile are facts, not deductions.
  for (const cl of clues)
    if (cl.kind === "dir" || cl.kind === "diag") set(cl.cell, clueTarget(cl, geo), cl.same ? S : D);
  for (const ln of lines)
    if (ln.kind === "rainbow") for (const [a, b] of pairsOf(geo.lineCells(ln.axis, ln.index))) set(a, b, D);

  /** "Exactly one of `targets` of `cells` shares i's group" — forced moves only. */
  const countRule = (i: number, cells: number[], targets: number[]) => {
    let s = 0; const unk: number[] = [];
    for (const j of cells) {
      const v = get(i, j);
      if (v === S) s++;
      else if (v === U) unk.push(j);
    }
    const feasible = targets.filter((t) => t >= s && t <= s + unk.length);
    if (!feasible.length) { bad = true; return; }
    if (Math.max(...feasible) === s) for (const j of unk) set(i, j, D);
    else if (Math.min(...feasible) === s + unk.length) for (const j of unk) set(i, j, S);
  };

  /** "Exactly one pair among these cells shares a group." */
  const onePairRule = (cells: number[]) => {
    let s = 0; const unk: [number, number][] = [];
    for (const [a, b] of pairsOf(cells)) {
      const v = get(a, b);
      if (v === S) s++;
      else if (v === U) unk.push([a, b]);
    }
    if (s > 1) { bad = true; return; }
    if (s === 1) for (const [a, b] of unk) set(a, b, D);
    else if (unk.length === 1) set(unk[0][0], unk[0][1], S);
    else if (unk.length === 0) bad = true;
  };

  while (changed && !bad) {
    changed = false;
    rounds++;
    // every cell has exactly 2 group-mates overall
    for (let i = 0; i < N && !bad; i++) {
      const others: number[] = [];
      for (let j = 0; j < N; j++) if (j !== i) others.push(j);
      countRule(i, others, [2]);
    }
    // counting clues, each with its complement over everything else
    for (const cl of clues) {
      if (bad) break;
      const scope = countScope(cl, geo);
      if (!scope) continue;
      countRule(cl.cell, scope.cells, scope.targets);
      const inScope = new Set(scope.cells);
      const rest: number[] = [];
      for (let j = 0; j < N; j++) if (j !== cl.cell && !inScope.has(j)) rest.push(j);
      countRule(cl.cell, rest, scope.targets.map((t) => 2 - t));
    }
    for (const ln of lines) {
      if (bad) break;
      if (ln.kind === "onepair") onePairRule(geo.lineCells(ln.axis, ln.index));
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
    for (let j = i + 1; j < N; j++) if (get(i, j) === U) return null; // stuck: needs a guess
  const color = new Array(N).fill(-1);
  let gid = 0;
  for (let i = 0; i < N; i++) {
    if (color[i] >= 0) continue;
    color[i] = gid;
    for (let j = 0; j < N; j++) if (j !== i && get(i, j) === S) color[j] = gid;
    gid++;
  }
  if (gid !== 4 || color.some((c) => c < 0)) return null;
  return { color, rounds };
}

/**
 * Every partition of N cells into 4 unlabeled groups of 3 (15,400 for N=12),
 * as colour arrays canonically labelled by first occurrence. Used by the
 * generator and the tests to prove uniqueness by exhaustion — never at
 * runtime, so it tree-shakes out of the app bundle.
 */
export function allPartitions(N: number): number[][] {
  const out: number[][] = [];
  const color = new Array(N).fill(-1);
  const rec = (gid: number) => {
    let first = -1;
    for (let i = 0; i < N; i++) if (color[i] < 0) { first = i; break; }
    if (first < 0) { out.push(color.slice()); return; }
    const rest: number[] = [];
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

/** How many colourings satisfy every shown clue (should always be exactly 1). */
export function countSolutions(
  clues: DeductionClue[],
  lines: DeductionLineClue[],
  rows: number,
  cols: number
): number {
  const geo = grid(rows, cols);
  let n = 0;
  for (const p of allPartitions(rows * cols))
    if (clues.every((cl) => clueHolds(cl, p, geo)) && lines.every((ln) => lineClueHolds(ln, p, geo))) n++;
  return n;
}
