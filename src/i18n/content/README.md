# Puzzle content per language

Every language CrazyGames serves gets its **own boards**, not translations of
the English ones. WordGrid is a polysemy game — one link word, four senses —
and polysemy does not survive translation: PITCH is a throw, a sales talk, a
musical height and a playing field in English and nothing of the kind anywhere
else. So a language *rewrites* every slot with a link word of its own.

What every language shares is the campaign's **shape**: 100 levels in twelve
chapters, the same boss twist closing each chapter, the same hand-graded
difficulty curve, the same slot ids. `star` is level 1 in every language, so a
player who switches language keeps their progress; the board in that slot is
whatever that language put there.

## Files

- `src/i18n/<xx>.ts` — the interface strings (`export const xx: Record<string,
  string>`), every key of `src/i18n/en.ts`, checked by
  `scripts/i18n.test.mts`.
- `src/i18n/content/<xx>.ts` — the boards (`export const content:
  LocaleContent`), checked by `npm run validate -- --locale xx`.
- `src/i18n/script.ts` — what a letter is in each script, and the cipher.

## The authoring sheet

    node --experimental-strip-types scripts/i18n-slots.mts <xx>

prints every slot: level number, chapter, hand grade, boss twist and its hard
constraint, and the English board that sits there today — **for the idea, never
for translation**. Reuse the English link only when its four senses genuinely
exist in your language; otherwise pick a new link word. Then the daily pool,
the emoji boss, the chapter-key lengths and the decoys.

## Format

```ts
import type { LocaleContent } from "./types.ts";

export const content: LocaleContent = {
  keys: ["FUNKE", "GLUT…", …],           // 12 words, exact lengths (see the sheet)
  decoys: ["OZEAN", "TIGER", …],          // 20 plain, concrete nouns
  campaign: {
    star: {                                // the slot id, unchanged
      title: "Sternstunde",                // short, idiomatic; shown only once solved
      pivot: "STERN",                      // the link word — ONE word, four senses
      categories: [
        { name: "Am Nachthimmel", words: ["MOND", "KOMET", "PLANET"] },
        { name: "Berühmte Leute", words: ["IKONE", "LEGENDE", "IDOL"] },
        { name: "Auszeichnungen", words: ["MEDAILLE", "POKAL", "ORDEN"] },
        { name: "Zeichen und Formen", words: ["HERZ", "PFEIL", "KREUZ"] },
      ],
      accept: ["STERNE"],                  // optional: other accepted answers
    },
    …
  },
  emoji: { …, emoji: { NAGEL: "💅", … } },  // the picture board
  daily: { key: { … }, … },                // the 80 daily boards, ids unchanged
};
```

## Writing a board

A board is a link word and four groups of three tiles; the link joins every
group under a different sense. The test for every tile: *read it alone, with
no category names, and ask which groups on this board it could join.* If the
answer isn't exactly one, change the tile — never the category name, which the
player can't see while guessing.

**Enforced by `validate` (the build fails):**

1. Twelve distinct tiles plus the link; no tile contains the link as a substring.
2. A category name may not spell the link — the 💡 hint prints that name.
3. A category name may not name a tile of its own group, nor a tile of another
   group, nor an inflection of one (Bäume for BAUM, 사과를 for 사과).
4. Tiles, links, keys and decoys are written in the language's own script:
   Latin, Cyrillic or Greek letters upper-cased; Arabic without harakat; Thai;
   Hangul syllables; Japanese in hiragana/katakana only — **no kanji** on a
   tile, because the finale spells the link from a bank of kana. Category
   names may use anything.
5. Links are unique across the whole language (campaign, daily, emoji boss); a
   daily link is never a campaign link.
6. Adjacent levels never share a tile (the sheet lists levels in order).
7. At most one compound-word board per chapter, none on the tutorial board,
   none under the decoy boss. A compound-word group's name carries `___`
   ("___ + HAUS") so the checker can see it.
8. Boss slots fit their twist (the sheet states the constraint): *scramble* —
   every spoke ≤ 7 letters; *cipher* — no two spokes reduce to the same
   skeleton, every skeleton ≥ 2 letters, at most three 2-letter skeletons;
   *memory* — spokes ≤ 8 letters, no two begin with the same two letters;
   *decoy* — no `___` group, at most one spoke of 9+ letters. "Letter" is the
   unit of the script (a Hangul block, a Thai cluster, a kana).
9. Chapter keys: exactly as many letters as the chapter has non-boss levels
   (5, 6, 6, 7, 7, 7, 7, 8, 8, 8, 9, 10). Spaces are allowed and not counted,
   so a Korean or Japanese key can be a short phrase. No two keys alike.
10. The emoji board: a picture for every tile, no picture twice, none for a
    non-tile.

**Only a human catches these** — read for them anyway:

- A tile another group's category could claim (FIELD in "Baseball venues"
  beside "Green spaces"). The commonest and the most unfair.
- A tile that is a synonym of a tile in another group.
- A tile that is a synonym of the link.
- A category name that is factually wrong.

**Difficulty.** Match the slot's hand grade: 1 — four concrete sets under an
everyday link; 3 — half the groups are senses rather than sets; 5 — every group
is a different sense and the link is the last thing you see. A boss slot wants
the hardest board of its chapter.

**The tutorial (slot `star`).** The coach teaches the board's *first* category,
so make it a plain concrete set anyone can spot without knowing the link.

**The emoji boss.** Twelve pictures. Each tile is the picture's own everyday
name in your language (💅 = the word for a fingernail, 🦭 = the word for a
seal), and the four groups use a *second* sense of those names. What moves is
the sense, never the noun — a picture you must call something it isn't called
is a guessing game. No picture may depict the link itself.

**Titles.** Short, idiomatic, in the language; a title may play on the link
(it's shown only after the board is solved).

**Decoys.** Twenty plain, concrete, unambiguous nouns far from every link on
every board, so an impostor never accidentally fits a group.

## The interface strings

Translate every key of `en.ts`, keeping `{placeholders}` and emoji, in a warm,
brief, playful register — the game has a print / newspaper flavour ("The
Puzzle Press"), and many strings sit in tight buttons. Plural keys come as
`.one`/`.other`; add `.few`, `.many`, `.two` or `.zero` where your grammar needs
them (Russian, Polish, Czech, Ukrainian, Arabic, Romanian…) — they are picked
by `Intl.PluralRules`. The `twist.cipher.*` strings must describe what the
cipher actually does to a tile **in your script**, because it differs:

| script | the cipher boss shows |
|---|---|
| Latin, Cyrillic, Greek | the word without its vowels (CRASH → CRSH) |
| Arabic | the word without its long vowels ا و ي (كتاب → كتب) |
| Thai | the consonant frame, vowel and tone marks removed (เสือ → สอ) |
| Korean | the initial consonants only — 초성 (사과 → ㅅㄱ) |
| Japanese | every second kana blanked with 〇 (さくら → さ〇ら) |

Likewise `twist.scramble.*` talks about letters being shuffled — say kana or
syllables where that's what gets shuffled.
