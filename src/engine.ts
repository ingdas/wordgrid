// Pure, side-effect-free game logic, split out from the Game component so it
// can be unit-tested without a DOM. See scripts/engine.test.mts.
import type { Category } from "./puzzles";

export type GuessResult =
  | { kind: "solved"; category: Category }
  | { kind: "repeat" }
  | { kind: "wrong" };

/** Resolve a 3-spoke selection against the unsolved categories. */
export function evaluateGuess(
  unsolved: Category[],
  selected: string[],
  pastGuesses: ReadonlySet<string>
): GuessResult {
  const sel = new Set(selected);
  const match = unsolved.find((c) => c.spokes.length === sel.size && c.spokes.every((s) => sel.has(s)));
  if (match) return { kind: "solved", category: match };
  if (pastGuesses.has(guessKey(selected))) return { kind: "repeat" };
  return { kind: "wrong" };
}

/** A canonical key for a selection, order-independent. */
export function guessKey(selected: string[]): string {
  return [...selected].sort().join("|");
}

/** Base star rating from the number of pairing mistakes. */
export function starsForMistakes(mistakes: number): number {
  return mistakes === 0 ? 3 : mistakes === 1 ? 2 : 1;
}

/**
 * Final stars: start from the mistake-based rating, then dock one for a wrong
 * link guess and one per hint used. Never below 1.
 */
export function computeStars(opts: {
  mistakes: number;
  linkGuessed: boolean;
  linkCorrect: boolean;
  hintsUsed: number;
}): number {
  const penalty = (opts.linkGuessed && !opts.linkCorrect ? 1 : 0) + opts.hintsUsed;
  return Math.max(1, starsForMistakes(opts.mistakes) - penalty);
}

/** Fisher–Yates shuffle returning a new array (does not mutate input). */
export function shuffle<T>(input: readonly T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Upper-case and strip everything but letters, for forgiving text matching. */
export function normalizeWord(s: string): string {
  return s.toUpperCase().replace(/[^A-Z]/g, "");
}

/**
 * Does the typed guess match the secret link? Accepts the pivot and any
 * author-listed synonyms ("if the categories allow it"), and is forgiving about
 * case, spacing, and simple singular/plural differences.
 */
export function linkMatches(input: string, pivot: string, accept: string[] = []): boolean {
  const n = normalizeWord(input);
  if (!n) return false;
  return [pivot, ...accept].map(normalizeWord).some((t) => t === n || `${t}S` === n || t === `${n}S`);
}

