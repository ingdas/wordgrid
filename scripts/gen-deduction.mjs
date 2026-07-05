// Generator for Deduction Grid levels (a logic mode on the same boards).
//
// A level places a board's 12 words into a grid so each of the 4 themes forms
// a connected 3-cell region. In play the words are hidden and each tile shows
// only a NUMBER = how many orthogonal neighbours share its theme; the player
// recovers the regions by logic. A level is only fair if it is solvable by
// pure deduction (no guessing) — which also guarantees a unique solution.
//
// The geometry is word-agnostic, so we enumerate every partition of a few grid
// shapes, keep the "templates" a constraint-propagation solver can crack with
// zero guesses, then drape a board's words over them. Writes
// src/deductionLevels.ts.  Run:  node scripts/gen-deduction.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// ---- geometry helpers, parameterised by grid shape -------------------------
function grid(rows, cols) {
  const N = rows * cols;
  const neighbors = [];
  for (let i = 0; i < N; i++) {
    const r = (i / cols) | 0, c = i % cols, ns = [];
    if (r > 0) ns.push(i - cols);
    if (r < rows - 1) ns.push(i + cols);
    if (c > 0) ns.push(i - 1);
    if (c < cols - 1) ns.push(i + 1);
    neighbors.push(ns);
  }
  // undirected edges + per-cell incident edge list
  const edges = [], cellEdges = Array.from({ length: N }, () => []);
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      if (c + 1 < cols) { const e = edges.length; edges.push([i, i + 1]); cellEdges[i].push(e); cellEdges[i + 1].push(e); }
      if (r + 1 < rows) { const e = edges.length; edges.push([i, i + cols]); cellEdges[i].push(e); cellEdges[i + cols].push(e); }
    }
  return { N, neighbors, edges, cellEdges };
}

const triominoes = (start, color, neighbors) => {
  const av = (i) => color[i] < 0, out = [], seen = new Set();
  for (const a of neighbors[start].filter(av)) {
    const cand = new Set([...neighbors[start], ...neighbors[a]].filter((x) => av(x) && x !== start && x !== a));
    for (const b of cand) {
      const key = [start, a, b].sort((x, y) => x - y).join(",");
      if (seen.has(key)) continue;
      seen.add(key);
      out.push([start, a, b]);
    }
  }
  return out;
};

function partitions(rows, cols) {
  const { N, neighbors } = grid(rows, cols);
  const color = new Array(N).fill(-1), out = [];
  const firstFree = () => { for (let i = 0; i < N; i++) if (color[i] < 0) return i; return -1; };
  const rec = (rid) => {
    const s = firstFree();
    if (s < 0) { out.push(color.slice()); return; }
    if (rid > 3) return;
    for (const tri of triominoes(s, color, neighbors)) {
      for (const i of tri) color[i] = rid;
      rec(rid + 1);
      for (const i of tri) color[i] = -1;
    }
  };
  rec(0);
  return out;
}

const clues = (color, neighbors) =>
  color.map((_, i) => neighbors[i].reduce((n, j) => n + (color[j] === color[i] ? 1 : 0), 0));

// ---- constraint-propagation solver -----------------------------------------
// Decide each grid edge link/cut from clue degrees + "regions are 3 connected
// cells" (so: no cycles, no region > 3, a full region seals its border). If it
// reaches an all-decided, consistent state it solved WITHOUT guessing → fair.
function logicSolve(clue, rows, cols, mask) {
  const { N, edges, cellEdges } = grid(rows, cols);
  // `mask` (optional): only these cells impose their clue (sparse givens).
  const shown = mask ?? new Array(N).fill(true);
  const st = new Array(edges.length).fill(0); // 0 unknown, 1 link, 2 cut
  const parent = new Array(N), size = new Array(N);
  const rebuild = () => {
    for (let i = 0; i < N; i++) { parent[i] = i; size[i] = 1; }
    const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
    for (let e = 0; e < edges.length; e++) if (st[e] === 1) {
      const [a, b] = edges[e], ra = find(a), rb = find(b);
      if (ra !== rb) { parent[ra] = rb; size[rb] += size[ra]; }
    }
    return find;
  };
  let changed = true, bad = false;
  while (changed && !bad) {
    changed = false;
    for (let i = 0; i < N && !bad; i++) {
      if (!shown[i]) continue;
      let links = 0, unk = [];
      for (const e of cellEdges[i]) { if (st[e] === 1) links++; else if (st[e] === 0) unk.push(e); }
      if (links > clue[i] || links + unk.length < clue[i]) { bad = true; break; }
      if (links === clue[i] && unk.length) { unk.forEach((e) => (st[e] = 2)); changed = true; }
      else if (links + unk.length === clue[i] && unk.length) { unk.forEach((e) => (st[e] = 1)); changed = true; }
    }
    if (bad) break;
    let find = rebuild();
    for (let e = 0; e < edges.length; e++) {
      if (st[e] !== 0) continue;
      const [a, b] = edges[e], ra = find(a), rb = find(b);
      if (ra === rb) { st[e] = 2; changed = true; }             // link would make a cycle
      else if (size[ra] + size[rb] > 3) { st[e] = 2; changed = true; } // would exceed 3
    }
    find = rebuild();
    for (let e = 0; e < edges.length; e++) {
      if (st[e] !== 0) continue;
      const [a, b] = edges[e];
      if (size[find(a)] === 3 || size[find(b)] === 3) { st[e] = 2; changed = true; } // sealed region
    }
  }
  if (bad || st.some((s) => s === 0)) return null; // contradiction or stuck (needs a guess)
  const find = rebuild();
  const comps = new Map();
  for (let i = 0; i < N; i++) { const r = find(i); (comps.get(r) ?? comps.set(r, []).get(r)).push(i); }
  if (comps.size !== 4 || [...comps.values()].some((c) => c.length !== 3)) return null;
  return true;
}

// ---- vet templates across a couple of grid shapes --------------------------
const SHAPES = [[3, 4], [4, 3]];
const vetted = [];
const seen = new Set();
for (const [rows, cols] of SHAPES) {
  const { neighbors } = grid(rows, cols);
  for (const p of partitions(rows, cols)) {
    const cl = clues(p, neighbors);
    const key = `${rows}x${cols}:${cl.join("")}`;
    if (seen.has(key)) continue;
    if (!logicSolve(cl, rows, cols)) continue; // keep only no-guess-solvable
    seen.add(key);
    vetted.push({ rows, cols, color: p });
  }
}
console.log(`vetted no-guess templates: ${vetted.length} (${SHAPES.map(([r, c]) => `${r}x${c}`).join(", ")})`);

// ---- pick 20 boards and drape them over the templates ----------------------
const src = readFileSync(join(ROOT, "src/puzzles.ts"), "utf8");
function board(id) {
  const re = new RegExp(`id: "${id}",\\s*\\n\\s*title: "([^"]+)",\\s*\\n\\s*pivot: "([^"]+)",\\s*\\n\\s*categories: \\[([\\s\\S]*?)\\n {4}\\],`);
  const m = src.match(re);
  if (!m) throw new Error(`board ${id} not found`);
  const cats = [...m[3].matchAll(/name: "([^"]+)", words: \[([^\]]+)\]/g)].map((c) => ({
    name: c[1],
    words: c[2].split(",").map((w) => w.trim().replace(/"/g, "")),
  }));
  return { id, title: m[1], pivot: m[2], categories: cats };
}

const BOARDS = [
  "star", "rock", "spring", "light", "fire", "pitch", "trunk", "bark", "mint", "bank",
  "check", "bug", "table", "drop", "seal", "bat", "deck", "note", "park", "wave",
];

// The smallest set of clue tiles that keeps a template no-guess-solvable. The
// fewer numbers shown, the longer the deduction chain — this is the difficulty
// knob (a full 12-clue grid basically reads off its own answer).
function minimalGivens(cl, rows, cols) {
  const N = rows * cols;
  let best = new Array(N).fill(true);
  for (let trial = 0; trial < 60; trial++) {
    const m = new Array(N).fill(true);
    const order = [...Array(N).keys()].sort(() => Math.random() - 0.5);
    for (const i of order) { m[i] = false; if (!logicSolve(cl, rows, cols, m)) m[i] = true; }
    if (m.filter(Boolean).length < best.filter(Boolean).length) best = m;
  }
  return best;
}

// Difficulty tiers by how many numbers we reveal: Hard = the minimal set,
// Easy/Medium pad it with extra clues so the chain is shorter. Levels ramp
// Easy → Medium → Hard across the 20.
const TIER_OF = (k) => (k < 7 ? 1 : k < 14 ? 2 : 3); // 1 Easy, 2 Medium, 3 Hard
const EXTRA = { 1: 4, 2: 2, 3: 0 };

const levels = BOARDS.map((id, k) => {
  const b = board(id);
  const tpl = vetted[k % vetted.length]; // cycle the vetted templates
  const { rows, cols, color } = tpl;
  const N = rows * cols;
  const { neighbors } = grid(rows, cols);
  const cl = clues(color, neighbors);

  const regionCells = [[], [], [], []];
  color.forEach((rid, i) => regionCells[rid].push(i));
  const cells = new Array(N);
  regionCells.forEach((cellsOfRegion, rid) => {
    cellsOfRegion.forEach((cellIdx, w) => {
      cells[cellIdx] = { word: b.categories[rid].words[w], cat: rid };
    });
  });

  // Start from the minimal clue set, then pad with extra clues per tier.
  const tier = TIER_OF(k);
  const mask = minimalGivens(cl, rows, cols);
  let extra = EXTRA[tier];
  for (let i = 0; i < N && extra > 0; i++) if (!mask[i]) { mask[i] = true; extra--; }
  const given = mask.map((b2, i) => (b2 ? i : -1)).filter((i) => i >= 0);

  return { id, pivot: b.pivot, rows, cols, tier, given, categories: b.categories.map((c) => c.name), cells };
});

// Sanity: every emitted level must be no-guess-solvable from its shown clues,
// and uniquely solvable given only those clues.
for (const lv of levels) {
  const { neighbors } = grid(lv.rows, lv.cols);
  const cl = clues(lv.cells.map((c) => c.cat), neighbors);
  const mask = new Array(lv.rows * lv.cols).fill(false);
  lv.given.forEach((i) => (mask[i] = true));
  if (!logicSolve(cl, lv.rows, lv.cols, mask)) throw new Error(`level ${lv.id} not no-guess from its clues`);
  let count = 0;
  for (const p of partitions(lv.rows, lv.cols)) {
    const pc = clues(p, neighbors);
    if (lv.given.every((i) => pc[i] === cl[i])) count++;
  }
  if (count !== 1) throw new Error(`level ${lv.id} has ${count} solutions from its clues`);
}
console.log(`givens per level: ${levels.map((l) => l.given.length).join(",")}`);

const out = `// AUTO-GENERATED by scripts/gen-deduction.mjs — do not edit by hand.
// Deduction Grid levels: 12 words in a small grid, each theme a connected
// 3-cell region. In play the words are hidden and only the tiles listed in
// \`given\` show a clue number (how many orthogonal neighbours share its theme);
// the rest are blank. Every level is solvable by pure deduction from its shown
// clues alone — no guessing — and therefore has one solution. Fewer givens =
// harder (tier 1 Easy … 3 Hard). cells[] is row-major (cols per row).

export interface DeductionCell {
  word: string;
  /** Theme index 0-3 (the solution colour for this cell). */
  cat: number;
}

export interface DeductionLevel {
  id: string;
  pivot: string;
  rows: number;
  cols: number;
  /** 1 Easy, 2 Medium, 3 Hard — fewer shown clues as the tier rises. */
  tier: number;
  /** Cell indices (row-major) that display their clue number; others are blank. */
  given: number[];
  categories: string[];
  cells: DeductionCell[];
}

export const DEDUCTION_LEVELS: DeductionLevel[] = ${JSON.stringify(levels, null, 2)};
`;
writeFileSync(join(ROOT, "src/deductionLevels.ts"), out);
console.log(`wrote src/deductionLevels.ts with ${levels.length} levels`);
