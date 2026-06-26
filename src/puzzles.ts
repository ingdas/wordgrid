// Each puzzle has 13 words. There are 4 categories to find.
// Every category contains the SAME hidden "pivot" (link) word plus three unique
// spoke words, so: 1 pivot + (4 x 3) = 13 words total. The board shows the 12
// spokes; the pivot stays hidden until the end.
//
// The pivot is listed in `pivot` and is added to each category's `members` at
// load time, so the data below stays readable.

export interface RawCategory {
  /** Human-readable theme revealed once solved. */
  name: string;
  /** The three spoke words unique to this category (the pivot is added automatically). */
  words: [string, string, string];
}

export interface RawPuzzle {
  id: string;
  title: string;
  /** The word shared by all four categories — kept hidden during play. */
  pivot: string;
  categories: [RawCategory, RawCategory, RawCategory, RawCategory];
  /** Optional synonyms also accepted as the link, when the categories allow it. */
  accept?: string[];
  /** Optional emoji shown instead of each spoke word (for the emoji boss). */
  emoji?: Record<string, string>;
}

export const PUZZLES: RawPuzzle[] = [
  {
    id: "star",
    title: "Star Power",
    pivot: "STAR",
    categories: [
      { name: "Words for a celebrity", words: ["ICON", "LEGEND", "IDOL"] },
      { name: "Seen in the night sky", words: ["MOON", "COMET", "PLANET"] },
      { name: "___ + FISH", words: ["JELLY", "CAT", "SWORD"] },
      { name: "Symbols & shapes", words: ["HEART", "ARROW", "CROSS"] },
    ],
  },
  {
    id: "rock",
    title: "Rock Solid",
    pivot: "ROCK",
    categories: [
      { name: "Music genres", words: ["JAZZ", "BLUES", "FOLK"] },
      { name: "To move back and forth", words: ["SWAY", "SWING", "WOBBLE"] },
      { name: "Bits of stone", words: ["PEBBLE", "BOULDER", "STONE"] },
      { name: "Hand-game throws", words: ["PAPER", "SCISSORS", "LIZARD"] },
    ],
  },
  {
    id: "spring",
    title: "Spring Loaded",
    pivot: "SPRING",
    categories: [
      { name: "Seasons", words: ["SUMMER", "WINTER", "AUTUMN"] },
      { name: "To leap suddenly", words: ["LEAP", "POUNCE", "BOUND"] },
      { name: "Sources of water", words: ["WELL", "GEYSER", "FOUNTAIN"] },
      { name: "Mechanical parts", words: ["GEAR", "COIL", "LEVER"] },
    ],
  },
  {
    id: "light",
    title: "Light Work",
    pivot: "LIGHT",
    categories: [
      { name: "Gives off light", words: ["LAMP", "TORCH", "CANDLE"] },
      { name: "Not heavy", words: ["AIRY", "SLIGHT", "FLUFFY"] },
      { name: "___ + HOUSE", words: ["GREEN", "WARE", "POWER"] },
      { name: "To set ablaze", words: ["IGNITE", "KINDLE", "SPARK"] },
    ],
  },
  {
    id: "bolt",
    title: "Bolt Upright",
    pivot: "BOLT",
    categories: [
      { name: "Hardware bits", words: ["SCREW", "NUT", "WASHER"] },
      { name: "To flee fast", words: ["DASH", "FLEE", "SCRAM"] },
      { name: "Lightning-related", words: ["FLASH", "THUNDER", "STORM"] },
      { name: "Secure a door", words: ["LATCH", "LOCK", "BAR"] },
    ],
  },
  {
    id: "fire",
    title: "On Fire",
    pivot: "FIRE",
    categories: [
      { name: "Dismiss from a job", words: ["SACK", "CAN", "AXE"] },
      { name: "Discharge a weapon", words: ["SHOOT", "BLAST", "LAUNCH"] },
      { name: "Burning hot things", words: ["FLAME", "EMBER", "BLAZE"] },
      { name: "Burning enthusiasm", words: ["PASSION", "ZEAL", "DRIVE"] },
    ],
  },
  {
    id: "pitch",
    title: "Sales Pitch",
    pivot: "PITCH",
    categories: [
      { name: "Throw in baseball", words: ["THROW", "HURL", "TOSS"] },
      { name: "A sales spiel", words: ["SPIEL", "PROPOSAL", "PLUG"] },
      { name: "Musical highness", words: ["TONE", "KEY", "NOTE"] },
      { name: "Sports playing area", words: ["FIELD", "COURT", "GROUND"] },
    ],
  },
  {
    id: "trunk",
    title: "Packed Trunk",
    pivot: "TRUNK",
    categories: [
      { name: "Parts of a tree", words: ["BARK", "ROOT", "BRANCH"] },
      { name: "Car body parts", words: ["HOOD", "FENDER", "BUMPER"] },
      { name: "On an elephant", words: ["TUSK", "TAIL", "EARS"] },
      { name: "Storage boxes", words: ["CHEST", "CRATE", "LOCKER"] },
    ],
  },
  {
    id: "palm",
    title: "Palm Reading",
    pivot: "PALM",
    categories: [
      { name: "Parts of the hand", words: ["WRIST", "KNUCKLE", "THUMB"] },
      { name: "Kinds of tree", words: ["MAPLE", "BIRCH", "OAK"] },
      { name: "To conceal in hand", words: ["HIDE", "STASH", "POCKET"] },
      { name: "Palm ___", words: ["SPRINGS", "BEACH", "SUNDAY"] },
    ],
  },
  {
    id: "scale",
    title: "Tipping the Scale",
    pivot: "SCALE",
    categories: [
      { name: "Music elements", words: ["OCTAVE", "CHORD", "KEY"] },
      { name: "Fish features", words: ["FIN", "GILL", "TAIL"] },
      { name: "To climb up", words: ["CLIMB", "ASCEND", "MOUNT"] },
      { name: "Weighing instruments", words: ["BALANCE", "METER", "GAUGE"] },
    ],
  },
  {
    id: "bark",
    title: "Worse Than Bite",
    pivot: "BARK",
    categories: [
      { name: "Dog sounds", words: ["WOOF", "GROWL", "YAP"] },
      { name: "Found on a tree", words: ["SAP", "RING", "KNOT"] },
      { name: "To shout harshly", words: ["SHOUT", "SNAP", "SNARL"] },
      { name: "Kinds of boat", words: ["YACHT", "CANOE", "FERRY"] },
    ],
  },
  {
    id: "nail",
    title: "Nailed It",
    pivot: "NAIL",
    categories: [
      { name: "Carpentry hardware", words: ["SCREW", "TACK", "STAPLE"] },
      { name: "Parts of a finger", words: ["CUTICLE", "KNUCKLE", "TIP"] },
      { name: "To do perfectly", words: ["ACE", "CRUSH", "MASTER"] },
      { name: "To arrest", words: ["NAB", "BUST", "COLLAR"] },
    ],
  },
  {
    id: "ring",
    title: "Ring of Truth",
    pivot: "RING",
    categories: [
      { name: "Fighting venues", words: ["ARENA", "OCTAGON", "PIT"] },
      { name: "Worn as jewelry", words: ["NECKLACE", "BRACELET", "ANKLET"] },
      { name: "To telephone", words: ["CALL", "DIAL", "BUZZ"] },
      { name: "Circular shapes", words: ["HOOP", "LOOP", "HALO"] },
    ],
  },
  {
    id: "mint",
    title: "Mint Condition",
    pivot: "MINT",
    categories: [
      { name: "Cooking herbs", words: ["BASIL", "THYME", "SAGE"] },
      { name: "To make money", words: ["COIN", "STAMP", "PRINT"] },
      { name: "Sweet treats", words: ["TOFFEE", "FUDGE", "CARAMEL"] },
      { name: "Brand-new", words: ["PRISTINE", "FRESH", "NEW"] },
    ],
  },
  {
    id: "bank",
    title: "Bank On It",
    pivot: "BANK",
    categories: [
      { name: "Found in a bank", words: ["VAULT", "ATM", "TELLER"] },
      { name: "Edge of a river", words: ["SHORE", "LEVEE", "EDGE"] },
      { name: "To rely on", words: ["COUNT", "DEPEND", "RELY"] },
      { name: "To tilt while turning", words: ["TILT", "ROLL", "LEAN"] },
    ],
  },
  {
    id: "check",
    title: "Check, Please",
    pivot: "CHECK",
    categories: [
      { name: "Chess terms", words: ["MATE", "CASTLE", "ROOK"] },
      { name: "To verify", words: ["VERIFY", "INSPECT", "CONFIRM"] },
      { name: "Restaurant payment", words: ["BILL", "TAB", "TOTAL"] },
      { name: "Fabric patterns", words: ["PLAID", "STRIPE", "FLORAL"] },
    ],
  },
  {
    id: "sheet",
    title: "Clean Sheet",
    pivot: "SHEET",
    categories: [
      { name: "Bedding", words: ["PILLOW", "DUVET", "QUILT"] },
      { name: "Paper items", words: ["PAGE", "LEAF", "REAM"] },
      { name: "Music notation", words: ["NOTE", "STAFF", "CLEF"] },
      { name: "A ___ of ice", words: ["SLAB", "LAYER", "PANE"] },
    ],
  },
  {
    id: "bug",
    title: "Bug Hunt",
    pivot: "BUG",
    categories: [
      { name: "Creepy-crawlies", words: ["BEETLE", "ANT", "FLEA"] },
      { name: "To pester", words: ["PESTER", "ANNOY", "NAG"] },
      { name: "Software faults", words: ["GLITCH", "ERROR", "CRASH"] },
      { name: "Spy gear", words: ["WIRE", "TAP", "MIC"] },
    ],
  },
  {
    id: "jam",
    title: "In a Jam",
    pivot: "JAM",
    categories: [
      { name: "Spread on toast", words: ["JELLY", "BUTTER", "MARMALADE"] },
      { name: "A music get-together", words: ["GIG", "SET", "SHOW"] },
      { name: "To block up", words: ["CLOG", "WEDGE", "STUFF"] },
      { name: "A tough spot", words: ["PICKLE", "BIND", "FIX"] },
    ],
  },
  {
    id: "table",
    title: "Turn the Table",
    pivot: "TABLE",
    categories: [
      { name: "Household furniture", words: ["CHAIR", "DESK", "STOOL"] },
      { name: "Ways to show data", words: ["CHART", "GRAPH", "GRID"] },
      { name: "To postpone", words: ["SHELVE", "DEFER", "DELAY"] },
      { name: "Billiards gear", words: ["CUE", "RACK", "CHALK"] },
    ],
  },
  {
    id: "drop",
    title: "Drop It",
    pivot: "DROP",
    categories: [
      { name: "Bit of liquid", words: ["DROPLET", "BEAD", "DRIP"] },
      { name: "To fall sharply", words: ["PLUNGE", "SINK", "DIVE"] },
      { name: "To abandon", words: ["QUIT", "DITCH", "SCRAP"] },
      { name: "Hard candy", words: ["TOFFEE", "LOLLIPOP", "GUMDROP"] },
    ],
  },
  {
    id: "pound",
    title: "Pound for Pound",
    pivot: "POUND",
    categories: [
      { name: "Units of weight", words: ["OUNCE", "GRAM", "TON"] },
      { name: "World currencies", words: ["EURO", "YEN", "PESO"] },
      { name: "To hit hard", words: ["HAMMER", "BEAT", "BASH"] },
      { name: "Home for strays", words: ["SHELTER", "KENNEL", "REFUGE"] },
    ],
  },
  {
    id: "spell",
    title: "Under a Spell",
    pivot: "SPELL",
    categories: [
      { name: "Witchcraft", words: ["CHARM", "HEX", "CURSE"] },
      { name: "A period of time", words: ["STINT", "STRETCH", "SPAN"] },
      { name: "Heard at a spelling bee", words: ["LETTER", "VOWEL", "WORD"] },
      { name: "To relieve someone", words: ["RELIEVE", "REPLACE", "COVER"] },
    ],
  },
  {
    id: "stick",
    title: "Stick With It",
    pivot: "STICK",
    categories: [
      { name: "To adhere", words: ["CLING", "ADHERE", "BOND"] },
      { name: "Bits of wood", words: ["TWIG", "BRANCH", "LOG"] },
      { name: "Swung in sport", words: ["BAT", "CLUB", "RACKET"] },
      { name: "To poke", words: ["JAB", "POKE", "PROD"] },
    ],
  },
  {
    id: "cap",
    title: "Cap It Off",
    pivot: "CAP",
    categories: [
      { name: "Headwear", words: ["HAT", "BERET", "BEANIE"] },
      { name: "Bottle closures", words: ["LID", "CORK", "STOPPER"] },
      { name: "An upper limit", words: ["LIMIT", "CEILING", "MAX"] },
      { name: "Parts of a mushroom", words: ["STEM", "GILL", "SPORE"] },
    ],
  },
  {
    id: "roll",
    title: "On a Roll",
    pivot: "ROLL",
    categories: [
      { name: "From the bakery", words: ["BAGEL", "BUN", "LOAF"] },
      { name: "To rotate", words: ["SPIN", "TUMBLE", "REVOLVE"] },
      { name: "A winning streak", words: ["STREAK", "RUN", "SPREE"] },
      { name: "An attendance list", words: ["REGISTER", "ROSTER", "LIST"] },
    ],
  },
  {
    id: "wave",
    title: "Make Waves",
    pivot: "WAVE",
    categories: [
      { name: "At the seaside", words: ["TIDE", "SURF", "SWELL"] },
      { name: "Gestures", words: ["SALUTE", "NOD", "BECKON"] },
      { name: "A ___ of heat", words: ["SURGE", "SPELL", "BLAST"] },
      { name: "Hair textures", words: ["CURL", "FRIZZ", "KINK"] },
    ],
  },
  {
    id: "block",
    title: "Building Block",
    pivot: "BLOCK",
    categories: [
      { name: "To obstruct", words: ["HINDER", "STOP", "BAR"] },
      { name: "Parts of a city", words: ["STREET", "AVENUE", "LANE"] },
      { name: "Children's toys", words: ["LEGO", "DOLL", "BRICK"] },
      { name: "Solid chunks", words: ["SLAB", "CUBE", "LUMP"] },
    ],
  },
  {
    id: "press",
    title: "Press On",
    pivot: "PRESS",
    categories: [
      { name: "The news media", words: ["MEDIA", "NEWS", "PAPERS"] },
      { name: "To push", words: ["PUSH", "SHOVE", "THRUST"] },
      { name: "To flatten with heat", words: ["IRON", "FLATTEN", "STEAM"] },
      { name: "Weightlifting moves", words: ["CURL", "SQUAT", "LIFT"] },
    ],
  },
  {
    id: "plot",
    title: "Lose the Plot",
    pivot: "PLOT",
    categories: [
      { name: "Story elements", words: ["THEME", "CHARACTER", "TWIST"] },
      { name: "Pieces of land", words: ["LOT", "PARCEL", "TRACT"] },
      { name: "To scheme", words: ["SCHEME", "CONSPIRE", "PLAN"] },
      { name: "To chart points", words: ["GRAPH", "MAP", "CHART"] },
    ],
  },
  {
    id: "crash",
    title: "Crash Course",
    pivot: "CRASH",
    categories: [
      { name: "Collisions", words: ["WRECK", "SMASH", "PILEUP"] },
      { name: "Computer failures", words: ["FREEZE", "HANG", "GLITCH"] },
      { name: "To barge in", words: ["INTRUDE", "BARGE", "GATECRASH"] },
      { name: "A market drop", words: ["SLUMP", "PLUNGE", "DIVE"] },
    ],
  },
  {
    id: "court",
    title: "Hold Court",
    pivot: "COURT",
    categories: [
      { name: "Places you play", words: ["RINK", "PITCH", "FIELD"] },
      { name: "Royal trappings", words: ["THRONE", "CROWN", "SCEPTER"] },
      { name: "To woo", words: ["WOO", "PURSUE", "ROMANCE"] },
      { name: "Found in a courtroom", words: ["JUDGE", "JURY", "BENCH"] },
    ],
  },
  {
    id: "chip",
    title: "Chip In",
    pivot: "CHIP",
    categories: [
      { name: "Crunchy snacks", words: ["CRISP", "PRETZEL", "CRACKER"] },
      { name: "Casino tokens", words: ["TOKEN", "COUNTER", "MARKER"] },
      { name: "Computer guts", words: ["PROCESSOR", "CIRCUIT", "TRANSISTOR"] },
      { name: "Small damage", words: ["CRACK", "NICK", "DENT"] },
    ],
  },
  {
    id: "seal",
    title: "Sealed Tight",
    pivot: "SEAL",
    categories: [
      { name: "Marine animals", words: ["WALRUS", "NARWHAL", "ORCA"] },
      { name: "To close up", words: ["SHUT", "CLOSE", "FASTEN"] },
      { name: "Official marks", words: ["STAMP", "CREST", "EMBLEM"] },
      { name: "Elite soldiers", words: ["RANGER", "MARINE", "COMMANDO"] },
    ],
  },
  {
    id: "bat",
    title: "Off the Bat",
    pivot: "BAT",
    categories: [
      { name: "Creatures of the night", words: ["OWL", "MOTH", "RACCOON"] },
      { name: "Swung at a ball", words: ["RACKET", "CLUB", "PADDLE"] },
      { name: "To flutter", words: ["FLUTTER", "BLINK", "WINK"] },
      { name: "Cricket terms", words: ["WICKET", "BOWLER", "CREASE"] },
    ],
  },
  {
    id: "deck",
    title: "Deck the Halls",
    pivot: "DECK",
    categories: [
      { name: "Parts of a ship", words: ["HULL", "MAST", "BOW"] },
      { name: "In a card game", words: ["SUIT", "ACE", "JOKER"] },
      { name: "To punch out", words: ["SLUG", "FLOOR", "CLOCK"] },
      { name: "Outdoor spaces", words: ["PATIO", "PORCH", "VERANDA"] },
    ],
  },
  {
    id: "note",
    title: "Take Note",
    pivot: "NOTE",
    categories: [
      { name: "Music symbols", words: ["REST", "CLEF", "SHARP"] },
      { name: "Quick messages", words: ["MEMO", "LETTER", "REMINDER"] },
      { name: "Paper money", words: ["BILL", "CASH", "DOLLAR"] },
      { name: "To observe", words: ["NOTICE", "OBSERVE", "REMARK"] },
    ],
  },
  {
    id: "park",
    title: "Walk in the Park",
    pivot: "PARK",
    categories: [
      { name: "Green spaces", words: ["GARDEN", "MEADOW", "COMMON"] },
      { name: "To stop a car", words: ["STOP", "HALT", "IDLE"] },
      { name: "Amusement ___", words: ["FAIR", "CARNIVAL", "ARCADE"] },
      { name: "Baseball venues", words: ["FIELD", "STADIUM", "DIAMOND"] },
    ],
  },
  {
    id: "switch",
    title: "Bait and Switch",
    pivot: "SWITCH",
    categories: [
      { name: "To swap", words: ["SWAP", "TRADE", "EXCHANGE"] },
      { name: "Electrical controls", words: ["DIMMER", "OUTLET", "SOCKET"] },
      { name: "Game consoles", words: ["XBOX", "WII", "ATARI"] },
      { name: "To whip", words: ["LASH", "CANE", "FLOG"] },
    ],
  },
  {
    id: "string",
    title: "Pull Strings",
    pivot: "STRING",
    categories: [
      { name: "On a guitar", words: ["FRET", "PICK", "NECK"] },
      { name: "To deceive", words: ["FOOL", "TRICK", "DUPE"] },
      { name: "Things you tie", words: ["ROPE", "CORD", "TWINE"] },
      { name: "A series of", words: ["CHAIN", "SEQUENCE", "SUCCESSION"] },
    ],
  },
  {
    id: "stamp",
    title: "Stamp of Approval",
    pivot: "STAMP",
    categories: [
      { name: "On an envelope", words: ["SENDER", "ADDRESS", "POSTMARK"] },
      { name: "To press with a foot", words: ["STOMP", "TRAMPLE", "TREAD"] },
      { name: "Collector's hobbies", words: ["COIN", "CARD", "COMIC"] },
      { name: "To wipe out", words: ["ERASE", "CRUSH", "DESTROY"] },
    ],
  },
  {
    id: "grade",
    title: "Make the Grade",
    pivot: "GRADE",
    categories: [
      { name: "School marks", words: ["MARK", "SCORE", "RESULT"] },
      { name: "A slope", words: ["SLOPE", "INCLINE", "GRADIENT"] },
      { name: "To rank", words: ["RANK", "RATE", "SORT"] },
      { name: "Quality levels", words: ["TIER", "CLASS", "BRACKET"] },
    ],
  },
  {
    id: "fry",
    title: "Small Fry",
    pivot: "FRY",
    categories: [
      { name: "Cooking methods", words: ["GRILL", "ROAST", "SAUTE"] },
      { name: "Fast-food orders", words: ["NUGGET", "SHAKE", "BURGER"] },
      { name: "A youngster", words: ["KID", "TOT", "TYKE"] },
      { name: "To burn out a circuit", words: ["BLOW", "SHORT", "ZAP"] },
    ],
  },
  {
    id: "club",
    title: "Join the Club",
    pivot: "CLUB",
    categories: [
      { name: "Places to dance", words: ["DISCO", "LOUNGE", "VENUE"] },
      { name: "Card suits", words: ["HEART", "SPADE", "DIAMOND"] },
      { name: "Golf gear", words: ["IRON", "PUTTER", "WEDGE"] },
      { name: "Groups you join", words: ["GUILD", "SOCIETY", "LEAGUE"] },
    ],
  },
  {
    id: "match",
    title: "Perfect Match",
    pivot: "MATCH",
    categories: [
      { name: "To correspond", words: ["PAIR", "FIT", "ALIGN"] },
      { name: "A sporting contest", words: ["BOUT", "GAME", "DUEL"] },
      { name: "Lights a fire", words: ["LIGHTER", "FLINT", "KINDLING"] },
      { name: "A romantic pairing", words: ["DATE", "COUPLE", "ITEM"] },
    ],
  },
  {
    id: "post",
    title: "Last Post",
    pivot: "POST",
    categories: [
      { name: "Mail delivery", words: ["MAIL", "PARCEL", "LETTER"] },
      { name: "Upright supports", words: ["PILLAR", "COLUMN", "POLE"] },
      { name: "To publish online", words: ["TWEET", "SHARE", "UPLOAD"] },
      { name: "A job or role", words: ["ROLE", "JOB", "POSITION"] },
    ],
  },
  {
    id: "tank",
    title: "Tank Up",
    pivot: "TANK",
    categories: [
      { name: "Armored vehicles", words: ["JEEP", "HUMVEE", "CHOPPER"] },
      { name: "Holds liquid", words: ["BARREL", "VAT", "JUG"] },
      { name: "To fail badly", words: ["FLOP", "BOMB", "FLUNK"] },
      { name: "Sleeveless tops", words: ["VEST", "CAMI", "HALTER"] },
    ],
  },
  {
    id: "break",
    title: "Big Break",
    pivot: "BREAK",
    categories: [
      { name: "To shatter", words: ["SNAP", "CRACK", "SHATTER"] },
      { name: "A short rest", words: ["PAUSE", "RECESS", "BREATHER"] },
      { name: "A lucky chance", words: ["CHANCE", "SHOT", "OPENING"] },
      { name: "To tame a horse", words: ["TAME", "TRAIN", "BRIDLE"] },
    ],
  },
  {
    id: "forge",
    title: "Forge Ahead",
    pivot: "FORGE",
    categories: [
      { name: "A blacksmith's kit", words: ["ANVIL", "TONGS", "HAMMER"] },
      { name: "To counterfeit", words: ["FAKE", "COPY", "FALSIFY"] },
      { name: "To push forward", words: ["ADVANCE", "PROGRESS", "PRESS"] },
      { name: "To shape metal", words: ["SHAPE", "MOLD", "FORM"] },
    ],
  },
  {
    id: "glass",
    title: "Raise a Glass",
    pivot: "GLASS",
    categories: [
      { name: "Drinkware", words: ["MUG", "TUMBLER", "GOBLET"] },
      { name: "In a window", words: ["PANE", "FRAME", "SILL"] },
      { name: "Vision aids", words: ["LENS", "SPECS", "MONOCLE"] },
      { name: "Fragile materials", words: ["CRYSTAL", "CERAMIC", "PORCELAIN"] },
    ],
  },
  {
    id: "pen",
    title: "Pen Pal",
    pivot: "PEN",
    categories: [
      { name: "Writing tools", words: ["PENCIL", "MARKER", "CRAYON"] },
      { name: "Animal enclosures", words: ["COOP", "STY", "CORRAL"] },
      { name: "Prison (slang)", words: ["JAIL", "CELL", "SLAMMER"] },
      { name: "To compose", words: ["WRITE", "DRAFT", "AUTHOR"] },
    ],
  },
  {
    id: "fan",
    title: "Number One Fan",
    pivot: "FAN",
    categories: [
      { name: "Cooling devices", words: ["BLOWER", "VENT", "COOLER"] },
      { name: "Devoted followers", words: ["FANATIC", "SUPPORTER", "DEVOTEE"] },
      { name: "To spread out", words: ["SPREAD", "SPLAY", "UNFURL"] },
      { name: "To stir up flames", words: ["STOKE", "KINDLE", "FUEL"] },
    ],
  },
  {
    id: "sole",
    title: "Sole Survivor",
    pivot: "SOLE",
    categories: [
      { name: "Parts of a shoe", words: ["LACE", "TONGUE", "EYELET"] },
      { name: "Fish on the menu", words: ["COD", "HALIBUT", "FLOUNDER"] },
      { name: "The only one", words: ["ONLY", "LONE", "SINGLE"] },
      { name: "Parts of the foot", words: ["ARCH", "HEEL", "INSTEP"] },
    ],
  },
  {
    id: "mold",
    title: "Break the Mold",
    pivot: "MOLD",
    categories: [
      { name: "Damp growth", words: ["MILDEW", "FUNGUS", "SPORE"] },
      { name: "To shape", words: ["FORM", "CAST", "SCULPT"] },
      { name: "A casting frame", words: ["DIE", "STENCIL", "TEMPLATE"] },
      { name: "To influence", words: ["GUIDE", "SWAY", "STEER"] },
    ],
  },
  {
    id: "pipe",
    title: "Pipe Down",
    pivot: "PIPE",
    categories: [
      { name: "Plumbing parts", words: ["VALVE", "DRAIN", "SPOUT"] },
      { name: "Wind instruments", words: ["FLUTE", "OBOE", "CLARINET"] },
      { name: "To channel along", words: ["FUNNEL", "ROUTE", "DIRECT"] },
      { name: "For smoking", words: ["CIGAR", "VAPE", "HOOKAH"] },
    ],
  },
  {
    id: "date",
    title: "Save the Date",
    pivot: "DATE",
    categories: [
      { name: "Calendar units", words: ["DAY", "MONTH", "YEAR"] },
      { name: "Dried fruits", words: ["FIG", "RAISIN", "PRUNE"] },
      { name: "A romantic outing", words: ["FLING", "ROMANCE", "AFFAIR"] },
      { name: "To mark with a date", words: ["MARK", "STAMP", "LABEL"] },
    ],
  },
  {
    id: "cell",
    title: "Cell Block",
    pivot: "CELL",
    categories: [
      { name: "Body building blocks", words: ["NEURON", "TISSUE", "MEMBRANE"] },
      { name: "Prison rooms", words: ["CAGE", "DUNGEON", "LOCKUP"] },
      { name: "Phone-related", words: ["MOBILE", "PHONE", "HANDSET"] },
      { name: "Power sources", words: ["BATTERY", "SOLAR", "DYNAMO"] },
    ],
  },
  {
    id: "well",
    title: "Wishing Well",
    pivot: "WELL",
    categories: [
      { name: "Water sources", words: ["SPRING", "OASIS", "STREAM"] },
      { name: "In good health", words: ["HEALTHY", "FIT", "ROBUST"] },
      { name: "Oilfield gear", words: ["RIG", "DRILL", "PUMP"] },
      { name: "A deep shaft", words: ["SHAFT", "PIT", "MINE"] },
    ],
  },
  {
    id: "shower",
    title: "Cold Shower",
    pivot: "SHOWER",
    categories: [
      { name: "Bathroom fixtures", words: ["TUB", "BASIN", "FAUCET"] },
      { name: "Light rain", words: ["DRIZZLE", "SPRINKLE", "MIST"] },
      { name: "Celebration parties", words: ["GALA", "BASH", "FIESTA"] },
      { name: "To lavish", words: ["LAVISH", "HEAP", "SPLURGE"] },
    ],
  },
  {
    id: "track",
    title: "Off Track",
    pivot: "TRACK",
    categories: [
      { name: "Railway parts", words: ["RAIL", "SIGNAL", "TIE"] },
      { name: "Songs on an album", words: ["SONG", "TUNE", "CUT"] },
      { name: "To follow", words: ["TRACE", "TRAIL", "FOLLOW"] },
      { name: "Racing venues", words: ["CIRCUIT", "SPEEDWAY", "RACEWAY"] },
    ],
  },
  {
    id: "figure",
    title: "Go Figure",
    pivot: "FIGURE",
    categories: [
      { name: "Numbers", words: ["DIGIT", "NUMERAL", "INTEGER"] },
      { name: "Body shape", words: ["BUILD", "FRAME", "PHYSIQUE"] },
      { name: "To work out", words: ["SOLVE", "RECKON", "DEDUCE"] },
      { name: "Sculpted forms", words: ["STATUE", "FIGURINE", "BUST"] },
    ],
  },
  {
    id: "brush",
    title: "Brush Off",
    pivot: "BRUSH",
    categories: [
      { name: "Painting tools", words: ["ROLLER", "PALETTE", "EASEL"] },
      { name: "Grooming items", words: ["COMB", "RAZOR", "CLIPPERS"] },
      { name: "Dense shrubs", words: ["THICKET", "SCRUB", "BRAMBLE"] },
      { name: "To graze lightly", words: ["GRAZE", "SKIM", "GLANCE"] },
    ],
  },
];

// ---------------------------------------------------------------------------
// Dedicated emoji boss. Every spoke is shown as an emoji only — no letters —
// so you have to read the pictures, group them, then guess the link (BOLT).
// The lightning emoji is deliberately avoided so the link isn't spoiled.

export const EMOJI_BOSS: RawPuzzle = {
  id: "emoji-bolt",
  title: "Bolt from the Blue",
  pivot: "BOLT",
  categories: [
    { name: "Quick on their feet", words: ["SPRINTER", "CHEETAH", "HORSE"] },
    { name: "In the toolbox", words: ["WRENCH", "GEAR", "SCREW"] },
    { name: "Stormy weather", words: ["RAIN", "CLOUD", "WIND"] },
    { name: "Lock it up", words: ["LOCK", "KEY", "DOOR"] },
  ],
  accept: ["LIGHTNING"],
  emoji: {
    SPRINTER: "🏃", CHEETAH: "🐆", HORSE: "🐎",
    WRENCH: "🔧", GEAR: "⚙️", SCREW: "🔩",
    RAIN: "🌧️", CLOUD: "☁️", WIND: "🌬️",
    LOCK: "🔒", KEY: "🔑", DOOR: "🚪",
  },
};

// ---------------------------------------------------------------------------

export interface Category {
  name: string;
  /** All four member words including the pivot, normalized to upper case. */
  members: string[];
  /** The three non-pivot spoke words. */
  spokes: string[];
}

export interface Puzzle {
  id: string;
  title: string;
  pivot: string;
  words: string[];
  categories: Category[];
  /** Synonyms also accepted as the typed link answer. */
  accept: string[];
  /** Emoji shown instead of each spoke word (emoji boss only). */
  emoji: Record<string, string>;
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
    accept: (raw.accept ?? []).map((w) => w.toUpperCase()),
    emoji: Object.fromEntries(
      Object.entries(raw.emoji ?? {}).map(([k, v]) => [k.toUpperCase(), v]),
    ),
  };
}

// ---------------------------------------------------------------------------
// Difficulty curve. We can't measure "abstractness" cheaply, so we proxy it
// with word length + count of long/rare spokes — longer, less-common words make
// a level harder. Levels are ordered easiest-first (with the STAR tutorial
// pinned to #1) and bucketed into three tiers for the level map.

export type Tier = 1 | 2 | 3;
export interface Level extends RawPuzzle {
  tier: Tier;
}

// Short words can still be brutally obscure (KETCH, OBOE, ARDOR…), which the
// length heuristic misses — so a curated set adds weight and keeps them out of
// the early "Easy" levels where a fresh player would feel ambushed.
const OBSCURE = new Set([
  "NARWHAL", "ANVIL", "GOBLET", "MONOCLE", "PORCELAIN", "VERANDA", "HALIBUT",
  "OBOE", "CLARINET", "HOOKAH", "GRADIENT", "SCEPTER", "HUMVEE", "CUTICLE",
  "INSTEP", "EYELET", "STENCIL", "POSTMARK", "DEVOTEE", "FANATIC",
]);

function difficultyScore(raw: RawPuzzle): number {
  const spokes = raw.categories.flatMap((c) => c.words);
  const avgLen = spokes.reduce((s, w) => s + w.length, 0) / spokes.length;
  const longCount = spokes.filter((w) => w.length >= 8).length;
  const obscureCount = spokes.filter((w) => OBSCURE.has(w)).length;
  return avgLen + longCount * 0.6 + obscureCount * 1.6;
}

const orderedRaw = PUZZLES.slice().sort((a, b) => {
  if (a.id === "star") return -1; // pin the tutorial level first
  if (b.id === "star") return 1;
  return difficultyScore(a) - difficultyScore(b);
});

export const LEVELS: Level[] = orderedRaw.map((raw, i) => ({
  ...raw,
  tier: (i < orderedRaw.length / 3 ? 1 : i < (2 * orderedRaw.length) / 3 ? 2 : 3) as Tier,
}));

export const TIER_LABELS: Record<Tier, string> = { 1: "Easy", 2: "Medium", 3: "Hard" };

// ---------------------------------------------------------------------------
// Chapters: a light story-flavoured grouping of the difficulty-ordered levels.
// The last level of each chapter is a "boss".

export interface Chapter {
  name: string;
  flavor: string;
  start: number; // inclusive index into LEVELS
  end: number; // exclusive
  boss: number; // index of the chapter's final (boss) level
}

const CHAPTER_META = [
  { name: "First Light", flavor: "Find your footing." },
  { name: "Warming Up", flavor: "The links get sneakier." },
  { name: "Crossed Wires", flavor: "Words with double lives." },
  { name: "Double Meanings", flavor: "One word, many masks." },
  { name: "Twists & Turns", flavor: "Expect the unexpected." },
  { name: "Deep Cuts", flavor: "For the seasoned solver." },
  { name: "Mind Benders", flavor: "Only the sharp survive." },
  { name: "The Gauntlet", flavor: "Everything you've learned." },
];

// Front-loaded chapter sizes: the first chapter is short so a player meets a
// boss (the most distinctive content) by ~level 6 instead of level 8, and the
// early map feels less like a wall. The last chapter swallows any remainder.
const CHAPTER_SIZES = [6, 7, 7, 8, 8, 8, 8, 10];

export const CHAPTERS: Chapter[] = (() => {
  const out: Chapter[] = [];
  let start = 0;
  for (let i = 0; i < CHAPTER_META.length && start < LEVELS.length; i++) {
    const last = i === CHAPTER_META.length - 1;
    const end = last ? LEVELS.length : Math.min(start + (CHAPTER_SIZES[i] ?? 8), LEVELS.length);
    out.push({ ...CHAPTER_META[i], start, end, boss: end - 1 });
    start = end;
  }
  return out;
})();

const BOSS_SET = new Set(CHAPTERS.map((c) => c.boss));

/** Is this level (index into LEVELS) the boss of its chapter? */
export function isBossLevel(index: number): boolean {
  return BOSS_SET.has(index);
}

// ---------------------------------------------------------------------------
// Boss variety. Every chapter's boss plays differently — and these are real
// changes to how the game plays, not just cosmetics. Twists are assigned in a
// fixed order so no two adjacent chapters share one.
//
//  - emoji:    a bespoke picture-only board (the EMOJI_BOSS content) — you read
//              pictures instead of words.
//  - scramble: every tile is an anagram you must decode before grouping.
//  - oracle:   the puzzle is turned inside out. You're shown all twelve words
//              AND the four theme names up front, and must deduce + type the
//              hidden link FIRST; only then do you group. No timer, free
//              retries — pure lateral thinking.
//  - decoy:    three impostor tiles belong to NO group. Include one in a guess
//              and the group busts; you have to spot the fakes.
//  - blackout: solved group names and words stay hidden until the reveal, so
//              you can't lean on what you've already found.

export type BossTwist = "scramble" | "emoji" | "oracle" | "decoy" | "blackout";

const CHAPTER_TWISTS: BossTwist[] = [
  "scramble",
  "oracle",
  "emoji",
  "blackout",
  "decoy",
  "scramble",
  "oracle",
  "decoy",
];

/** The twist for a given level index, or null if it isn't a boss. */
export function bossTwist(index: number): BossTwist | null {
  const chapter = CHAPTERS.findIndex((c) => c.boss === index);
  if (chapter === -1) return null;
  return CHAPTER_TWISTS[chapter % CHAPTER_TWISTS.length];
}

// The "decoy" boss salts the board with impostor words that fit no group. We
// pull from a fixed pool, skipping anything that clashes with the real puzzle,
// and pick deterministically from the puzzle id so a level is always the same.
const DECOY_POOL = [
  "OCEAN", "TIGER", "PIANO", "CASTLE", "ROCKET", "GARDEN", "PEPPER", "VELVET",
  "MARBLE", "FALCON", "CANYON", "LANTERN", "BISCUIT", "HARBOR", "MEADOW",
  "PRISM", "WALNUT", "ANCHOR", "COMPASS", "ORCHID",
];

export function decoyTiles(puzzle: Puzzle, count = 3): string[] {
  const taken = new Set([puzzle.pivot, ...puzzle.words, ...puzzle.accept]);
  const pool = DECOY_POOL.filter((w) => !taken.has(w));
  let seed = 0;
  for (const c of puzzle.id) seed = (seed * 31 + c.charCodeAt(0)) >>> 0;
  const picks: string[] = [];
  while (picks.length < count && pool.length) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const [w] = pool.splice(seed % pool.length, 1);
    picks.push(w);
  }
  return picks;
}
