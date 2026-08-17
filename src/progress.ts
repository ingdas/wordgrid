import { CHAPTERS, LEVELS, chapterKey, keyLevels, seededShuffle, type RawPuzzle } from "./puzzles.ts";
import { DAILY_PUZZLES } from "./dailyPuzzles.ts";
import { isDebug } from "./debug.ts";

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
  pairsBest: number; // fewest moves to clear a Pairs board (0 = never cleared)
  deductionSolved: string[]; // ids of solved Deduction Grid levels
  seen: string[]; // level ids already watched opening on the map (see newlyUnlocked)
  banked: string[]; // level ids already watched handing their key letter over
  keys: number[]; // chapter indices whose key has been spelled (opens that boss)
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
      const loaded: Progress = {
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
        pairsBest: p.pairsBest ?? 0,
        deductionSolved: p.deductionSolved ?? [],
        seen: p.seen ?? [],
        banked: p.banked ?? [],
        keys: p.keys ?? [],
      };
      // A returning player shouldn't be met by a dozen "just unlocked!" reveals
      // for levels they opened months ago — the first time this field appears,
      // everything already open counts as seen.
      if (p.seen === undefined) loaded.seen = unlockedIds(loaded);
      // Same for the letters: a save from before the runes existed has already
      // banked them, so they're on the rail, not queued up to fly there.
      if (p.banked === undefined) loaded.banked = bankedIds(loaded);
      return loaded;
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
    pairsBest: 0,
    deductionSolved: [],
    // The levels a brand-new player starts with were never locked to them, so
    // they don't get an unlock reveal on the first visit to the map.
    seen: LEVELS.slice(0, LOOKAHEAD).map((l) => l.id),
    banked: [],
    keys: [],
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
// Nine titles, localized as rank.1 … rank.9 (see src/i18n).
const RANK_COUNT = 9;

export interface Rank {
  level: number; // 1-based
  /** 1-based index into the rank titles — look up `rank.${titleIndex}`. */
  titleIndex: number;
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
    titleIndex: Math.min(level, RANK_COUNT - 1) + 1,
    into,
    span: need,
    pct: Math.min(100, Math.round((into / need) * 100)),
  };
}

// How many levels ahead of your furthest clear stay unlocked.
const LOOKAHEAD = 3;

// The debug switch itself lives in ./debug.ts (it is read by the UI too); what
// it means for gating is here: every level and every boss door stands open.

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
  if (index > furthestCleared(p) + LOOKAHEAD) return false;
  return !keyLockedBoss(p, index);
}

// --- Chapter keys ---------------------------------------------------------
// Every non-boss level in a chapter banks one letter of that chapter's hidden
// keyword. Bank them all, spell the word, and the boss door opens — so a boss
// is something the chapter earns rather than the next number along.
//
// Banked letters are DERIVED from cleared levels, never stored: no migration,
// and a save edited elsewhere can't desync from what the player has done.

/** How many of chapter `ci`'s key letters the player has banked. */
export function bankedLetters(p: Progress, ci: number): number {
  return keyLevels(ci).filter((i) => (p.stars[LEVELS[i].id] ?? 0) > 0).length;
}

// --- Which letters the map still owes the player a moment for ---------------
// Clearing a level buys a letter, and that hand-over is the payoff for the
// clear — so the map plays it: the level's own chip turns into its letter and
// flies to the chapter's rail. `banked` is what stops it replaying forever,
// exactly as `seen` does for unlocks.

/** Ids of every cleared level that banks a key letter, in level order. */
export function bankedIds(p: Progress): string[] {
  const out: string[] = [];
  CHAPTERS.forEach((_, ci) => {
    keyLevels(ci).forEach((i) => {
      if ((p.stars[LEVELS[i].id] ?? 0) > 0) out.push(LEVELS[i].id);
    });
  });
  return out;
}

/** Letters banked since the map last showed them arriving, oldest first. */
export function newlyBanked(p: Progress): string[] {
  const shown = new Set(p.banked);
  return bankedIds(p).filter((id) => !shown.has(id));
}

/**
 * Record every banked letter as shown. Additive like markSeen, and for the
 * same reason: a replayed level can bank a letter out of level order.
 */
export function markBanked(p: Progress): Progress {
  const ids = bankedIds(p);
  const shown = new Set(p.banked);
  if (ids.every((id) => shown.has(id))) return p;
  ids.forEach((id) => shown.add(id));
  return { ...p, banked: [...shown] };
}

/** Every letter banked — the key can be attempted. */
export function keyReady(p: Progress, ci: number): boolean {
  return bankedLetters(p, ci) >= chapterKey(ci).length;
}

export function keySolved(p: Progress, ci: number): boolean {
  return p.keys.includes(ci);
}

export function solveKey(p: Progress, ci: number): Progress {
  return p.keys.includes(ci) ? p : { ...p, keys: [...p.keys, ci] };
}

/**
 * Is the key the ONLY thing holding this boss shut? A boss further ahead than
 * the progress window is locked anyway, and telling that player to go spell a
 * key they can't finish yet is noise — they need "not yet", not "do this".
 */
export function bossAwaitingKey(p: Progress, index: number): boolean {
  return keyLockedBoss(p, index) && index <= furthestCleared(p) + LOOKAHEAD;
}

/**
 * Is this level a boss still shut behind its chapter key? A boss you've already
 * beaten stays open forever — the key gates the first clear, not replays, so
 * nobody loses access to something they've finished.
 */
export function keyLockedBoss(p: Progress, index: number): boolean {
  if (isDebug()) return false;
  const ci = CHAPTERS.findIndex((c) => c.boss === index);
  if (ci < 0) return false;
  if ((p.stars[LEVELS[index].id] ?? 0) > 0) return false;
  return !keySolved(p, ci);
}

// --- What's new since you last looked at the map ---------------------------
// Clearing a level opens the next one silently: you came back to the map and a
// square had quietly changed colour, which made a hundred unlocks feel like one
// event repeated. The map now *shows* the lock coming off — but only once per
// level,
// which is what `seen` is for.

/**
 * Ids of every currently-open level. Deliberately ignores the debug switch:
 * flipping `?debug` on shouldn't count as unlocking the whole campaign, nor should
 * flipping it off take them away again.
 */
export function unlockedIds(p: Progress): string[] {
  const limit = furthestCleared(p) + LOOKAHEAD;
  return LEVELS.slice(0, limit + 1)
    .filter((_, i) => !keyLockedBoss(p, i))
    .map((l) => l.id);
}

/**
 * Levels that opened since the player last saw the map, oldest first. A level
 * they've already cleared is never "new" to them, however the save got there.
 */
export function newlyUnlocked(p: Progress): string[] {
  const seen = new Set(p.seen);
  return unlockedIds(p).filter((id) => !seen.has(id) && !((p.stars[id] ?? 0) > 0));
}

/**
 * Record every open level as seen, so its unlock plays exactly once. Additive:
 * `seen` only ever grows, so it can't be a prefix comparison — a key-locked
 * boss is skipped by unlockedIds and joins the list later, out of order.
 */
export function markSeen(p: Progress): Progress {
  const ids = unlockedIds(p);
  const seen = new Set(p.seen);
  if (ids.every((id) => seen.has(id))) return p;
  ids.forEach((id) => seen.add(id));
  return { ...p, seen: [...seen] };
}

// --- Daily challenge -------------------------------------------------------

export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// The day number in local time, so everyone gets a fresh daily at their own
// midnight (same convention as todayKey).
function dayNumber(key = todayKey()): number {
  const [y, m, d] = key.split("-").map(Number);
  return Math.floor(new Date(y, m - 1, d).getTime() / 86_400_000);
}

// A fixed shuffled tour of the dedicated daily pool: every puzzle appears
// exactly once per cycle, so the daily never repeats a puzzle within
// DAILY_PUZZLES.length days — and never overlaps the campaign at all.
const DAILY_ORDER = seededShuffle([...DAILY_PUZZLES.keys()], 20260702);

/** The shared daily puzzle for a given day (same for every player). */
export function dailyPuzzle(key = todayKey()): RawPuzzle {
  const n = dayNumber(key) % DAILY_ORDER.length;
  return DAILY_PUZZLES[DAILY_ORDER[(n + DAILY_ORDER.length) % DAILY_ORDER.length]];
}

export function dailyDoneToday(p: Progress, key = todayKey()): boolean {
  return p.daily.lastDate === key;
}

/**
 * The streak as it stands right now. `daily.streak` is only rewritten when the
 * next daily is cleared, so a stored 6 can outlive the run by weeks — showing
 * it would promise a streak that recordDaily() is about to reset to 1. A run
 * is still alive only if the last clear was today or yesterday.
 */
export function liveDailyStreak(p: Progress, now = new Date()): number {
  if (!p.daily.lastDate || p.daily.streak <= 0) return 0;
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  const alive = p.daily.lastDate === todayKey(now) || p.daily.lastDate === todayKey(y);
  return alive ? p.daily.streak : 0;
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
  /** The day itself — the caller formats the weekday in the active locale. */
  date: Date;
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
    cells.push({ key, date: d, done: done.has(key), today: key === todayK });
  }
  return cells;
}

/** Milliseconds until the next local midnight (when a fresh daily unlocks). */
export function msUntilNextDaily(now = new Date()): number {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}
