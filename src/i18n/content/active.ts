// The content overlay for the language being played. `puzzles.ts` reads it in
// `buildPuzzle`, `chapterKey`, `levelTitle` and `decoyTiles`, so every screen
// that plays or names a board sees the localized one without knowing about
// locales; `src/i18n/index.ts` sets it when a locale loads. English has no
// overlay — its boards are the source files themselves.
import type { RawPuzzle } from "../../puzzles.ts";
import type { ContentBoard, LocaleContent } from "./types.ts";

let active: LocaleContent | null = null;

export function setActiveContent(content: LocaleContent | null) {
  active = content;
}

export function activeContent(): LocaleContent | null {
  return active;
}

/** The overlay board for a raw puzzle, if the active language has one. */
export function overlayFor(raw: RawPuzzle, content: LocaleContent | null = active): ContentBoard | null {
  if (!content) return null;
  if (raw.emoji && Object.keys(raw.emoji).length) return content.emoji;
  return content.campaign[raw.id] ?? content.daily[raw.id] ?? null;
}

/** The board actually played for `raw` in the active language (English falls through). */
export function localizeRaw(raw: RawPuzzle, content: LocaleContent | null = active): RawPuzzle {
  const o = overlayFor(raw, content);
  if (!o) return raw;
  return {
    id: raw.id,
    title: o.title,
    pivot: o.pivot,
    categories: o.categories,
    accept: o.accept,
    emoji: o.emoji,
  };
}
