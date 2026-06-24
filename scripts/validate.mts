// Structural validation for every puzzle in src/puzzles.ts.
// Run with:  npm run validate
import { PUZZLES, buildPuzzle } from "../src/puzzles.ts";

let bad = 0;
const seenIds = new Set<string>();

for (const raw of PUZZLES) {
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

console.log(`\n${PUZZLES.length} puzzles checked — ${bad === 0 ? "all valid ✓" : `${bad} invalid ✗`}`);
process.exit(bad ? 1 : 0);
