// Structural validation for every puzzle: the campaign, the emoji boss and
// the dedicated daily pool.
// Run with:  npm run validate
import { PUZZLES, EMOJI_BOSS, buildPuzzle } from "../src/puzzles.ts";
import { DAILY_PUZZLES } from "../src/dailyPuzzles.ts";

const ALL = [...PUZZLES, EMOJI_BOSS, ...DAILY_PUZZLES];
const normalize = (s: string) => s.toUpperCase().replace(/[^A-Z ]/g, " ").replace(/\s+/g, " ").trim();
/** Does a word of a category name refer to this tile? Singular/plural counts. */
const refersTo = (nameWord: string, tile: string) =>
  nameWord === tile || nameWord === `${tile}S` || nameWord === `${tile}ES` || `${nameWord}S` === tile;
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

    // A category name is shown by the 💡 hint and on the solved banner, so it
    // must never spell out the secret link (that hands over the finale) nor
    // name a tile that belongs to a DIFFERENT group (that misdirects unfairly).
    // It must also not repeat one of its OWN tiles: that makes the same hint
    // token worth a free word on this board and nothing extra on the next.
    const nameWords = normalize(c.name).split(" ").filter(Boolean);
    const names = (tile: string) => nameWords.some((n) => refersTo(n, normalize(tile)));
    if (names(p.pivot)) problems.push(`"${c.name}" spells the pivot ${p.pivot}`);
    for (const w of c.spokes) {
      if (names(w)) problems.push(`"${c.name}" gives away its own tile ${w}`);
    }
    for (const other of p.categories) {
      if (other === c) continue;
      for (const w of other.spokes) {
        if (names(w)) problems.push(`"${c.name}" names ${w}, a tile from "${other.name}"`);
      }
    }

    // A tile that contains the pivot (SLIGHT on a LIGHT board, FANATIC on FAN)
    // leaves the secret link sitting in plain sight on the board.
    for (const w of c.spokes) {
      const t = normalize(w).replace(/ /g, "");
      const piv = normalize(p.pivot).replace(/ /g, "");
      if (t !== piv && t.includes(piv)) problems.push(`tile ${w} contains the pivot ${p.pivot}`);
    }
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
