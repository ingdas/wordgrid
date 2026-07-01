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
  achievements: string[]; // unlocked achievement ids
  hints: number; // bank of category-description hints
  history: HistoryEntry[]; // recent finished games, newest first
  score: number; // lifetime points (groups + combos + links)
  endlessBest: number; // most puzzles cleared in one Endless run
}

export const STARTING_HINTS = 3;

export interface HistoryEntry {
  at: number; // timestamp
  id: string;
  level: number; // 1-based level number
  title: string;
  won: boolean;
  stars: number;
  mistakes: number;
  timeMs: number;
  linkCorrect: boolean;
  daily: boolean;
}

const HISTORY_CAP = 40;

export function pushHistory(p: Progress, entry: HistoryEntry): Progress {
  return { ...p, history: [entry, ...p.history].slice(0, HISTORY_CAP) };
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
        achievements: p.achievements ?? [],
        hints: p.hints ?? STARTING_HINTS,
        history: p.history ?? [],
        score: p.score ?? 0,
        endlessBest: p.endlessBest ?? 0,
      };
    }
  } catch {
    /* ignore */
  }
  return {
    stars: {},
    streak: 0,
    bestStreak: 0,
    linksGuessed: 0,
    best: {},
    daily: { lastDate: "", streak: 0 },
    achievements: [],
    hints: STARTING_HINTS,
    history: [],
    score: 0,
    endlessBest: 0,
  };
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

// --- Player rank ----------------------------------------------------------
// A lightweight XP ladder off lifetime score, for a constant sense of growth.
// Each level costs ~25% more than the last; titles repeat the top once maxed.
const RANK_TITLES = [
  "Novice", "Apprentice", "Wordsmith", "Sharp Eye", "Cryptic Mind",
  "Mastermind", "Luminary", "Grandmaster", "Legend",
];

export interface Rank {
  level: number; // 1-based
  title: string;
  into: number; // XP into the current level
  span: number; // XP needed to finish the current level
  pct: number; // 0-100 progress to next level
}

export function playerRank(score: number): Rank {
  let level = 0;
  let acc = 0;
  let need = 500;
  while (score >= acc + need && level < 98) {
    acc += need;
    level++;
    need = Math.round(need * 1.25);
  }
  const into = score - acc;
  return {
    level: level + 1,
    title: RANK_TITLES[Math.min(level, RANK_TITLES.length - 1)],
    into,
    span: need,
    pct: Math.min(100, Math.round((into / need) * 100)),
  };
}

// How many levels ahead of your furthest clear stay unlocked.
const LOOKAHEAD = 3;

// Debug switch: add `?debug` to the URL (it's remembered afterwards) or set
// localStorage["wordgrid:debug"]="1" to unlock every level immediately. Add
// `?debug=0` to turn it back off. Read once per load.
const DEBUG_KEY = "wordgrid:debug";
let debugCache: boolean | null = null;
export function isDebug(): boolean {
  if (debugCache !== null) return debugCache;
  try {
    const q = new URLSearchParams(window.location.search);
    if (q.has("debug")) localStorage.setItem(DEBUG_KEY, q.get("debug") === "0" ? "0" : "1");
    debugCache = localStorage.getItem(DEBUG_KEY) === "1";
  } catch {
    debugCache = false;
  }
  return debugCache;
}

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
  if (isDebug()) return true; // debug: everything open
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

export interface DayCell {
  key: string;
  label: string; // weekday initial
  done: boolean;
  today: boolean;
}

/** The last 7 days for the streak strip, derived from lastDate + streak. */
export function dailyWeek(p: Progress, now = new Date()): DayCell[] {
  const todayK = todayKey(now);
  const done = new Set<string>();
  if (p.daily.lastDate && p.daily.streak > 0) {
    const [ly, lm, ld] = p.daily.lastDate.split("-").map(Number);
    const last = new Date(ly, lm - 1, ld);
    for (let i = 0; i < p.daily.streak; i++) {
      const d = new Date(last);
      d.setDate(d.getDate() - i);
      done.add(todayKey(d));
    }
  }
  const cells: DayCell[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = todayKey(d);
    cells.push({ key, label: "SMTWTFS"[d.getDay()], done: done.has(key), today: key === todayK });
  }
  return cells;
}

/** Milliseconds until the next local midnight (when a fresh daily unlocks). */
export function msUntilNextDaily(now = new Date()): number {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}
