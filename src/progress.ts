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
  daily: { lastDate: string; streak: number }; // daily-challenge streak
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
        daily: p.daily ?? { lastDate: "", streak: 0 },
      };
    }
  } catch {
    /* ignore */
  }
  return { stars: {}, streak: 0, bestStreak: 0, linksGuessed: 0, best: {}, daily: { lastDate: "", streak: 0 } };
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

// --- Daily challenge -------------------------------------------------------

export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** A deterministic level index for a given day. */
export function dailyIndex(key = todayKey()): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h % LEVELS.length;
}

export function dailyDoneToday(p: Progress, key = todayKey()): boolean {
  return p.daily.lastDate === key;
}

/** Update the daily streak after clearing today's challenge. */
export function recordDaily(p: Progress, key = todayKey()): Progress {
  if (p.daily.lastDate === key) return p; // already counted today
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const continued = p.daily.lastDate === todayKey(y);
  return { ...p, daily: { lastDate: key, streak: continued ? p.daily.streak + 1 : 1 } };
}
