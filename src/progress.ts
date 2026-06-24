import { LEVELS } from "./puzzles";

// Meta-progression: per-level star ratings (best of), a win streak, and a few
// lifetime stats. This is the "collect the stars / keep the streak alive" hook
// that gives the levels a reason to be replayed.

export interface Progress {
  stars: Record<string, number>; // level id -> best stars (1-3)
  streak: number;
  bestStreak: number;
  linksGuessed: number; // lifetime count of correct link guesses
  best: Record<string, number>; // level id -> best time in ms (lower is better)
}

const KEY = "wordgrid:progress";

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Progress>;
      return {
        stars: p.stars ?? {},
        streak: p.streak ?? 0,
        bestStreak: p.bestStreak ?? 0,
        linksGuessed: p.linksGuessed ?? 0,
        best: p.best ?? {},
      };
    }
  } catch {
    /* ignore */
  }
  return { stars: {}, streak: 0, bestStreak: 0, linksGuessed: 0, best: {} };
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

export const MAX_STARS = LEVELS.length * 3;

export function totalStars(p: Progress): number {
  return Object.values(p.stars).reduce((a, b) => a + b, 0);
}

export function clearedCount(p: Progress): number {
  return Object.values(p.stars).filter((s) => s > 0).length;
}

// How many levels ahead of your furthest clear stay unlocked.
const LOOKAHEAD = 3;

/** Index (in LEVELS order) of the furthest cleared level, or -1. */
export function furthestCleared(p: Progress): number {
  let furthest = -1;
  LEVELS.forEach((lvl, i) => {
    if ((p.stars[lvl.id] ?? 0) > 0) furthest = i;
  });
  return furthest;
}

/** Looser gating: the first few levels plus a window ahead of your progress. */
export function isUnlocked(p: Progress, index: number): boolean {
  return index <= furthestCleared(p) + LOOKAHEAD;
}
