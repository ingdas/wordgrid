// Each puzzle has 9 words. There are 4 categories to find.
// Every category contains the SAME shared "pivot" word plus two unique words,
// so: 1 pivot + (4 x 2) = 9 words total.
//
// The pivot is listed first in `pivot` and is also included implicitly in each
// category's `members` (we add it at load time so the data stays readable).

export interface RawCategory {
  /** Human-readable theme revealed once solved. */
  name: string;
  /** The two words unique to this category (the pivot is added automatically). */
  words: [string, string];
}

export interface RawPuzzle {
  id: string;
  title: string;
  /** The word shared by all four categories. */
  pivot: string;
  categories: [RawCategory, RawCategory, RawCategory, RawCategory];
}

export const PUZZLES: RawPuzzle[] = [
  {
    id: "star",
    title: "Star Power",
    pivot: "STAR",
    categories: [
      { name: "Words for a celebrity", words: ["ICON", "LEGEND"] },
      { name: "Seen in the night sky", words: ["MOON", "COMET"] },
      { name: "___ + FISH", words: ["JELLY", "CAT"] },
      { name: "Symbols & emoji", words: ["HEART", "ARROW"] },
    ],
  },
  {
    id: "rock",
    title: "Rock Solid",
    pivot: "ROCK",
    categories: [
      { name: "Music genres", words: ["JAZZ", "BLUES"] },
      { name: "To move back and forth", words: ["SWAY", "SWING"] },
      { name: "Bits of stone", words: ["PEBBLE", "BOULDER"] },
      { name: "Hand game throws", words: ["PAPER", "SCISSORS"] },
    ],
  },
  {
    id: "spring",
    title: "Spring Loaded",
    pivot: "SPRING",
    categories: [
      { name: "Seasons", words: ["SUMMER", "WINTER"] },
      { name: "To leap suddenly", words: ["LEAP", "POUNCE"] },
      { name: "Sources of water", words: ["WELL", "GEYSER"] },
      { name: "Mechanical parts", words: ["GEAR", "COIL"] },
    ],
  },
  {
    id: "light",
    title: "Light Work",
    pivot: "LIGHT",
    categories: [
      { name: "Gives off light", words: ["LAMP", "TORCH"] },
      { name: "Not heavy", words: ["AIRY", "SLIGHT"] },
      { name: "___ + HOUSE", words: ["GREEN", "WARE"] },
      { name: "To set ablaze", words: ["IGNITE", "KINDLE"] },
    ],
  },
  {
    id: "bolt",
    title: "Bolt Upright",
    pivot: "BOLT",
    categories: [
      { name: "Hardware bits", words: ["SCREW", "NUT"] },
      { name: "To flee fast", words: ["DASH", "FLEE"] },
      { name: "Lightning-related", words: ["FLASH", "THUNDER"] },
      { name: "Secure a door", words: ["LATCH", "LOCK"] },
    ],
  },
  {
    id: "fire",
    title: "On Fire",
    pivot: "FIRE",
    categories: [
      { name: "Dismiss from a job", words: ["SACK", "CAN"] },
      { name: "Discharge a weapon", words: ["SHOOT", "BLAST"] },
      { name: "Burning hot things", words: ["FLAME", "EMBER"] },
      { name: "Burning enthusiasm", words: ["PASSION", "ZEAL"] },
    ],
  },
];

// ---------------------------------------------------------------------------

export interface Category {
  name: string;
  /** All three member words including the pivot, normalized to upper case. */
  members: string[];
  /** The two non-pivot words. */
  spokes: string[];
}

export interface Puzzle {
  id: string;
  title: string;
  pivot: string;
  words: string[];
  categories: Category[];
}

// A deterministic shuffle so a given puzzle id + seed always lays out the same.
function seededShuffle<T>(input: T[], seed: number): T[] {
  const arr = [...input];
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function buildPuzzle(raw: RawPuzzle, seed = 1): Puzzle {
  const pivot = raw.pivot.toUpperCase();
  const categories: Category[] = raw.categories.map((c) => {
    const spokes = c.words.map((w) => w.toUpperCase());
    return { name: c.name, spokes, members: [pivot, ...spokes] };
  });
  const allWords = [pivot, ...categories.flatMap((c) => c.spokes)];
  return {
    id: raw.id,
    title: raw.title,
    pivot,
    words: seededShuffle(allWords, seed + raw.id.length * 7),
    categories,
  };
}
