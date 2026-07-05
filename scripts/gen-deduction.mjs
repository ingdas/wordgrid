// Generator for Deduction Grid levels (a logic mode on the same boards).
//
// A level places a board's 12 words into a 3×4 grid so each of the 4 themes
// forms a connected 3-cell region. During play the words are hidden and each
// tile shows only a NUMBER = how many orthogonal neighbours share its theme;
// the player must recover the 4 regions by pure logic. So a level is only fair
// if the clue numbers admit exactly ONE partition into 4 connected triominoes.
//
// The partition/clue geometry is word-agnostic, so we enumerate every 3×4
// partition once, keep the "templates" whose clue grid is unique, then drape a
// chosen board's words over a template. Writes src/deductionLevels.ts.
//
//   node scripts/gen-deduction.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const R = 3, C = 4, N = R * C;

const neighbors = [];
for (let i = 0; i < N; i++) {
  const r = (i / C) | 0, c = i % C, ns = [];
  if (r > 0) ns.push(i - C);
  if (r < R - 1) ns.push(i + C);
  if (c > 0) ns.push(i - 1);
  if (c < C - 1) ns.push(i + 1);
  neighbors.push(ns);
}
const CORNERS = [0, C - 1, N - C, N - 1];

// All connected 3-cell regions ("triominoes") containing `start`, drawn only
// from still-uncoloured cells.
function triominoes(start, color) {
  const av = (i) => color[i] < 0;
  const out = [], seen = new Set();
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
}

// Every partition of the grid into 4 connected triominoes. Regions are grown
// from the lowest free cell, so each partition is produced exactly once with
// its regions in canonical (min-cell) order.
function partitions() {
  const color = new Array(N).fill(-1), out = [];
  const firstFree = () => { for (let i = 0; i < N; i++) if (color[i] < 0) return i; return -1; };
  const rec = (rid) => {
    const s = firstFree();
    if (s < 0) { out.push(color.slice()); return; }
    if (rid > 3) return;
    for (const tri of triominoes(s, color)) {
      for (const i of tri) color[i] = rid;
      rec(rid + 1);
      for (const i of tri) color[i] = -1;
    }
  };
  rec(0);
  return out;
}

const clues = (color) =>
  color.map((_, i) => neighbors[i].reduce((n, j) => n + (color[j] === color[i] ? 1 : 0), 0));

const parts = partitions();
const byClue = new Map();
for (const p of parts) {
  const k = clues(p).join("");
  (byClue.get(k) ?? byClue.set(k, []).get(k)).push(p);
}
// Templates whose clue grid pins down a single partition — the only fair ones.
let templates = [...byClue.values()].filter((v) => v.length === 1).map((v) => v[0]);

// Prefer templates with a corner "2" (a corner showing 2 instantly forces its
// whole region — a guaranteed foothold), then more footholds first.
const footholds = (p) => {
  const cl = clues(p);
  return CORNERS.filter((i) => cl[i] === 2).length;
};
templates = templates.filter((p) => footholds(p) >= 1).sort((a, b) => footholds(b) - footholds(a));

// De-dup to visually distinct clue patterns and take a spread.
const distinct = [];
const seenGrids = new Set();
for (const p of templates) {
  const k = clues(p).join("");
  if (seenGrids.has(k)) continue;
  seenGrids.add(k);
  distinct.push(p);
}

console.log(`partitions: ${parts.length} | unique-clue templates: ${[...byClue.values()].filter(v=>v.length===1).length} | with foothold: ${distinct.length}`);

// Pick source boards from src/puzzles.ts (raw text parse — no TS import needed).
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

// Choose distinct templates spaced through the list, paired with nice boards.
const BOARDS = ["star", "bug", "seal"];
const chosen = [distinct[0], distinct[Math.floor(distinct.length / 3)], distinct[Math.floor((2 * distinct.length) / 3)]];

const levels = BOARDS.map((id, k) => {
  const b = board(id);
  const color = chosen[k];
  // region id (canonical order) → its cells in index order
  const regionCells = [[], [], [], []];
  color.forEach((rid, i) => regionCells[rid].push(i));
  // cell → { word, cat }: category k's 3 words drape over region k in cell order
  const cells = new Array(N);
  regionCells.forEach((cellsOfRegion, rid) => {
    cellsOfRegion.forEach((cellIdx, w) => {
      cells[cellIdx] = { word: b.categories[rid].words[w], cat: rid };
    });
  });
  return { id, pivot: b.pivot, categories: b.categories.map((c) => c.name), cells };
});

// Sanity re-check: each level's clue grid must have a unique solution.
for (const lv of levels) {
  const col = lv.cells.map((c) => c.cat);
  const key = clues(col).join("");
  if (byClue.get(key).length !== 1) throw new Error(`level ${lv.id} is not uniquely solvable`);
}

const out = `// AUTO-GENERATED by scripts/gen-deduction.mjs — do not edit by hand.
// Deduction Grid levels: 12 words in a ${R}×${C} grid, each theme a connected
// 3-cell region. In play the words are hidden and each tile shows only its clue
// number (how many orthogonal neighbours share its theme); the clue grid has a
// unique solution. cells[] is row-major (${C} per row).

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
  categories: string[];
  cells: DeductionCell[];
}

export const DEDUCTION_LEVELS: DeductionLevel[] = ${JSON.stringify(
  levels.map((l) => ({ ...l, rows: R, cols: C })),
  null,
  2,
)};
`;
writeFileSync(join(ROOT, "src/deductionLevels.ts"), out);
console.log(`wrote src/deductionLevels.ts with ${levels.length} levels:`);
for (const lv of levels) {
  const cl = clues(lv.cells.map((c) => c.cat));
  console.log(`  ${lv.id} (${lv.pivot}) clues: ${[0,1,2].map(r=>cl.slice(r*C,r*C+C).join(" ")).join(" / ")}`);
}
