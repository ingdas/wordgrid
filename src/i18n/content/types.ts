// A language's puzzle content: not a translation of the English boards but a
// rewrite, slot for slot.
//
// The campaign's *shape* is shared by every language — 100 levels in twelve
// chapters, the same boss twist closing each, the same hand-graded difficulty
// curve, the same ids (`star` is level 1 everywhere, so a player's progress
// carries across a language switch). What a language supplies is the board
// that sits in each slot: its own link word with four senses of its own, its
// own category names and tiles. `scripts/i18n-slots.mts` prints what each slot
// demands; `npm run validate` checks every language against it.
import type { RawCategory } from "../../puzzles.ts";

export interface ContentBoard {
  title: string;
  pivot: string;
  categories: [RawCategory, RawCategory, RawCategory, RawCategory];
  /** Other spellings/synonyms accepted for the link at the finale. */
  accept?: string[];
  /** The emoji boss only: a picture per tile. */
  emoji?: Record<string, string>;
}

export interface LocaleContent {
  /** One keyword per chapter; its letters (spaces don't count) = the chapter's non-boss levels. */
  keys: string[];
  /** Impostor tiles for the decoy boss: ~20 plain, concrete nouns. */
  decoys: string[];
  /** Campaign boards by slot id. */
  campaign: Record<string, ContentBoard>;
  /** The picture board played at the emoji boss. */
  emoji: ContentBoard | null;
  /** The daily pool by id — also feeds Endless and Pairs. */
  daily: Record<string, ContentBoard>;
}
