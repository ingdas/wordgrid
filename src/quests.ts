// Daily quests — three small goals that expire at midnight.
//
// The game already counts a lot of things forever: stars, achievements tiers,
// lifetime score, best streak. What none of those give a returning player is a
// reason to play *today* specifically, or a reason to open a mode they've never
// touched. Three goals that reset every night do both, and they pay in the one
// currency the game actually spends — hint tokens.
//
// Deliberately small: one hint per quest, two more for the set (five a day at
// most, against one hint per level cleared). They nudge; they don't become the
// reason you're here.
//
// This module is pure and knows nothing about React or storage — the state
// lives inside `Progress` (see progress.ts) and the events are raised in
// App.tsx wherever a board finishes.

/** Everything a quest can be counting. Raised by App.tsx on a finished board. */
export type QuestEvent = "solve" | "perfect" | "link" | "combo" | "daily" | "logic" | "pairs";

export interface QuestDef {
  id: string;
  icon: string;
  event: QuestEvent;
  /** How many of the event it takes. Interpolated into the title as {n}. */
  goal: number;
  /** Catalogue key — the copy lives in src/i18n. */
  titleKey: string;
}

/** The pool. Three of these are drawn per day; see `todaysQuests`. */
export const QUEST_POOL: QuestDef[] = [
  { id: "solve2", icon: "🧩", event: "solve", goal: 2, titleKey: "quest.solve.title" },
  { id: "perfect", icon: "⭐", event: "perfect", goal: 1, titleKey: "quest.perfect.title" },
  { id: "link", icon: "🔑", event: "link", goal: 1, titleKey: "quest.link.title" },
  { id: "combo", icon: "🔥", event: "combo", goal: 1, titleKey: "quest.combo.title" },
  { id: "daily", icon: "📅", event: "daily", goal: 1, titleKey: "quest.daily.title" },
  { id: "logic", icon: "🧠", event: "logic", goal: 1, titleKey: "quest.logic.title" },
  { id: "pairs", icon: "🃏", event: "pairs", goal: 1, titleKey: "quest.pairs.title" },
];

/** A ×3 chain is what the "combo" quest asks for — three groups, no misses. */
export const COMBO_TARGET = 3;

export const QUESTS_PER_DAY = 3;
export const QUEST_REWARD = 1; // hints, per quest
export const QUEST_SET_BONUS = 2; // hints, for finishing all three
/** Marks the set bonus as paid, alongside the quest ids in `claimed`. */
export const SET_ID = "set";

export interface QuestState {
  /** The day these belong to (progress.todayKey format). */
  date: string;
  /** Event counts so far today, keyed by QuestEvent. */
  counts: Partial<Record<QuestEvent, number>>;
  /** Quest ids already paid out today, plus SET_ID for the completion bonus. */
  claimed: string[];
}

export function freshQuests(date: string): QuestState {
  return { date, counts: {}, claimed: [] };
}

// The day key ("2026-8-19", local time — the same convention as the daily
// puzzle) as a day number, so a draw can look at the day before it.
function dayNumber(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const ms = new Date(y || 1970, (m || 1) - 1, d || 1).getTime();
  return Number.isFinite(ms) ? Math.floor(ms / 86_400_000) : 0;
}

/** The pool, shuffled stably for one day. Fisher-Yates over a seeded LCG. */
function drawFor(day: number): QuestDef[] {
  const order = [...QUEST_POOL];
  let seed = (Math.imul(day || 1, 2654435761) ^ 0x9e3779b9) >>> 0 || 1;
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/**
 * The three quests for a given day. Deterministic — the same date draws the
 * same three on every device, with nothing stored — and never an exact repeat
 * of yesterday's three: waking up to the card you just cleared is the one draw
 * that makes the whole thing feel like wallpaper, so when the shuffle lands
 * there the fourth quest takes the first one's place.
 */
export function todaysQuests(date: string): QuestDef[] {
  const day = dayNumber(date);
  const order = drawFor(day);
  const today = order.slice(0, QUESTS_PER_DAY);
  const yesterday = drawFor(day - 1).slice(0, QUESTS_PER_DAY);
  const repeat = today.every((d) => yesterday.some((y) => y.id === d.id));
  return repeat ? [order[QUESTS_PER_DAY], ...today.slice(1)] : today;
}

/** How far along one quest is today (capped at its goal). */
export function questProgress(state: QuestState, def: QuestDef): number {
  return Math.min(def.goal, state.counts[def.event] ?? 0);
}

export function questDone(state: QuestState, def: QuestDef): boolean {
  return questProgress(state, def) >= def.goal;
}

/** Quests done today, out of the three drawn. */
export function questsDone(state: QuestState, date: string): number {
  return todaysQuests(date).filter((d) => questDone(state, d)).length;
}

/** Yesterday's card is not today's: roll over before counting anything. */
export function questsFor(state: QuestState | undefined, date: string): QuestState {
  return state && state.date === date ? state : freshQuests(date);
}

export interface QuestOutcome {
  state: QuestState;
  /** Quests that just crossed their goal (and so just got paid). */
  completed: QuestDef[];
  /** Whether this event finished the set — the bonus is inside `reward`. */
  setDone: boolean;
  /** Hint tokens earned by this event. */
  reward: number;
}

/**
 * Count one event and pay out anything it finished.
 *
 * Rewards are granted the moment a goal is met — there is no "claim" button to
 * find, and `claimed` is what stops a second event paying the same quest twice.
 */
export function recordQuest(
  state: QuestState | undefined,
  event: QuestEvent,
  date: string,
  amount = 1
): QuestOutcome {
  const base = questsFor(state, date);
  const next: QuestState = {
    ...base,
    counts: { ...base.counts, [event]: (base.counts[event] ?? 0) + amount },
    claimed: [...base.claimed],
  };
  const today = todaysQuests(date);
  const completed: QuestDef[] = [];
  let reward = 0;
  for (const def of today) {
    if (def.event !== event) continue;
    if (next.claimed.includes(def.id)) continue;
    if (!questDone(next, def)) continue;
    next.claimed.push(def.id);
    completed.push(def);
    reward += QUEST_REWARD;
  }
  let setDone = false;
  if (
    completed.length &&
    !next.claimed.includes(SET_ID) &&
    today.every((d) => questDone(next, d))
  ) {
    next.claimed.push(SET_ID);
    setDone = true;
    reward += QUEST_SET_BONUS;
  }
  return { state: next, completed, setDone, reward };
}
