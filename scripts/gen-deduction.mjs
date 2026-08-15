// Generator for Deduction Grid levels (the pure-logic mode).
//
// A level is an abstract grid of 12 cells split into 4 hidden groups of 3.
// Groups are ANY shapes — they do not have to be connected — so the space of
// layouts is large (12 cells → 15,400 partitions).
//
// Clues come in two families. TILE clues sit on a cell and talk about that
// cell's group ("my group-mates" = the other two tiles of my group):
//
//   deg n     : n of my four neighbours are in my group
//   dir       : the tile above/below/left/right of me is (not) in my group
//   diag      : the tile diagonally ↖↗↙↘ of me is (not) in my group
//   line n    : n of my group-mates are in my row / my column
//   parity    : counting me, an odd number of my row / column is in my group
//   corners n : n of my group-mates sit in a corner of the grid
//
// LINE clues sit in a row or column header and talk about that whole line:
//
//   rainbow   : no two tiles in this line share a group
//   onepair   : exactly one pair of tiles in this line shares a group
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
const DIAGS = { upLeft: [-1, -1], upRight: [-1, 1], downLeft: [1, -1], downRight: [1, 1] };

function grid(rows, cols) {
  const N = rows * cols;
  const neighbors = [], dirNbr = [], diagNbr = [];
  const rowCells = Array.from({ length: rows }, () => []);
  const colCells = Array.from({ length: cols }, () => []);
  for (let i = 0; i < N; i++) {
    const r = (i / cols) | 0, c = i % cols, ns = [], d = {}, dg = {};
    if (r > 0) { ns.push(i - cols); d.up = i - cols; }
    if (r < rows - 1) { ns.push(i + cols); d.down = i + cols; }
    if (c > 0) { ns.push(i - 1); d.left = i - 1; }
    if (c < cols - 1) { ns.push(i + 1); d.right = i + 1; }
    for (const [name, [dr, dc]] of Object.entries(DIAGS)) {
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) dg[name] = rr * cols + cc;
    }
    neighbors.push(ns); dirNbr.push(d); diagNbr.push(dg);
    rowCells[r].push(i); colCells[c].push(i);
  }
  const corners = [0, cols - 1, (rows - 1) * cols, rows * cols - 1];
  const lineCells = (axis, index) => (axis === "row" ? rowCells[index] : colCells[index]);
  const lineOf = (axis, i) => (axis === "row" ? (i / cols) | 0 : i % cols);
  return { N, rows, cols, neighbors, dirNbr, diagNbr, rowCells, colCells, corners, lineCells, lineOf };
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

const pairsOf = (cells) => {
  const out = [];
  for (let a = 0; a < cells.length; a++)
    for (let b = a + 1; b < cells.length; b++) out.push([cells[a], cells[b]]);
  return out;
};

// ---- what each clue claims ---------------------------------------------------
// The set of cells a counting clue counts over (never including the cell itself)
// and the group-mate counts it allows.
function countScope(cl, geo) {
  switch (cl.kind) {
    case "deg": return { cells: geo.neighbors[cl.cell], targets: [cl.n] };
    case "line": return { cells: geo.lineCells(cl.axis, geo.lineOf(cl.axis, cl.cell)).filter((j) => j !== cl.cell), targets: [cl.n] };
    // "counting me, an odd number of this line is in my group": with me in it,
    // 1 or 3 → 0 or 2 group-mates alongside.
    case "parity": return { cells: geo.lineCells(cl.axis, geo.lineOf(cl.axis, cl.cell)).filter((j) => j !== cl.cell), targets: [0, 2] };
    case "corners": return { cells: geo.corners.filter((j) => j !== cl.cell), targets: [cl.n] };
    default: return null;
  }
}

function clueHolds(cl, color, geo) {
  if (cl.kind === "dir" || cl.kind === "diag") {
    const t = cl.kind === "dir" ? geo.dirNbr[cl.cell][cl.dir] : geo.diagNbr[cl.cell][cl.dir];
    return t != null && (color[t] === color[cl.cell]) === cl.same;
  }
  const scope = countScope(cl, geo);
  if (!scope) throw new Error(`unknown clue kind ${cl.kind}`);
  const n = scope.cells.reduce((acc, j) => acc + (color[j] === color[cl.cell] ? 1 : 0), 0);
  return scope.targets.includes(n);
}

function lineClueHolds(ln, color, geo) {
  const same = pairsOf(geo.lineCells(ln.axis, ln.index)).filter(([a, b]) => color[a] === color[b]).length;
  return ln.kind === "rainbow" ? same === 0 : same === 1;
}

// ---- human-style relation solver ---------------------------------------------
// Tracks same/different for every cell pair and propagates only FORCED
// conclusions: counting over a scope (each cell has exactly 2 group-mates
// overall, plus whatever each clue claims), the pair-count of a "one pair"
// line, and transitivity. No guessing — if it reaches a fully-decided
// consistent state, a human can get there too.
function relationSolve(clues, lines, rows, cols) {
  const geo = grid(rows, cols);
  const { N } = geo;
  const U = 0, S = 1, D = 2;
  const rel = new Int8Array(N * N); // symmetric, diag unused
  const get = (i, j) => rel[i * N + j];
  let bad = false, changed = true, rounds = 0;
  const set = (i, j, v) => {
    const cur = get(i, j);
    if (cur === v) return;
    if (cur !== U) { bad = true; return; }
    rel[i * N + j] = rel[j * N + i] = v;
    changed = true;
  };

  // Clues that name a single other tile are facts, not deductions.
  for (const cl of clues) {
    if (cl.kind === "dir") set(cl.cell, geo.dirNbr[cl.cell][cl.dir], cl.same ? S : D);
    if (cl.kind === "diag") set(cl.cell, geo.diagNbr[cl.cell][cl.dir], cl.same ? S : D);
  }
  for (const ln of lines)
    if (ln.kind === "rainbow") for (const [a, b] of pairsOf(geo.lineCells(ln.axis, ln.index))) set(a, b, D);

  // "Exactly `targets` of `cells` share i's group" — forced moves only.
  const countRule = (i, cells, targets) => {
    let s = 0; const unk = [];
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

  // "Exactly one pair among these cells shares a group."
  const onePairRule = (cells) => {
    let s = 0; const unk = [];
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

  const complementOf = (i, cells, targets) => {
    const inScope = new Set(cells);
    const rest = [];
    for (let j = 0; j < N; j++) if (j !== i && !inScope.has(j)) rest.push(j);
    return { rest, targets: targets.map((t) => 2 - t) };
  };

  while (changed && !bad) {
    changed = false;
    rounds++;
    // every cell has exactly 2 group-mates overall
    for (let i = 0; i < N && !bad; i++) {
      const others = [];
      for (let j = 0; j < N; j++) if (j !== i) others.push(j);
      countRule(i, others, [2]);
    }
    // counting clues, each with its complement over everything else
    for (const cl of clues) {
      if (bad) break;
      const scope = countScope(cl, geo);
      if (!scope) continue;
      countRule(cl.cell, scope.cells, scope.targets);
      const comp = complementOf(cl.cell, scope.cells, scope.targets);
      countRule(cl.cell, comp.rest, comp.targets);
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
  return { color, rounds };
}

// ---- candidate clues ---------------------------------------------------------
// Every true tile clue for a cell, and every true line clue for the board.
function tileCandidates(cell, color, geo) {
  const out = [];
  const mates = (cells) => cells.reduce((n, j) => n + (color[j] === color[cell] ? 1 : 0), 0);
  out.push({ cell, kind: "deg", n: mates(geo.neighbors[cell]) });
  for (const dir of Object.keys(geo.dirNbr[cell]))
    out.push({ cell, kind: "dir", dir, same: color[geo.dirNbr[cell][dir]] === color[cell] });
  for (const dir of Object.keys(geo.diagNbr[cell]))
    out.push({ cell, kind: "diag", dir, same: color[geo.diagNbr[cell][dir]] === color[cell] });
  for (const axis of ["row", "col"]) {
    const line = geo.lineCells(axis, geo.lineOf(axis, cell)).filter((j) => j !== cell);
    const n = mates(line);
    out.push({ cell, kind: "line", axis, n });
    if ((n + 1) % 2 === 1) out.push({ cell, kind: "parity", axis }); // odd, counting me
  }
  out.push({ cell, kind: "corners", n: mates(geo.corners.filter((j) => j !== cell)) });
  return out;
}

function lineCandidates(color, geo) {
  const out = [];
  for (const axis of ["row", "col"]) {
    const count = axis === "row" ? geo.rows : geo.cols;
    for (let index = 0; index < count; index++) {
      const same = pairsOf(geo.lineCells(axis, index)).filter(([a, b]) => color[a] === color[b]).length;
      if (same === 0) out.push({ axis, index, kind: "rainbow" });
      else if (same === 1) out.push({ axis, index, kind: "onepair" });
    }
  }
  return out;
}

// A player has to learn this alphabet, so the run introduces it a piece at a
// time: the first levels speak only the original two clues, and each band adds
// one kind on top of everything before it. Play order follows the ramp; the
// tier chip still reports measured depth, so an early board can honestly be
// labelled Medium.
const BANDS = [
  { kinds: ["deg", "dir"], lines: [], count: 4 },
  { kinds: ["deg", "dir", "diag"], lines: [], count: 4, introduces: "diag" },
  { kinds: ["deg", "dir", "diag", "line"], lines: [], count: 4, introduces: "line" },
  { kinds: ["deg", "dir", "diag", "line", "parity"], lines: [], count: 4, introduces: "parity" },
  { kinds: ["deg", "dir", "diag", "line", "parity", "corners"], lines: [], count: 4, introduces: "corners" },
  { kinds: ["deg", "dir", "diag", "line", "parity", "corners"], lines: ["rainbow"], count: 5, introduces: "rainbow" },
  { kinds: ["deg", "dir", "diag", "line", "parity", "corners"], lines: ["rainbow", "onepair"], count: 5, introduces: "onepair" },
];
const LEVEL_COUNT = BANDS.reduce((n, b) => n + b.count, 0);
const SHAPES = [[3, 4], [4, 3]];

// ---- generation --------------------------------------------------------------
const built = [];
let levelSeed = 0;

for (const band of BANDS) {
  const bandLevels = [];
  for (let n = 0; n < band.count; n++) {
    const k = levelSeed++;
    const rng = mulberry32(0xc0ffee + k * 7919);
    const [rows, cols] = SHAPES[k % SHAPES.length];
    const geo = grid(rows, cols);
    const { N } = geo;
    const parts = allPartitions(N);
    const pick = (arr) => arr[Math.floor(rng() * arr.length)];

    // A board carries at most ONE clue per tile (that's all a tile can show),
    // so roll a kind per cell rather than minimising a pool of overlapping
    // clues. Bias the roll towards the kinds this board hasn't used yet, so it
    // doesn't come out as twelve neighbour-counts.
    let chosen = null;
    for (let attempt = 0; attempt < 900 && !chosen; attempt++) {
      const color = pick(parts);
      const used = new Map();
      const cellClues = [];
      for (let cell = 0; cell < N; cell++) {
        const cands = tileCandidates(cell, color, geo).filter((c) => band.kinds.includes(c.kind));
        const rarest = Math.min(...cands.map((c) => used.get(c.kind) ?? 0));
        const pool = cands.filter((c) => (used.get(c.kind) ?? 0) === rarest);
        const cl = pick(pool);
        used.set(cl.kind, (used.get(cl.kind) ?? 0) + 1);
        cellClues.push(cl);
      }
      const lineClues = lineCandidates(color, geo).filter((l) => band.lines.includes(l.kind));
      if (relationSolve(cellClues, lineClues, rows, cols)) chosen = { color, cellClues, lineClues };
    }
    if (!chosen) throw new Error(`no solvable board found for level ${k}`);
    const { color, cellClues, lineClues } = chosen;

    // Greedy-minimise (several random orders). Among the smallest sets, prefer
    // the one using the most different kinds — variety is the point — and, in
    // a band that introduces a kind, one that actually shows it off.
    const shows = (cs, ls) =>
      !band.introduces || cs.some((c) => c.kind === band.introduces) || ls.some((l) => l.kind === band.introduces);
    const score = (cs, ls) =>
      cs.length + ls.length -
      new Set([...cs.map((c) => c.kind), ...ls.map((l) => l.kind)]).size * 0.3 +
      (shows(cs, ls) ? 0 : 6);
    let bestCells = cellClues, bestLines = lineClues, bestScore = Infinity;
    for (let trial = 0; trial < 24; trial++) {
      let cs = [...cellClues], ls = [...lineClues];
      // Dropping the newest kind last keeps it in the minimal set when it earns
      // its place, instead of being the first thing greedily removed.
      const order = [...cs.map((c) => ["c", c]), ...ls.map((l) => ["l", l])]
        .sort(() => rng() - 0.5)
        .sort((a, b) => (a[1].kind === band.introduces ? 1 : 0) - (b[1].kind === band.introduces ? 1 : 0));
      for (const [tag, cl] of order) {
        const nc = tag === "c" ? cs.filter((x) => x !== cl) : cs;
        const nl = tag === "l" ? ls.filter((x) => x !== cl) : ls;
        if (relationSolve(nc, nl, rows, cols)) { cs = nc; ls = nl; }
      }
      const sc = score(cs, ls);
      if (sc < bestScore) { bestScore = sc; bestCells = cs; bestLines = ls; }
    }

    const solved = relationSolve(bestCells, bestLines, rows, cols);
    bandLevels.push({
      rows, cols, solution: color,
      minCells: bestCells, minLines: bestLines,
      fullCells: cellClues, fullLines: lineClues,
      rounds: solved.rounds,
    });
  }
  // Within a band, shallowest chain first.
  bandLevels.sort((a, b) => a.rounds - b.rounds || b.minCells.length - a.minCells.length);
  built.push(...bandLevels);
}

// ---- difficulty ---------------------------------------------------------------
// Not "how many clues" any more — a single rainbow row is worth six deductions.
// Tier is by how deep the forced-inference chain runs, ranked across the whole
// run and cut into thirds. Easier tiers also get padding clues on tiles that
// would otherwise be blank.
const byDepth = [...built].sort((a, b) => a.rounds - b.rounds || b.minCells.length - a.minCells.length);
const rank = new Map(byDepth.map((b, i) => [b, i]));
const EXTRA = { 1: 4, 2: 2, 3: 0 };
const levels = built.map((b, k) => {
  const r = rank.get(b);
  const tier = r < LEVEL_COUNT / 3 ? 1 : r < (2 * LEVEL_COUNT) / 3 ? 2 : 3;
  const clues = [...b.minCells];
  const shown = new Set(clues.map((c) => c.cell));
  let extra = EXTRA[tier];
  for (const cl of b.fullCells) {
    if (extra <= 0) break;
    if (shown.has(cl.cell)) continue;
    clues.push(cl); shown.add(cl.cell); extra--;
  }
  clues.sort((x, y) => x.cell - y.cell);
  const lines = [...b.minLines].sort((x, y) => x.axis.localeCompare(y.axis) || x.index - y.index);
  return { id: `logic-${k + 1}`, rows: b.rows, cols: b.cols, tier, clues, lines, solution: b.solution };
});

// ---- hard verification -------------------------------------------------------
for (const lv of levels) {
  const geo = grid(lv.rows, lv.cols);
  const color = lv.solution;
  for (const cl of lv.clues) if (!clueHolds(cl, color, geo)) throw new Error(`${lv.id}: tile clue lies`);
  for (const ln of lv.lines) if (!lineClueHolds(ln, color, geo)) throw new Error(`${lv.id}: line clue lies`);
  if (lv.clues.length !== new Set(lv.clues.map((c) => c.cell)).size) throw new Error(`${lv.id}: two clues on one tile`);
  // human relation solver cracks it with zero guessing
  if (!relationSolve(lv.clues, lv.lines, lv.rows, lv.cols)) throw new Error(`${lv.id}: not human-solvable`);
  // and brute-force: exactly ONE of all partitions satisfies the shown clues
  let count = 0;
  for (const p of allPartitions(lv.rows * lv.cols))
    if (lv.clues.every((cl) => clueHolds(cl, p, geo)) && lv.lines.every((ln) => lineClueHolds(ln, p, geo))) count++;
  if (count !== 1) throw new Error(`${lv.id}: ${count} solutions from shown clues`);
}

const tally = {};
for (const lv of levels) {
  for (const c of lv.clues) tally[c.kind] = (tally[c.kind] ?? 0) + 1;
  for (const l of lv.lines) tally[l.kind] = (tally[l.kind] ?? 0) + 1;
}
console.log("clue kinds used:", Object.entries(tally).map(([k, n]) => `${k}=${n}`).join(" "));
console.log("tiles per level:", levels.map((l) => l.clues.length).join(","));
console.log("lines per level:", levels.map((l) => l.lines.length).join(","));
console.log("kinds per level:", levels.map((l) => new Set([...l.clues.map((c) => c.kind), ...l.lines.map((c) => c.kind)]).size).join(","));

const out = `// AUTO-GENERATED by scripts/gen-deduction.mjs — do not edit by hand.
// Deduction Grid levels: an abstract grid of 12 cells split into 4 hidden
// groups of 3. Groups can be ANY shapes (they do not have to touch).
//
// Tile clues talk about the tile's own group ("my group-mates" = the other two
// tiles of my group): neighbour counts, a named neighbour or diagonal, how many
// group-mates share my row/column, the parity of my line, how many group-mates
// sit in a corner. Line clues sit in a row/column header and talk about the
// whole line: all different, or exactly one matching pair.
//
// Every level is solvable by pure forced reasoning from its shown clues alone,
// and verified to have exactly one solution. Tier is by inference depth, not
// clue count (one line clue can be worth six deductions).
// solution[] is the group id (0-3) per cell, row-major (cols per row).

export type DeductionAxis = "row" | "col";

export type DeductionClue =
  | { cell: number; kind: "deg"; n: number }
  | { cell: number; kind: "dir"; dir: "up" | "down" | "left" | "right"; same: boolean }
  | { cell: number; kind: "diag"; dir: "upLeft" | "upRight" | "downLeft" | "downRight"; same: boolean }
  | { cell: number; kind: "line"; axis: DeductionAxis; n: number }
  | { cell: number; kind: "parity"; axis: DeductionAxis }
  | { cell: number; kind: "corners"; n: number };

export interface DeductionLineClue {
  axis: DeductionAxis;
  index: number;
  kind: "rainbow" | "onepair";
}

export interface DeductionLevel {
  id: string;
  rows: number;
  cols: number;
  /** 1 Easy, 2 Medium, 3 Hard — by how deep the forced-inference chain runs. */
  tier: number;
  clues: DeductionClue[];
  lines: DeductionLineClue[];
  solution: number[];
}

export const DEDUCTION_LEVELS: DeductionLevel[] = ${JSON.stringify(levels, null, 2)};
`;
writeFileSync(join(ROOT, "src/deductionLevels.ts"), out);
console.log(`wrote src/deductionLevels.ts with ${levels.length} levels`);
