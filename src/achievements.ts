import { LEVELS } from "./puzzles";
import { clearedCount, totalStars, type Progress } from "./progress";

// Tiered achievements (Bronze / Silver / Gold). Each tier has a threshold on a
// cumulative metric and grants hint tokens as a reward when first reached.

export const TIER_NAMES = ["Bronze", "Silver", "Gold"];
export const TIER_COLORS = ["#cd7f32", "#cbd5e1", "#fbbf24"];

export interface AchievementDef {
  id: string;
  icon: string;
  title: string;
  unit: string;
  tiers: [number, number, number];
  reward: [number, number, number]; // hint tokens granted per tier
  metric: (p: Progress) => number;
}

const threeStarCount = (p: Progress) => Object.values(p.stars).filter((s) => s === 3).length;
const MAX = LEVELS.length;

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "clear", icon: "🧩", title: "Solver", unit: "levels cleared", tiers: [1, 20, MAX], reward: [1, 2, 3], metric: clearedCount },
  { id: "stars", icon: "⭐", title: "Star Collector", unit: "stars earned", tiers: [3, 75, MAX * 3], reward: [1, 2, 3], metric: totalStars },
  { id: "streak", icon: "🔥", title: "Streaker", unit: "best win streak", tiers: [3, 6, 12], reward: [1, 2, 3], metric: (p) => p.bestStreak },
  { id: "links", icon: "🔑", title: "Mind Reader", unit: "links guessed", tiers: [1, 15, 50], reward: [1, 2, 3], metric: (p) => p.linksGuessed },
  { id: "perfect", icon: "🌟", title: "Perfectionist", unit: "3-star levels", tiers: [1, 15, MAX], reward: [1, 2, 3], metric: threeStarCount },
  { id: "daily", icon: "📅", title: "Daily Devotee", unit: "daily streak", tiers: [3, 7, 30], reward: [2, 3, 5], metric: (p) => p.daily.streak },
];

export function tierKey(id: string, tier: number): string {
  return `${id}:${tier}`;
}

export interface NewUnlock {
  def: AchievementDef;
  tier: number;
}

/** Tiers newly satisfied by this progress, plus the total hint reward. */
export function evaluateUnlocks(p: Progress): { unlocked: NewUnlock[]; reward: number; keys: string[] } {
  const unlocked: NewUnlock[] = [];
  const keys: string[] = [];
  let reward = 0;
  for (const def of ACHIEVEMENTS) {
    const v = def.metric(p);
    def.tiers.forEach((th, i) => {
      if (v >= th && !p.achievements.includes(tierKey(def.id, i))) {
        unlocked.push({ def, tier: i });
        keys.push(tierKey(def.id, i));
        reward += def.reward[i];
      }
    });
  }
  return { unlocked, reward, keys };
}

/** Highest tier reached (-1 if none), current value, and the next threshold. */
export function achievementStatus(p: Progress, def: AchievementDef): {
  tier: number;
  value: number;
  nextThreshold: number | null;
} {
  const value = def.metric(p);
  let tier = -1;
  def.tiers.forEach((th, i) => {
    if (value >= th) tier = i;
  });
  const nextThreshold = tier < def.tiers.length - 1 ? def.tiers[tier + 1] : null;
  return { tier, value, nextThreshold };
}
