// What a "letter" is, per language.
//
// The finale spells the link from a bank of tiles, the chapter key is a rail of
// banked letters, the scramble boss anagrams a tile and the cipher boss strips
// it down — all of which assumed a word is a run of A–Z. It isn't, once the
// boards are in Greek, Thai or Korean. Everything alphabet-shaped goes through
// this module instead:
//
//  - `letters()`  — the units a player taps to spell: a Latin/Cyrillic/Greek/
//                   Arabic letter, a kana, a Hangul syllable block, a Thai
//                   consonant with the vowel and tone marks that ride on it.
//  - `normalize()` — the forgiving form used to compare a typed guess with the
//                   answer: case, accents (where they're decoration rather than
//                   letters), Arabic short-vowel marks, katakana vs hiragana.
//  - `cipher()`   — what the "no vowels" boss does to a tile in this script. A
//                   consonant skeleton where the script has vowel letters; the
//                   initial consonants (초성) in Korean, the consonant frame in
//                   Thai, every second kana blanked in Japanese, the long vowels
//                   dropped in Arabic. `twist.cipher.*` copy describes it per
//                   language.
//  - `pool`       — the letters the finale bank pads with, roughly by frequency.
//
// Pure: no DOM, so node scripts (validate, the tests) can use it too.
import { type Locale, localeInfo } from "./locales.ts";

export type Family = "latin" | "cyrillic" | "greek" | "arabic" | "thai" | "hangul" | "kana";

export interface ScriptRules {
  locale: Locale;
  family: Family;
  letters(word: string): string[];
  normalize(word: string): string;
  upper(word: string): string;
  cipher(word: string): string;
  pool(pivot: string): string[];
  /** How wide one letter sits next to a Latin one — CJK and Thai tiles need smaller type sooner. */
  glyphWidth: number;
}

// --- graphemes --------------------------------------------------------------

const segmenter: Intl.Segmenter | null = (() => {
  try {
    return typeof Intl !== "undefined" && "Segmenter" in Intl
      ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
      : null;
  } catch {
    return null;
  }
})();

/** User-perceived characters: a base letter and every mark that rides on it. */
export function graphemes(s: string): string[] {
  if (!s) return [];
  if (segmenter) return Array.from(segmenter.segment(s), (x) => x.segment);
  return Array.from(s);
}

// --- folding ----------------------------------------------------------------

const MARKS = /\p{M}/gu;
const NOT_LETTER = /[^\p{L}\p{M}]/gu;

/** Strip diacritics from scripts where they decorate a letter (É → E, Ё → Е, ά → α). */
function stripMarks(s: string): string {
  return s.normalize("NFD").replace(MARKS, "").normalize("NFC");
}

function foldArabic(s: string): string {
  return s
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "") // harakat, tanwin, shadda, sukun, tatweel
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه");
}

function katakanaToHiragana(s: string): string {
  return s.replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

// --- the cipher per family --------------------------------------------------

const LATIN_VOWELS = "AEIOUÆØŒ";
const CYRILLIC_VOWELS = "АЕЁИОУЫЭЮЯІЇЄ";
const GREEK_VOWELS = "ΑΕΗΙΟΥΩ";
const ARABIC_LONG_VOWELS = /[اأإآٱوىي]/g;
// Thai vowel signs (leading, following, above, below), tone marks and the other
// combining marks — what's left is the consonant frame.
const THAI_MARKS = /[ะ-ฺเ-ไ็-๎]/g;
const HANGUL_INITIALS = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";

function dropLetters(word: string, isVowel: (upperLetter: string) => boolean): string {
  return graphemes(word)
    .filter((g) => !isVowel(g))
    .join("");
}

/** 초성: each syllable block reduced to its initial consonant (사과 → ㅅㄱ). */
function hangulInitials(word: string): string {
  return Array.from(word, (ch) => {
    const code = ch.charCodeAt(0);
    if (code < 0xac00 || code > 0xd7a3) return ch;
    return HANGUL_INITIALS[Math.floor((code - 0xac00) / 588)];
  }).join("");
}

/** さくら → さ〇ら: every second kana blanked, the first one kept as the foothold. */
function maskKana(word: string): string {
  return graphemes(word)
    .map((g, i) => (i % 2 === 1 ? "〇" : g))
    .join("");
}

// --- the table --------------------------------------------------------------

interface Spec {
  family: Family;
  pool: string;
  /** Latin only: is Y a vowel here (Finnish, the Scandinavian languages, Czech, Polish)? */
  yVowel?: boolean;
}

const SPECS: Record<Locale, Spec> = {
  en: { family: "latin", pool: "EAIOTNRSLCUDPMHGBFYWKVXZJQ" },
  es: { family: "latin", pool: "EAOSRNIDLCTUMPBGVYQHFZJÑX" },
  id: { family: "latin", pool: "ANEIRKTSUMLGDPBOHJYCWFV" },
  it: { family: "latin", pool: "EAIONLRTSCDPUMVGHFBZQ" },
  nl: { family: "latin", pool: "ENATIRODSLGVHKMUBPWJZCF" },
  fr: { family: "latin", pool: "ESAITNRULODCPMÉVQFBGHJXYZ" },
  pt: { family: "latin", pool: "AEOSRINDMUTCLPVGHQBFZJXÃÇ" },
  ru: { family: "cyrillic", pool: "ОЕАИНТСРВЛКМДПУЯЫЬГЗБЧЙХЖШЮЦЩЭФЁ" },
  pl: { family: "latin", pool: "AIOEZNRWSTCYKDPMUJLŁBGĘHĄÓŻŚĆŃŹF", yVowel: true },
  ro: { family: "latin", pool: "AIEROTNUSLCĂDPMÂÎȘȚVGFBHJZ" },
  de: { family: "latin", pool: "ENISRATDHULCGMOBWFKZVPÜÄÖJ" },
  nb: { family: "latin", pool: "ERNTASILODGKMVFUPBHÅØJÆY", yVowel: true },
  sv: { family: "latin", pool: "EANRTSILDOMKGVHFUPÄÖÅBCJY", yVowel: true },
  fi: { family: "latin", pool: "AITNESLOKUÄMVRJHYPDÖGBF", yVowel: true },
  uk: { family: "cyrillic", pool: "ОАНИІВРТЕСКЛУДМПЗЯЬБГЧЙХЖШЇЮЦЄЩФ" },
  el: { family: "greek", pool: "ΑΟΙΕΤΣΝΗΡΠΚΥΜΛΩΔΓΧΘΦΒΞΖΨ" },
  da: { family: "latin", pool: "ERNTDASILOGKMVFUBHPÅØÆJY", yVowel: true },
  cs: { family: "latin", pool: "OEANITVSLKRDPMUZJCHÝBÁÍÉŘŠŽČĚŮ", yVowel: true },
  hu: { family: "latin", pool: "EATLNSKROIMZGÉBDVHJUÁÖÓÜŐŰFCPY" },
  tr: { family: "latin", pool: "AEİNRLIKDMYUTSBOÜŞZGÇHĞVCÖPF" },
  ar: { family: "arabic", pool: "اليمنوتربسعدكهفحقجشخصطزضغثظذء" },
  vi: { family: "latin", pool: "NHTCGIAUOMĐLBKRSVXYPQÊÔƠƯĂÂ" },
  th: { family: "thai", pool: "นรกงมอาเดสตลบวยพหคชจทขปแฟถผฝศษฮูิี" },
  ko: { family: "hangul", pool: "가나다라마바사아자차카타파하이우오에기리시지니미디비드르스으" },
  ja: {
    family: "kana",
    pool: "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんがぎぐげござじずぜぞだでどばびぶべぼぱぴぷぺぽっゃゅょー",
  },
};

const cache = new Map<Locale, ScriptRules>();

export function rulesFor(locale: Locale): ScriptRules {
  const hit = cache.get(locale);
  if (hit) return hit;
  const spec = SPECS[locale] ?? SPECS.en;
  const tag = localeInfo(locale).tag;
  const upper = (s: string) => s.toLocaleUpperCase(tag);
  const poolLetters = graphemes(spec.pool);

  let rules: ScriptRules;
  switch (spec.family) {
    case "cyrillic":
    case "greek":
    case "latin": {
      const vowels = new Set(
        graphemes(
          spec.family === "latin"
            ? LATIN_VOWELS + (spec.yVowel ? "Y" : "")
            : spec.family === "cyrillic"
              ? CYRILLIC_VOWELS
              : GREEK_VOWELS
        )
      );
      // Latin and Greek accents sit on vowels (É, ά) and strip away; Cyrillic's
      // Й and Ё are letters of their own, so they're tested unfolded.
      const isVowel =
        spec.family === "cyrillic"
          ? (g: string) => vowels.has(upper(g))
          : (g: string) => vowels.has(stripMarks(upper(g)));
      rules = {
        locale,
        family: spec.family,
        glyphWidth: 1,
        letters: graphemes,
        upper,
        normalize: (s) => stripMarks(upper(s)).replace(NOT_LETTER, ""),
        cipher: (w) => dropLetters(w, isVowel),
        pool: () => poolLetters,
      };
      break;
    }
    case "arabic":
      rules = {
        locale,
        family: "arabic",
        glyphWidth: 1,
        letters: (w) => graphemes(foldArabic(w).replace(/[^\p{L}\p{M}]/gu, "")),
        upper: (s) => s,
        normalize: (s) => foldArabic(s).replace(NOT_LETTER, ""),
        cipher: (w) => w.replace(ARABIC_LONG_VOWELS, ""),
        pool: () => poolLetters,
      };
      break;
    case "thai":
      rules = {
        locale,
        family: "thai",
        glyphWidth: 1.15,
        letters: graphemes,
        upper: (s) => s,
        normalize: (s) => s.replace(NOT_LETTER, ""),
        cipher: (w) => w.replace(THAI_MARKS, ""),
        pool: () => poolLetters,
      };
      break;
    case "hangul":
      rules = {
        locale,
        family: "hangul",
        glyphWidth: 1.7,
        letters: graphemes,
        upper: (s) => s,
        normalize: (s) => s.normalize("NFC").replace(NOT_LETTER, ""),
        cipher: hangulInitials,
        pool: () => poolLetters,
      };
      break;
    case "kana": {
      const katakanaPool = poolLetters.map((k) =>
        k === "ー" ? k : String.fromCharCode(k.charCodeAt(0) + 0x60)
      );
      rules = {
        locale,
        family: "kana",
        glyphWidth: 1.7,
        letters: graphemes,
        upper: (s) => s,
        normalize: (s) => katakanaToHiragana(s.normalize("NFC")).replace(NOT_LETTER, ""),
        cipher: maskKana,
        // A katakana word is padded with katakana, so the bank doesn't tell
        // the player which tiles are the answer by their script.
        pool: (pivot) => (/[ァ-ヶ]/.test(pivot) ? katakanaPool : poolLetters),
      };
      break;
    }
  }
  cache.set(locale, rules);
  return rules;
}

// The rules for the language being played. engine.ts and letters.ts read this
// so nothing else has to thread a locale through; src/i18n/index.ts sets it
// whenever the locale loads or changes, and validate sets it per language.
let active: ScriptRules = rulesFor("en");

export function setScriptLocale(locale: Locale) {
  active = rulesFor(locale);
}

export function activeScript(): ScriptRules {
  return active;
}

/** Wide-glyph scripts need smaller type sooner: a word's width in Latin-letter units. */
export function displayWidth(word: string, rules = active): number {
  return graphemes(word).length * rules.glyphWidth;
}
