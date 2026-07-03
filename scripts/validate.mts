// Structural validation for every puzzle: the campaign, the emoji boss and
// the dedicated daily pool.
// Run with:  npm run validate
import { PUZZLES, EMOJI_BOSS, buildPuzzle } from "../src/puzzles.ts";
import { DAILY_PUZZLES } from "../src/dailyPuzzles.ts";

const ALL = [...PUZZLES, EMOJI_BOSS, ...DAILY_PUZZLES];
let bad = 0;
const seenIds = new Set<string>();

// Daily pivots must be fresh content — never a campaign pivot re-used.
const campaignPivots = new Set(PUZZLES.map((p) => p.pivot.toUpperCase()));
for (const d of DAILY_PUZZLES) {
  if (campaignPivots.has(d.pivot.toUpperCase())) {
    bad++;
    console.log(`✗ ${d.id}: daily pivot ${d.pivot} duplicates a campaign pivot`);
  }
}

for (const raw of ALL) {
  const p = buildPuzzle(raw, 7);
  const problems: string[] = [];

  if (p.words.length !== 13) problems.push(`has ${p.words.length} tiles (expected 13)`);
  const uniq = new Set(p.words);
  if (uniq.size !== 13) {
    const dupes = p.words.filter((w, i) => p.words.indexOf(w) !== i);
    problems.push(`duplicate words: ${dupes.join(", ")}`);
  }
  if (seenIds.has(p.id)) problems.push("duplicate id");
  seenIds.add(p.id);

  for (const c of p.categories) {
    if (c.members.length !== 4) problems.push(`"${c.name}" has ${c.members.length} members`);
    if (!c.members.includes(p.pivot)) problems.push(`pivot missing from "${c.name}"`);
  }
  if (p.words.filter((w) => w === p.pivot).length !== 1) problems.push("pivot is not exactly one tile");

  if (problems.length) {
    bad++;
    console.log(`✗ ${p.id}: ${problems.join("; ")}`);
  }
}

console.log(
  `\n${ALL.length} puzzles checked (${PUZZLES.length} campaign + 1 boss + ${DAILY_PUZZLES.length} daily) — ${bad === 0 ? "all valid ✓" : `${bad} invalid ✗`}`,
);
process.exit(bad ? 1 : 0);
