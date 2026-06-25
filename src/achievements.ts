import { LEVELS } from "./puzzles";
import { clearedCount, type Progress } from "./progress";

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  desc: string;
}

/** Context from the just-finished win, for one-shot achievements. */
export interface WinCtx {
  stars: number;
  timeMs: number;
  linkCorrect: boolean;
  daily: boolean;
}

const HALF = Math.floor(LEVELS.length / 2);

const DEFS: (Achievement & { pred: (p: Progress, c: WinCtx) => boolean })[] = [
  { id: "first", icon: "🎉", title: "First Find", desc: "Clear your first level.", pred: (p) => clearedCount(p) >= 1 },
  { id: "flawless", icon: "✨", title: "Flawless", desc: "Earn 3 stars on a level.", pred: (_p, c) => c.stars === 3 },
  { id: "link", icon: "🔑", title: "Mind Reader", desc: "Guess the secret link.", pred: (_p, c) => c.linkCorrect },
  { id: "speed", icon: "⚡", title: "Speed Demon", desc: "Clear a level under 30s.", pred: (_p, c) => c.timeMs > 0 && c.timeMs < 30000 },
  { id: "streak5", icon: "🔥", title: "On Fire", desc: "Win 5 in a row.", pred: (p) => p.bestStreak >= 5 },
  { id: "daily7", icon: "📅", title: "Regular", desc: "Reach a 7-day daily streak.", pred: (p) => p.daily.streak >= 7 },
  { id: "half", icon: "🌗", title: "Halfway There", desc: `Clear ${HALF} levels.`, pred: (p) => clearedCount(p) >= HALF },
  { id: "perfect10", icon: "🌟", title: "Perfectionist", desc: "3-star ten levels.", pred: (p) => Object.values(p.stars).filter((s) => s === 3).length >= 10 },
  { id: "all", icon: "👑", title: "Completionist", desc: "Clear every level.", pred: (p) => clearedCount(p) >= LEVELS.length },
];

export const ACHIEVEMENTS: Achievement[] = DEFS.map(({ pred: _pred, ...a }) => a);

/** Ids satisfied by the post-win progress that weren't already unlocked. */
export function newlyUnlocked(p: Progress, c: WinCtx): string[] {
  return DEFS.filter((d) => d.pred(p, c) && !p.achievements.includes(d.id)).map((d) => d.id);
}
