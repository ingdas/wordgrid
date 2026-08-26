// The authoring sheet for one language's puzzle content: what every campaign
// slot demands, the English board that sits there today (for the idea, never
// for translation), the daily pool, the emoji boss and the chapter keys.
//
//   node --experimental-strip-types scripts/i18n-slots.mts de
//
// Read it top to bottom before writing src/i18n/content/<locale>.ts, then run
// `npm run validate -- --locale <locale>` until it is clean.
import { LOCALE_IDS, localeInfo, type Locale } from "../src/i18n/locales.ts";
import { rulesFor } from "../src/i18n/script.ts";
import {
  PUZZLES,
  EMOJI_BOSS,
  CHAPTERS,
  CHAPTER_KEYS,
  LEVELS,
  bossTwist,
  chapterOfLevel,
  gradeOf,
  keyLevels,
  type RawPuzzle,
} from "../src/puzzles.ts";
import { DAILY_PUZZLES } from "../src/dailyPuzzles.ts";

const id = process.argv[2] as Locale;
if (!(LOCALE_IDS as readonly string[]).includes(id)) {
  console.error(`usage: i18n-slots.mts <locale>  (one of ${LOCALE_IDS.join(", ")})`);
  process.exit(1);
}
const info = localeInfo(id);
const rules = rulesFor(id);

// One line per board: the sheet is read whole by whoever writes a language, so
// every line it doesn't need is a line they pay for on every turn after.
const board = (raw: RawPuzzle) =>
  `${raw.pivot} "${raw.title}" — ` + raw.categories.map((c) => `${c.name}: ${c.words.join("/")}`).join(" | ");

const TWIST_RULES: Record<string, string> = {
  scramble: "every tile is shown as an anagram → EVERY spoke ≤ 7 letters (units of this script)",
  cipher:
    "every tile is shown through this language's cipher → no two spokes may cipher to the same skeleton, every skeleton ≥ 2 units, at most 3 skeletons of exactly 2 units",
  memory: "the board is grouped from memory → every spoke ≤ 8 units, and no two spokes start with the same 2 units",
  decoy: "three impostor tiles are added → NO compound-word group (no \"___\" category) and at most one spoke of 9+ units",
  blackout: "solved groups vanish → any board; this slot wants the HARDEST board in the chapter",
  emoji: "the emoji boss: this slot's board is never played — the `emoji` board is. Fill the slot anyway (keys/curve), but spend your effort on `emoji`.",
};

const GRADE_WORDS = ["", "gentle: four concrete sets, an everyday link", "one figurative group among concrete ones", "about half the groups are senses rather than sets; the link takes a moment", "mostly figurative; a sense most players meet rarely", "every group is a different sense of the word; the link is the last thing you see"];
const TWIST_SHORT: Record<string, string> = {
  scramble: "SCRAMBLE: every spoke ≤ 7 letters",
  cipher: "CIPHER: no two spokes share a skeleton, each skeleton ≥ 2 letters, ≤ 3 two-letter skeletons",
  memory: "MEMORY: spokes ≤ 8 letters, no two start with the same 2 letters",
  decoy: "DECOY: no ___ group, ≤ 1 spoke of 9+ letters",
  blackout: "BLACKOUT: any board — the hardest in the chapter",
  emoji: "EMOJI: this slot's board is never played (the `emoji` board is); fill it anyway",
};

console.log(`# ${info.label} (${id}) — content slots\n`);
const SAMPLE: Record<string, string[]> = {
  latin: ["CRASH", "PLANET", "AVENUE"], cyrillic: ["МОЛОКО", "ЙОГУРТ"], greek: ["ΘΑΛΑΣΣΑ", "ΆΝΘΟΣ"],
  arabic: ["كتاب", "مدرسة"], thai: ["เสือ", "โรงเรียน"], hangul: ["사과", "학교"], kana: ["さくら", "カメラ"],
};
console.log(`Script family: ${rules.family}. The cipher boss shows tiles like this: ${SAMPLE[rules.family].map((w) => `${w} → ${rules.cipher(w)}`).join(", ")}. Try your own: node -e 'import("./src/i18n/script.ts").then(m => console.log(m.rulesFor("${id}").cipher(process.argv[1])))' WORD (with --experimental-strip-types).`);
console.log(`Letter pool used to pad the finale bank: ${rules.pool("").join("")}\n`);

console.log(`## Chapter keys — ${CHAPTERS.length} words, EXACT lengths in letters of this script (spaces allowed, not counted)\n`);
CHAPTERS.forEach((c, ci) => {
  console.log(`- chapter ${ci + 1}: ${keyLevels(ci).length} letters (English: ${CHAPTER_KEYS[ci]}, chapter name key chapter.${ci + 1}.name)`);
});

console.log(`\n## Campaign — 100 slots. Keep the slot id; write a board of this language for it.\n`);
console.log(`Grades: ${[1, 2, 3, 4, 5].map((g) => `${g} = ${GRADE_WORDS[g]}`).join("; ")}.`);
console.log(`Boss constraints: ${Object.values(TWIST_RULES).join(" · ")}\n`);
console.log(`One line per slot: L<level> <id> ch<chapter> g<grade> [BOSS twist] — EN: the English board (the idea only). Adjacent lines must not share a tile.\n`);
LEVELS.forEach((lvl, i) => {
  const ci = chapterOfLevel(i);
  const twist = bossTwist(i);
  const grade = gradeOf(lvl.id);
  const tags = [twist ? `👑 ${TWIST_SHORT[twist]}` : "", i === 0 ? "TUTORIAL: first category = a plain concrete set; no ___ group" : ""].filter(Boolean);
  console.log(`- L${i + 1} ${lvl.id} ch${ci + 1} g${grade}${tags.length ? ` [${tags.join("; ")}]` : ""} — EN: ${board(lvl)}`);
});

console.log(`## Emoji boss (id "${EMOJI_BOSS.id}") — a board of 12 pictures. Each tile is the picture's own name in ${info.label}; the four groups use a SECOND sense of that name. No picture may depict the link itself.\n`);
console.log(`- EN: ${board(EMOJI_BOSS)}`);
console.log(`- EN pictures: ${Object.entries(EMOJI_BOSS.emoji ?? {}).map(([w, e]) => `${w}=${e}`).join(" ")}\n`);

console.log(`## Daily pool — ${DAILY_PUZZLES.length} boards. Keep each id. Links must be FRESH: never a campaign link of this language, never repeated.\n`);
DAILY_PUZZLES.forEach((d) => console.log(`- ${d.id} — EN: ${board(d)}`));

console.log(`## Decoys — 20 plain, concrete, unambiguous nouns of ${info.label} (impostor tiles for the decoy boss). They must fit no group on any board they might land on: pick words far from all your links.`);
