// The letter bank behind every spell-the-link finale (the main game's and
// Pairs'). Deterministic per pivot, so the same board always offers the same
// tiles.
export function buildLetterBank(pivot: string): string[] {
  const letters = pivot.split("");
  const total = Math.min(15, Math.max(13, pivot.length + 8));
  const POOL = "EAIOTNRSLCUDPMHGBFYWKVXZJQ";
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
