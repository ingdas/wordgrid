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
  {
    id: "pitch",
    title: "Sales Pitch",
    pivot: "PITCH",
    categories: [
      { name: "Throw in baseball", words: ["THROW", "HURL"] },
      { name: "A sales spiel", words: ["SPIEL", "PROPOSAL"] },
      { name: "Musical highness", words: ["TONE", "KEY"] },
      { name: "Sports playing field", words: ["FIELD", "COURT"] },
    ],
  },
  {
    id: "trunk",
    title: "Packed Trunk",
    pivot: "TRUNK",
    categories: [
      { name: "Parts of a tree", words: ["BARK", "ROOT"] },
      { name: "Car body parts", words: ["HOOD", "FENDER"] },
      { name: "On an elephant", words: ["TUSK", "TAIL"] },
      { name: "Storage boxes", words: ["CHEST", "CRATE"] },
    ],
  },
  {
    id: "palm",
    title: "Palm Reading",
    pivot: "PALM",
    categories: [
      { name: "Parts of the hand", words: ["WRIST", "KNUCKLE"] },
      { name: "Kinds of tree", words: ["MAPLE", "BIRCH"] },
      { name: "To conceal in hand", words: ["HIDE", "STASH"] },
      { name: "Palm ___ (resort towns)", words: ["SPRINGS", "BEACH"] },
    ],
  },
  {
    id: "scale",
    title: "Tipping the Scale",
    pivot: "SCALE",
    categories: [
      { name: "Music elements", words: ["OCTAVE", "CHORD"] },
      { name: "Fish features", words: ["FIN", "GILL"] },
      { name: "To climb up", words: ["CLIMB", "ASCEND"] },
      { name: "Weighing instruments", words: ["BALANCE", "METER"] },
    ],
  },
  {
    id: "bark",
    title: "Worse Than Bite",
    pivot: "BARK",
    categories: [
      { name: "Dog sounds", words: ["WOOF", "GROWL"] },
      { name: "Found on a tree", words: ["SAP", "RING"] },
      { name: "To shout harshly", words: ["SHOUT", "SNAP"] },
      { name: "Sailing vessels", words: ["SLOOP", "KETCH"] },
    ],
  },
  {
    id: "nail",
    title: "Nailed It",
    pivot: "NAIL",
    categories: [
      { name: "Carpentry hardware", words: ["SCREW", "TACK"] },
      { name: "Parts of a finger", words: ["CUTICLE", "KNUCKLE"] },
      { name: "To do perfectly", words: ["ACE", "CRUSH"] },
      { name: "To arrest", words: ["NAB", "BUST"] },
    ],
  },
  {
    id: "ring",
    title: "Ring of Truth",
    pivot: "RING",
    categories: [
      { name: "Fighting venues", words: ["ARENA", "OCTAGON"] },
      { name: "Worn as jewelry", words: ["NECKLACE", "BRACELET"] },
      { name: "To telephone", words: ["CALL", "DIAL"] },
      { name: "Circular shapes", words: ["HOOP", "LOOP"] },
    ],
  },
  {
    id: "mint",
    title: "Mint Condition",
    pivot: "MINT",
    categories: [
      { name: "Cooking herbs", words: ["BASIL", "THYME"] },
      { name: "To make money", words: ["COIN", "STAMP"] },
      { name: "Sweet treats", words: ["TOFFEE", "FUDGE"] },
      { name: "Brand-new", words: ["PRISTINE", "FRESH"] },
    ],
  },
  {
    id: "bank",
    title: "Bank On It",
    pivot: "BANK",
    categories: [
      { name: "Found in a bank", words: ["VAULT", "ATM"] },
      { name: "Edge of a river", words: ["SHORE", "LEVEE"] },
      { name: "To rely on", words: ["COUNT", "DEPEND"] },
      { name: "To tilt while turning", words: ["TILT", "ROLL"] },
    ],
  },
  {
    id: "check",
    title: "Check, Please",
    pivot: "CHECK",
    categories: [
      { name: "Chess terms", words: ["MATE", "CASTLE"] },
      { name: "To verify", words: ["VERIFY", "INSPECT"] },
      { name: "Restaurant payment", words: ["BILL", "TAB"] },
      { name: "Fabric patterns", words: ["PLAID", "STRIPE"] },
    ],
  },
  {
    id: "sheet",
    title: "Clean Sheet",
    pivot: "SHEET",
    categories: [
      { name: "Bedding", words: ["PILLOW", "DUVET"] },
      { name: "Paper items", words: ["PAGE", "LEAF"] },
      { name: "Music notation", words: ["NOTE", "STAFF"] },
      { name: "A ___ of ice", words: ["SLAB", "LAYER"] },
    ],
  },
  {
    id: "bug",
    title: "Bug Hunt",
    pivot: "BUG",
    categories: [
      { name: "Creepy-crawlies", words: ["BEETLE", "ANT"] },
      { name: "To pester", words: ["PESTER", "ANNOY"] },
      { name: "Software faults", words: ["GLITCH", "ERROR"] },
      { name: "Spy gear", words: ["WIRE", "TAP"] },
    ],
  },
  {
    id: "jam",
    title: "In a Jam",
    pivot: "JAM",
    categories: [
      { name: "Spread on toast", words: ["JELLY", "BUTTER"] },
      { name: "A music session", words: ["GIG", "SET"] },
      { name: "To block up", words: ["CLOG", "WEDGE"] },
      { name: "A tough spot", words: ["PICKLE", "BIND"] },
    ],
  },
  {
    id: "table",
    title: "Turn the Table",
    pivot: "TABLE",
    categories: [
      { name: "Household furniture", words: ["CHAIR", "DESK"] },
      { name: "Ways to show data", words: ["CHART", "GRAPH"] },
      { name: "To postpone", words: ["SHELVE", "DEFER"] },
      { name: "Billiards gear", words: ["CUE", "RACK"] },
    ],
  },
  {
    id: "drop",
    title: "Drop It",
    pivot: "DROP",
    categories: [
      { name: "Bit of liquid", words: ["DROPLET", "BEAD"] },
      { name: "To fall sharply", words: ["PLUNGE", "SINK"] },
      { name: "To abandon", words: ["QUIT", "DITCH"] },
      { name: "Hard candy", words: ["TOFFEE", "LOZENGE"] },
    ],
  },
  {
    id: "pound",
    title: "Pound for Pound",
    pivot: "POUND",
    categories: [
      { name: "Units of weight", words: ["OUNCE", "GRAM"] },
      { name: "World currencies", words: ["EURO", "YEN"] },
      { name: "To hit hard", words: ["HAMMER", "BEAT"] },
      { name: "Home for strays", words: ["SHELTER", "KENNEL"] },
    ],
  },
  {
    id: "spell",
    title: "Under a Spell",
    pivot: "SPELL",
    categories: [
      { name: "Witchcraft", words: ["CHARM", "HEX"] },
      { name: "A period of time", words: ["STINT", "STRETCH"] },
      { name: "Heard at a spelling bee", words: ["LETTER", "VOWEL"] },
      { name: "To relieve someone", words: ["RELIEVE", "REPLACE"] },
    ],
  },
  {
    id: "stick",
    title: "Stick With It",
    pivot: "STICK",
    categories: [
      { name: "To adhere", words: ["CLING", "ADHERE"] },
      { name: "Bits of wood", words: ["TWIG", "BRANCH"] },
      { name: "Swung in sport", words: ["BAT", "CLUB"] },
      { name: "To poke", words: ["JAB", "POKE"] },
    ],
  },
  {
    id: "cap",
    title: "Cap It Off",
    pivot: "CAP",
    categories: [
      { name: "Headwear", words: ["HAT", "BERET"] },
      { name: "Bottle closures", words: ["LID", "CORK"] },
      { name: "An upper limit", words: ["LIMIT", "CEILING"] },
      { name: "Parts of a mushroom", words: ["STEM", "GILL"] },
    ],
  },
  {
    id: "roll",
    title: "On a Roll",
    pivot: "ROLL",
    categories: [
      { name: "From the bakery", words: ["BAGEL", "BUN"] },
      { name: "To rotate", words: ["SPIN", "TUMBLE"] },
      { name: "A winning streak", words: ["STREAK", "RUN"] },
      { name: "An attendance list", words: ["REGISTER", "ROSTER"] },
    ],
  },
  {
    id: "wave",
    title: "Make Waves",
    pivot: "WAVE",
    categories: [
      { name: "At the seaside", words: ["TIDE", "SURF"] },
      { name: "Hand gestures", words: ["SALUTE", "NOD"] },
      { name: "A ___ of heat", words: ["SURGE", "SPELL"] },
      { name: "Hair textures", words: ["CURL", "FRIZZ"] },
    ],
  },
  {
    id: "block",
    title: "Building Block",
    pivot: "BLOCK",
    categories: [
      { name: "To obstruct", words: ["HINDER", "STOP"] },
      { name: "Parts of a city", words: ["STREET", "AVENUE"] },
      { name: "Children's toys", words: ["LEGO", "DOLL"] },
      { name: "Solid chunks", words: ["SLAB", "CUBE"] },
    ],
  },
  {
    id: "press",
    title: "Press On",
    pivot: "PRESS",
    categories: [
      { name: "The news media", words: ["MEDIA", "NEWS"] },
      { name: "To push", words: ["PUSH", "SHOVE"] },
      { name: "To flatten with heat", words: ["IRON", "FLATTEN"] },
      { name: "Weightlifting moves", words: ["CURL", "SQUAT"] },
    ],
  },
  {
    id: "plot",
    title: "Lose the Plot",
    pivot: "PLOT",
    categories: [
      { name: "Story elements", words: ["THEME", "CHARACTER"] },
      { name: "Pieces of land", words: ["LOT", "PARCEL"] },
      { name: "To scheme", words: ["SCHEME", "CONSPIRE"] },
      { name: "To chart points", words: ["GRAPH", "MAP"] },
    ],
  },
  {
    id: "crash",
    title: "Crash Course",
    pivot: "CRASH",
    categories: [
      { name: "Collisions", words: ["WRECK", "SMASH"] },
      { name: "Computer failures", words: ["FREEZE", "HANG"] },
      { name: "To barge in", words: ["INTRUDE", "BARGE"] },
      { name: "A market drop", words: ["SLUMP", "PLUNGE"] },
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
