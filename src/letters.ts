// The letter bank behind every spell-the-link finale. Deterministic per pivot,
// so the same board always offers the same tiles. "Letter" is whatever the
// language spells with — see src/i18n/script.ts.
import { activeScript, graphemes } from "./i18n/script.ts";

export function buildLetterBank(pivot: string): string[] {
  const letters = graphemes(pivot);
  const total = Math.min(15, Math.max(13, letters.length + 8));
  const POOL = activeScript().pool(pivot);
  let seed = 7;
  for (const c of pivot) seed = (seed * 31 + c.charCodeAt(0)) >>> 0;
  const rand = () => (seed = (seed * 1103515245 + 12345) >>> 0) / 0x100000000;
  while (letters.length < total) letters.push(POOL[Math.floor(rand() * POOL.length)]);
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  return letters;
}

/**
 * Just the word's own letters, shuffled — no padding. The chapter keys use
 * this: their bank IS the letters the player banked, one per level cleared, so
 * a bank padded with decoys would tell a lie about what they collected.
 * Deterministic per word, so the jumble is stable across renders and reloads.
 */
export function shuffledLetters(word: string): string[] {
  const letters = graphemes(word);
  let seed = 11;
  for (const c of word) seed = (seed * 31 + c.charCodeAt(0)) >>> 0;
  const rand = () => (seed = (seed * 1103515245 + 12345) >>> 0) / 0x100000000;
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  return letters;
}
