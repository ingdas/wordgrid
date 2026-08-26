// Structural validation for every puzzle in every language: the campaign, the
// emoji boss and the daily pool, the chapter keys and the campaign curve.
//
//   npm run validate                 every shipped language (SHIPPED_LOCALES)
//   npm run validate -- --locale nl  one language, shipped or not (also `en`)
//
// The English boards define the campaign's shape (the level order, the grades,
// the twists); every other language fills the same slots with its own boards
// (src/i18n/content), so most checks run per language against that language's
// letters and cipher (src/i18n/script.ts).
import { LOCALE_IDS, SHIPPED_LOCALES, type Locale } from "../src/i18n/locales.ts";
import { loadContent } from "../src/i18n/index.ts";
import { graphemes, rulesFor, setScriptLocale, type ScriptRules } from "../src/i18n/script.ts";
import { localizeRaw, setActiveContent } from "../src/i18n/content/active.ts";
import type { LocaleContent } from "../src/i18n/content/types.ts";
import {
  PUZZLES,
  EMOJI_BOSS,
  CHAPTERS,
  CHAPTER_KEYS,
  GRADE_BAND_IDS,
  LEVELS,
  buildPuzzle,
  bossTwist,
  chapterKey,
  gradeOf,
  keyLevels,
  keySlots,
  suitsTwist,
  type RawPuzzle,
} from "../src/puzzles.ts";
import { DAILY_PUZZLES } from "../src/dailyPuzzles.ts";

const args = process.argv.slice(2);
const only = args.includes("--locale") ? args[args.indexOf("--locale") + 1] : null;
const ALL_RAW = [...PUZZLES, EMOJI_BOSS, ...DAILY_PUZZLES];
// Pictures that name the link outright on the one board made of pictures.
const SPOILER_GLYPHS = ["⚡", "🔩", "🌩"];
const WORDPLAY = (raw: RawPuzzle) =>
  raw.categories.some((c) => c.name.includes("___") || /after the link/i.test(c.name));

// The script a language's tiles must be written in: a tile the finale can't
// spell from the language's letter pool (kanji on a kana board, a Latin word on
// a Thai one) would break the spelling, the cipher and the key rail at once.
const TILE_SCRIPT: Record<ScriptRules["family"], RegExp> = {
  latin: /^[\p{Script=Latin}\p{M}\s'’-]+$/u,
  cyrillic: /^[\p{Script=Cyrillic}\p{M}\s'’-]+$/u,
  greek: /^[\p{Script=Greek}\p{M}\s'’-]+$/u,
  arabic: /^[\p{Script=Arabic}\p{M}\s-]+$/u,
  thai: /^[\p{Script=Thai}\p{M}\s-]+$/u,
  hangul: /^[\p{Script=Hangul}\s-]+$/u,
  kana: /^[\p{Script=Hiragana}\p{Script=Katakana}ー\s-]+$/u,
};

let bad = 0;
function fail(msg: string) {
  bad++;
  console.log(`✗ ${msg}`);
}

// --- Checks that hold for the campaign's shape, whatever the language ---------
function checkShape() {
  const graded = GRADE_BAND_IDS.flat();
  const campaignIds = new Set(PUZZLES.map((p) => p.id));
  graded.forEach((id, i) => {
    if (graded.indexOf(id) !== i) fail(`curve: "${id}" appears in more than one grade band`);
    if (!campaignIds.has(id)) fail(`curve: grade band lists "${id}", which is not a campaign puzzle`);
  });
  PUZZLES.forEach((p) => {
    if (!graded.includes(p.id)) fail(`curve: ${p.id} has no hand grade — add its id to a GRADE_BANDS band`);
  });
  if (LEVELS.length !== PUZZLES.length || new Set(LEVELS.map((l) => l.id)).size !== PUZZLES.length) {
    fail(`curve: ${LEVELS.length} levels over ${PUZZLES.length} puzzles — the order lost or repeated a board`);
  }
  // The tutorial is level 1: the coach copy is derived from this board's own
  // first category, so a reorder that moves it leaves the coach describing
  // other tiles.
  if (LEVELS[0].id !== "star") fail(`curve: level 1 is ${LEVELS[0].id}, but the tutorial coach is written against "star"`);
  if (CHAPTER_KEYS.length !== CHAPTERS.length) fail(`chapter keys: ${CHAPTER_KEYS.length} keywords for ${CHAPTERS.length} chapters`);
  let lastBossGrade = 0;
  CHAPTERS.forEach((c, ci) => {
    const rows = LEVELS.slice(c.start, c.end);
    const twist = bossTwist(c.boss)!;
    const boss = LEVELS[c.boss];
    const emoji = twist === "emoji";
    const bossGrade = emoji ? GRADE_BAND_IDS.length : gradeOf(boss.id);
    const peak = Math.max(...rows.slice(0, -1).map((l) => gradeOf(l.id)));
    if (bossGrade < peak) fail(`curve: chapter ${ci + 1}'s boss (${boss.id}, grade ${bossGrade}) is milder than a level it follows (grade ${peak})`);
    if (!emoji) {
      if (bossGrade < lastBossGrade) fail(`curve: chapter ${ci + 1}'s boss drops to grade ${bossGrade} after an earlier chapter's grade ${lastBossGrade}`);
      lastBossGrade = bossGrade;
    }
  });
}

// --- Checks that run per language against its own boards -------------------
function checkLocale(id: Locale, content: LocaleContent | null, rules: ScriptRules) {
  const before = bad;
  const norm = (s: string) => rules.normalize(s);
  const continua = rules.family === "kana" || rules.family === "thai";
  const tileScript = TILE_SCRIPT[rules.family];
  const label = (raw: RawPuzzle) => `${id}/${raw.id}`;

  // Coverage: a localized game with an English board in it isn't localized.
  if (content) {
    for (const p of PUZZLES) if (!content.campaign[p.id]) fail(`${id}: no board for campaign slot "${p.id}"`);
    for (const d of DAILY_PUZZLES) if (!content.daily[d.id]) fail(`${id}: no board for daily "${d.id}"`);
    if (!content.emoji) fail(`${id}: no emoji boss board`);
    if (content.keys.length !== CHAPTERS.length) fail(`${id}: ${content.keys.length} chapter keys for ${CHAPTERS.length} chapters`);
    if (new Set(content.decoys.map(norm)).size < 10) fail(`${id}: needs at least 10 distinct decoy tiles (has ${new Set(content.decoys.map(norm)).size})`);
    for (const k of Object.keys(content.campaign)) if (!PUZZLES.some((p) => p.id === k)) fail(`${id}: campaign board "${k}" matches no slot`);
    for (const k of Object.keys(content.daily)) if (!DAILY_PUZZLES.some((p) => p.id === k)) fail(`${id}: daily board "${k}" matches no daily id`);
  }

  // Daily pivots must be fresh content — never a campaign pivot re-used.
  const campaignPivots = new Set(PUZZLES.map((p) => norm(localizeRaw(p).pivot)));
  for (const d of DAILY_PUZZLES) {
    const piv = localizeRaw(d).pivot;
    if (campaignPivots.has(norm(piv))) fail(`${label(d)}: daily pivot ${piv} duplicates a campaign pivot`);
  }
  // …and no two boards in the whole language share a link.
  const seenPivot = new Map<string, string>();
  for (const raw of ALL_RAW) {
    const piv = norm(localizeRaw(raw).pivot);
    const prev = seenPivot.get(piv);
    if (prev && prev !== raw.id && !(raw === EMOJI_BOSS || prev === "emoji-bolt")) fail(`${label(raw)}: pivot ${localizeRaw(raw).pivot} is also the link of "${prev}"`);
    seenPivot.set(piv, raw.id);
  }

  /** Does a word of a category name refer to this tile? Singular/plural counts. */
  const refersTo = (nameWord: string, tile: string) => {
    if (nameWord === tile) return true;
    if (id === "en" || rules.family === "latin") {
      if (nameWord === `${tile}S` || nameWord === `${tile}ES` || `${nameWord}S` === tile) return true;
    }
    // Other languages inflect: the name word is the tile plus an ending
    // (Bäume/BAUM, 사과를/사과, puussa/PUU). Not for English — its boards were
    // read by hand against the exact rule above.
    if (id !== "en" && tile.length >= 3 && nameWord.startsWith(tile) && nameWord.length - tile.length <= 4) return true;
    return false;
  };

  for (const source of ALL_RAW) {
    const raw = localizeRaw(source);
    const p = buildPuzzle(source, 7);
    const problems: string[] = [];

    if (p.words.length !== 13) problems.push(`has ${p.words.length} tiles (expected 13)`);
    const uniq = new Set(p.words.map(norm));
    if (uniq.size !== 13) {
      const seen = new Set<string>();
      const dupes = p.words.filter((w) => (seen.has(norm(w)) ? true : (seen.add(norm(w)), false)));
      problems.push(`duplicate words: ${dupes.join(", ")}`);
    }
    if (!raw.title?.trim()) problems.push("has no title");
    for (const w of p.words) {
      if (!w.trim()) problems.push("has an empty tile");
      else if (!tileScript.test(w)) problems.push(`tile ${w} is not written in this language's script`);
    }

    for (const c of p.categories) {
      if (c.members.length !== 4) problems.push(`"${c.name}" has ${c.members.length} members`);
      if (!c.members.includes(p.pivot)) problems.push(`pivot missing from "${c.name}"`);
      if (!c.name.trim()) problems.push("a category has no name");

      // A category name is shown by the 💡 hint and on the solved banner, so it
      // must never spell out the secret link (that hands over the finale) nor
      // name a tile that belongs to a DIFFERENT group (that misdirects
      // unfairly). It must also not repeat one of its OWN tiles: that makes
      // the same hint token worth a free word on this board and nothing extra
      // on the next.
      const nameNorm = norm(c.name);
      const nameWords = c.name.split(/[^\p{L}\p{M}]+/u).map(norm).filter(Boolean);
      const names = (tile: string) => {
        const t = norm(tile);
        if (!t) return false;
        if (continua) return graphemes(t).length >= 2 && nameNorm.includes(t);
        return nameWords.some((n) => refersTo(n, t));
      };
      if (names(p.pivot)) problems.push(`"${c.name}" spells the pivot ${p.pivot}`);
      for (const w of c.spokes) if (names(w)) problems.push(`"${c.name}" gives away its own tile ${w}`);
      for (const other of p.categories) {
        if (other === c) continue;
        for (const w of other.spokes) if (names(w)) problems.push(`"${c.name}" names ${w}, a tile from "${other.name}"`);
      }

      // A tile that contains the pivot (SLIGHT on a LIGHT board, FANATIC on
      // FAN) leaves the secret link sitting in plain sight on the board.
      const piv = norm(p.pivot);
      for (const w of c.spokes) {
        const t = norm(w);
        if (t !== piv && piv && t.includes(piv)) problems.push(`tile ${w} contains the pivot ${p.pivot}`);
      }
    }
    if (p.words.filter((w) => w === p.pivot).length !== 1) problems.push("pivot is not exactly one tile");

    // A picture board (the emoji boss) is only fair if every tile has a
    // picture and no two tiles share one — a missing entry silently falls back
    // to showing the word, which hands over a tile on the one board that is
    // meant to hide them all.
    if (source === EMOJI_BOSS) {
      const spokes = p.categories.flatMap((c) => c.spokes);
      const missing = spokes.filter((w) => !p.emoji[w]);
      if (missing.length) problems.push(`no picture for ${missing.join(", ")}`);
      const stray = Object.keys(p.emoji).filter((w) => !spokes.includes(w));
      if (stray.length) problems.push(`picture for ${stray.join(", ")}, which is not a tile`);
      const pics = spokes.map((w) => p.emoji[w]).filter(Boolean);
      const twice = pics.filter((e, i) => pics.indexOf(e) !== i);
      if (twice.length) problems.push(`the same picture is used twice: ${[...new Set(twice)].join(" ")}`);
      if (id === "en") {
        for (const [w, e] of Object.entries(p.emoji)) {
          if (SPOILER_GLYPHS.some((g) => e.includes(g))) problems.push(`${w}'s picture ${e} gives the link away`);
        }
      }
    } else if (Object.keys(p.emoji).length) {
      problems.push("has pictures but is not the emoji boss");
    }

    if (problems.length) fail(`${label(source)}: ${problems.join("; ")}`);
  }

  // Chapter keys: one letter per non-boss level, so a chapter's levels bank
  // exactly the letters its keyword needs. Too short strands levels that buy
  // nothing; too long leaves a slot no level can ever fill, and the boss door
  // could never open.
  CHAPTERS.forEach((_, ci) => {
    const key = chapterKey(ci);
    const letters = graphemes(key);
    const banks = keyLevels(ci).length;
    if (!key || !/^[\p{L}\p{M}]+$/u.test(key) || !tileScript.test(key)) fail(`${id}: chapter ${ci + 1} key "${key}": letters of this language only (it becomes a letter bank)`);
    if (letters.length !== banks) fail(`${id}: chapter ${ci + 1} key "${key}": ${letters.length} letters but ${banks} levels bank one each`);
    // The deal is what the map actually shows. It must be the keyword's own
    // letters (no more, no fewer) and it must not sit in the answer's order,
    // which would spell the key across the rail before it's earned.
    const dealt = keySlots(ci);
    const sorted = (s: string[]) => [...s].sort().join("");
    if (sorted(dealt.map((d) => d.letter)) !== sorted(letters)) fail(`${id}: chapter ${ci + 1} key "${key}": the dealt letters aren't the keyword's`);
    if (dealt.map((d) => d.letter).join("") === key) fail(`${id}: chapter ${ci + 1} key "${key}": the levels bank it in order — the rail spells the answer`);
  });
  const keyNorms = CHAPTERS.map((_, ci) => norm(chapterKey(ci)));
  if (new Set(keyNorms).size !== keyNorms.length) fail(`${id}: two chapters share a key word`);

  // The rules the placement pass exists to keep, checked against this
  // language's boards in the shared slots.
  const spokesOf = (i: number) => new Set(localizeRaw(LEVELS[i]).categories.flatMap((c) => c.words.map(norm)));
  for (let i = 1; i < LEVELS.length; i++) {
    const shared = [...spokesOf(i)].filter((w) => spokesOf(i - 1).has(w));
    if (shared.length) fail(`${id}: levels ${i} and ${i + 1} (${LEVELS[i - 1].id}/${LEVELS[i].id}) both show ${shared.join(", ")}`);
  }
  CHAPTERS.forEach((c, ci) => {
    const rows = LEVELS.slice(c.start, c.end).map((l) => localizeRaw(l));
    const twist = bossTwist(c.boss)!;
    const boss = rows[rows.length - 1];
    if (twist !== "emoji" && !suitsTwist(twist, boss, rules)) {
      fail(`${id}: chapter ${ci + 1}'s boss ${LEVELS[c.boss].id} (${boss.pivot}) can't carry its "${twist}" twist — see suitsTwist in src/puzzles.ts`);
    }
    const wordplay = rows.filter(WORDPLAY);
    if (wordplay.length > 1) fail(`${id}: chapter ${ci + 1} holds ${wordplay.length} compound-word boards (${wordplay.map((l) => l.pivot).join(", ")})`);
  });
  // The tutorial board: the coach teaches its FIRST category, so that one has
  // to be a plain set the player can see without knowing the link.
  const tutorial = localizeRaw(LEVELS[0]);
  if (WORDPLAY(tutorial)) fail(`${id}: the tutorial board (${tutorial.pivot}) carries a compound-word group — the coach can't teach one`);

  const n = bad - before;
  console.log(`${n === 0 ? "✓" : "✗"} ${id}: ${ALL_RAW.length} boards, ${CHAPTERS.length} keys, the ${LEVELS.length}-level curve — ${n === 0 ? "valid" : `${n} problem${n === 1 ? "" : "s"}`}`);
}

checkShape();
const locales = (only ? [only] : [...SHIPPED_LOCALES]).filter((l): l is Locale => (LOCALE_IDS as readonly string[]).includes(l));
if (only && !locales.length) {
  console.log(`✗ unknown locale "${only}" — one of ${LOCALE_IDS.join(", ")}`);
  process.exit(1);
}
for (const id of locales) {
  const content = id === "en" ? null : await loadContent(id);
  setActiveContent(content);
  setScriptLocale(id);
  checkLocale(id, content, rulesFor(id));
}
setActiveContent(null);
setScriptLocale("en");
console.log(`\n${locales.length} language${locales.length === 1 ? "" : "s"} checked — ${bad === 0 ? "all valid ✓" : `${bad} problem${bad === 1 ? "" : "s"} ✗`}`);
process.exit(bad ? 1 : 0);
