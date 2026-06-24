import { PUZZLES } from "./puzzles";

// Meta-progression: per-level star ratings (best of) plus a win streak.
// This is the "collect all the stars / keep the streak alive" hook that gives
// the 31 puzzles a reason to be replayed.

export interface Progress {
  stars: Record<string, number>; // puzzle id -> best stars (1-3)
  streak: number;
  bestStreak: number;
}

const KEY = "wordgrid:progress";

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Progress>;
      return { stars: p.stars ?? {}, streak: p.streak ?? 0, bestStreak: p.bestStreak ?? 0 };
    }
  } catch {
    /* ignore */
  }
  return { stars: {}, streak: 0, bestStreak: 0 };
}

export function saveProgress(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export function starsForMistakes(mistakes: number): number {
  return mistakes === 0 ? 3 : mistakes === 1 ? 2 : 1;
}

export const MAX_STARS = PUZZLES.length * 3;

export function totalStars(p: Progress): number {
  return Object.values(p.stars).reduce((a, b) => a + b, 0);
}

/** A level is unlocked if it's the first, or the previous level was cleared. */
export function isUnlocked(p: Progress, index: number): boolean {
  if (index <= 0) return true;
  const prev = PUZZLES[index - 1];
  return (p.stars[prev.id] ?? 0) > 0;
}
