// Structural validation for every puzzle: the campaign, the emoji boss and
// the dedicated daily pool — plus the chapter keys and the campaign curve.
// Run with:  npm run validate
import {
  PUZZLES,
  EMOJI_BOSS,
  CHAPTERS,
  CHAPTER_KEYS,
  GRADE_BAND_IDS,
  LEVELS,
  buildPuzzle,
  bossTwist,
  boardlessBoss,
  chapterKey,
  isLogicBoss,
  LOGIC_BOSS_GRID,
  gradeOf,
  keyLevels,
  keySlots,
  suitsTwist,
} from "../src/puzzles.ts";
import { DAILY_PUZZLES } from "../src/dailyPuzzles.ts";
import { DEDUCTION_LEVELS } from "../src/deductionLevels.ts";

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

// Chapter keys: one letter per non-boss level, so a chapter's levels bank
// exactly the letters its keyword needs. Too short strands levels that buy
// nothing; too long leaves a slot no level can ever fill, and the boss door
// could never open.
if (CHAPTER_KEYS.length !== CHAPTERS.length) {
  bad++;
  console.log(`✗ chapter keys: ${CHAPTER_KEYS.length} keywords for ${CHAPTERS.length} chapters`);
}
CHAPTERS.forEach((_, ci) => {
  const key = chapterKey(ci);
  const banks = keyLevels(ci).length;
  if (!/^[A-Z]+$/.test(key)) {
    bad++;
    console.log(`✗ chapter ${ci + 1} key "${key}": letters A–Z only (it becomes a letter bank)`);
  }
  if (key.length !== banks) {
    bad++;
    console.log(`✗ chapter ${ci + 1} key "${key}": ${key.length} letters but ${banks} levels bank one each`);
  }
  // The deal is what the map actually shows. It must be the keyword's own
  // letters (no more, no fewer) and it must not sit in the answer's order,
  // which would spell the key across the rail before it's earned.
  const dealt = keySlots(ci);
  const sorted = (s: string[]) => [...s].sort().join("");
  if (sorted(dealt.map((d) => d.letter)) !== sorted(key.split(""))) {
    bad++;
    console.log(`✗ chapter ${ci + 1} key "${key}": the dealt letters aren't the keyword's`);
  }
  if (dealt.map((d) => d.letter).join("") === key) {
    bad++;
    console.log(`✗ chapter ${ci + 1} key "${key}": the levels bank it in order — the rail spells the answer`);
  }
});

// --- The campaign curve ----------------------------------------------------
// The level order is computed from hand grades (see GRADE_BANDS in puzzles.ts),
// so the things that order guarantees are checked here rather than eyeballed on
// the level index. An ungraded board is the failure a new content batch will hit
// first: it would silently land mid-curve, in whatever chapter grade 3 fills.

const graded = GRADE_BAND_IDS.flat();
const campaignIds = new Set(PUZZLES.map((p) => p.id));
graded.forEach((id, i) => {
  if (graded.indexOf(id) !== i) {
    bad++;
    console.log(`✗ curve: "${id}" appears in more than one grade band`);
  }
  if (!campaignIds.has(id)) {
    bad++;
    console.log(`✗ curve: grade band lists "${id}", which is not a campaign puzzle`);
  }
});
PUZZLES.forEach((p) => {
  if (!graded.includes(p.id)) {
    bad++;
    console.log(`✗ curve: ${p.id} has no hand grade — add its id to a GRADE_BANDS band`);
  }
});

// Every board is played exactly once, and the logic boss owns the one slot on
// top of them (it plays a grid, so it spends no board).
const boardSlots = LEVELS.filter((_, i) => !isLogicBoss(i));
if (
  LEVELS.length !== PUZZLES.length + 1 ||
  new Set(boardSlots.map((l) => l.id)).size !== PUZZLES.length ||
  LEVELS.length - boardSlots.length !== 1
) {
  bad++;
  console.log(
    `✗ curve: ${LEVELS.length} levels over ${PUZZLES.length} puzzles + 1 logic boss — the order lost or repeated a board`,
  );
}

// The tutorial is level 1: the coach copy is derived from this board's own first
// category, so a reorder that moves it leaves the coach describing other tiles.
if (LEVELS[0].id !== "star") {
  bad++;
  console.log(`✗ curve: level 1 is ${LEVELS[0].id}, but the tutorial coach is written against "star"`);
}

// The rules the placement pass exists to keep.
// The logic boss holds no words, so it neither clashes nor separates the two
// boards either side of it — they are read as neighbours across it.
const boards = LEVELS.map((l, i) => ({ l, i })).filter(({ i }) => !isLogicBoss(i));
const spokesOf = (l: (typeof LEVELS)[number]) => new Set(l.categories.flatMap((c) => c.words));
for (let n = 1; n < boards.length; n++) {
  const { l, i } = boards[n];
  const prev = boards[n - 1];
  const shared = [...spokesOf(l)].filter((w) => spokesOf(prev.l).has(w));
  if (shared.length) {
    bad++;
    console.log(`✗ curve: levels ${prev.i + 1} and ${i + 1} (${prev.l.id}/${l.id}) both show ${shared.join(", ")}`);
  }
}
let lastBossGrade = 0;
CHAPTERS.forEach((c, ci) => {
  const rows = LEVELS.slice(c.start, c.end);
  const twist = bossTwist(c.boss)!;
  const boss = LEVELS[c.boss];
  // A boardless boss never plays the board in its slot — emoji swaps EMOJI_BOSS
  // in, logic plays a grid — so its grade says nothing about the fight and is
  // exempt from both rules below.
  const boardless = boardlessBoss(twist);
  const bossGrade = boardless ? GRADE_BAND_IDS.length : gradeOf(boss.id);
  const peak = Math.max(...rows.slice(0, -1).map((l) => gradeOf(l.id)));
  if (bossGrade < peak) {
    bad++;
    console.log(`✗ curve: chapter ${ci + 1}'s boss (${boss.id}, grade ${bossGrade}) is milder than a level it follows (grade ${peak})`);
  }
  // Boss grades climb across the campaign — but a boardless chapter sits outside
  // that chain entirely: a picture board (or a logic grid) is a different kind of
  // hard, not a point on the word curve, so it neither has to beat the last boss
  // nor sets the bar for the next one.
  if (!boardless) {
    if (bossGrade < lastBossGrade) {
      bad++;
      console.log(`✗ curve: chapter ${ci + 1}'s boss drops to grade ${bossGrade} after an earlier chapter's grade ${lastBossGrade}`);
    }
    lastBossGrade = bossGrade;
  }
  if (!boardless && !suitsTwist(twist, boss)) {
    bad++;
    console.log(`✗ curve: chapter ${ci + 1}'s boss ${boss.id} can't carry its "${twist}" twist`);
  }
  const wordplay = rows.filter((l) => l.categories.some((cc) => cc.name.includes("___") || /after the link/i.test(cc.name)));
  if (wordplay.length > 1) {
    bad++;
    console.log(`✗ curve: chapter ${ci + 1} holds ${wordplay.length} compound-word boards (${wordplay.map((l) => l.id).join(", ")})`);
  }
});

// The logic boss plays a grid by id: a typo there is a boss level that can't
// draw a board at all, and nothing else in the build would notice.
if (!DEDUCTION_LEVELS.some((l) => l.id === LOGIC_BOSS_GRID)) {
  bad++;
  console.log(`✗ curve: the logic boss plays "${LOGIC_BOSS_GRID}", which is not a Deduction level`);
}

console.log(
  `\n${ALL.length} puzzles checked (${PUZZLES.length} campaign + 1 boss + ${DAILY_PUZZLES.length} daily) + ${CHAPTER_KEYS.length} chapter keys + the ${LEVELS.length}-level curve — ${bad === 0 ? "all valid ✓" : `${bad} invalid ✗`}`,
);
process.exit(bad ? 1 : 0);
