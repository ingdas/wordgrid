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
      { name: "To move back and forth", words: ["SWAY", "TEETER", "WOBBLE"] },
      { name: "Pieces of a mountain", words: ["PEBBLE", "BOULDER", "STONE"] },
      { name: "Hand-game throws", words: ["PAPER", "SCISSORS", "LIZARD"] },
    ],
  },
  {
    id: "spring",
    title: "Spring Loaded",
    pivot: "SPRING",
    categories: [
      { name: "Seasons", words: ["SUMMER", "WINTER", "AUTUMN"] },
      { name: "To jump suddenly", words: ["LEAP", "POUNCE", "BOUND"] },
      { name: "Sources of water", words: ["WELL", "GEYSER", "FOUNTAIN"] },
      { name: "Mechanical parts", words: ["GEAR", "COIL", "LEVER"] },
    ],
  },
  {
    id: "light",
    title: "Light Work",
    pivot: "LIGHT",
    categories: [
      { name: "Things that glow", words: ["LAMP", "LANTERN", "CANDLE"] },
      { name: "Not heavy", words: ["AIRY", "FEATHERY", "FLUFFY"] },
      { name: "___ + HOUSE", words: ["GREEN", "WARE", "POWER"] },
      { name: "To set ablaze", words: ["IGNITE", "KINDLE", "SPARK"] },
    ],
  },
  {
    id: "bolt",
    title: "Bolt Away",
    pivot: "BOLT",
    categories: [
      { name: "Hardware bits", words: ["SCREW", "NUT", "WASHER"] },
      { name: "To run off fast", words: ["DASH", "FLEE", "SCRAM"] },
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
      { name: "To lob a ball", words: ["THROW", "HURL", "TOSS"] },
      { name: "A sales talk", words: ["SPIEL", "PROPOSAL", "PLUG"] },
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
      { name: "Comes after the link", words: ["SPRINGS", "BEACH", "SUNDAY"] },
    ],
  },
  {
    id: "scale",
    title: "Tipping the Scale",
    pivot: "SCALE",
    categories: [
      { name: "Music elements", words: ["OCTAVE", "CHORD", "KEY"] },
      { name: "Fish features", words: ["FIN", "GILL", "TAIL"] },
      { name: "To move upward", words: ["CLIMB", "ASCEND", "MOUNT"] },
      { name: "Weighing instruments", words: ["BALANCE", "METER", "GAUGE"] },
    ],
  },
  {
    id: "bark",
    title: "Bark and Bite",
    pivot: "BARK",
    categories: [
      { name: "Dog sounds", words: ["WOOF", "GROWL", "YAP"] },
      { name: "Found on a tree", words: ["SAP", "RING", "KNOT"] },
      { name: "To speak angrily", words: ["SCOLD", "BELLOW", "RANT"] },
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
      { name: "Unused and perfect", words: ["PRISTINE", "FRESH", "NEW"] },
    ],
  },
  {
    id: "bank",
    title: "Bank On It",
    pivot: "BANK",
    categories: [
      { name: "Seen inside a branch", words: ["VAULT", "ATM", "TELLER"] },
      { name: "Beside the water", words: ["SHORE", "LEVEE", "EDGE"] },
      { name: "To trust in", words: ["COUNT", "DEPEND", "RELY"] },
      { name: "How a plane turns", words: ["TILT", "ROLL", "LEAN"] },
    ],
  },
  {
    id: "check",
    title: "Check, Please",
    pivot: "CHECK",
    categories: [
      { name: "Chess terms", words: ["MATE", "CASTLE", "ROOK"] },
      { name: "To make sure", words: ["VERIFY", "INSPECT", "CONFIRM"] },
      { name: "Restaurant payment", words: ["BILL", "TAB", "TOTAL"] },
      { name: "Fabric patterns", words: ["PLAID", "STRIPE", "FLORAL"] },
    ],
  },
  {
    id: "sheet",
    title: "A Blank Sheet",
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
      { name: "To bother someone", words: ["PESTER", "ANNOY", "NAG"] },
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
      { name: "A tough spot", words: ["SCRAPE", "BIND", "FIX"] },
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
      { name: "Bit of liquid", words: ["DAB", "BEAD", "DRIP"] },
      { name: "To fall sharply", words: ["PLUNGE", "SINK", "DIVE"] },
      { name: "To abandon", words: ["QUIT", "DITCH", "SCRAP"] },
      { name: "Hard candy", words: ["TOFFEE", "LOLLIPOP", "MINT"] },
    ],
  },
  {
    id: "pound",
    title: "One Pound",
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
      { name: "To take over a shift", words: ["RELIEVE", "REPLACE", "COVER"] },
    ],
  },
  {
    id: "stick",
    title: "Stick With It",
    pivot: "STICK",
    categories: [
      { name: "To hold fast", words: ["CLING", "ADHERE", "BOND"] },
      { name: "Bits of wood", words: ["TWIG", "BRANCH", "LOG"] },
      { name: "Swung in sport", words: ["BAT", "CLUB", "RACKET"] },
      { name: "To nudge sharply", words: ["JAB", "POKE", "PROD"] },
    ],
  },
  {
    id: "cap",
    title: "Cap It Off",
    pivot: "CAP",
    categories: [
      { name: "Headwear", words: ["HAT", "BERET", "BEANIE"] },
      { name: "Bottle closures", words: ["LID", "CORK", "STOPPER"] },
      { name: "The most allowed", words: ["LIMIT", "CEILING", "MAX"] },
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
      { name: "A lucky patch", words: ["STREAK", "RUN", "SPREE"] },
      { name: "Who's here today", words: ["REGISTER", "ROSTER", "LIST"] },
    ],
  },
  {
    id: "wave",
    title: "Make Waves",
    pivot: "WAVE",
    categories: [
      { name: "At the seaside", words: ["TIDE", "SURF", "SPRAY"] },
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
      { name: "To obstruct", words: ["HINDER", "STOP", "IMPEDE"] },
      { name: "Parts of a city", words: ["STREET", "AVENUE", "LANE"] },
      { name: "Children's toys", words: ["LEGO", "DOLL", "TEDDY"] },
      { name: "Solid chunks", words: ["SLAB", "CUBE", "LUMP"] },
    ],
  },
  {
    id: "press",
    title: "Press On",
    pivot: "PRESS",
    categories: [
      { name: "Where you read headlines", words: ["MEDIA", "NEWS", "PAPERS"] },
      { name: "To force forward", words: ["PUSH", "SHOVE", "THRUST"] },
      { name: "Getting creases out", words: ["IRON", "FLATTEN", "STEAM"] },
      { name: "Weightlifting moves", words: ["CURL", "SQUAT", "LIFT"] },
    ],
  },
  {
    id: "plot",
    title: "Plot Twist",
    pivot: "PLOT",
    categories: [
      { name: "Story elements", words: ["THEME", "CHARACTER", "TWIST"] },
      { name: "Pieces of land", words: ["LOT", "PARCEL", "TRACT"] },
      { name: "To hatch something sneaky", words: ["SCHEME", "CONSPIRE", "PLAN"] },
      { name: "To draw data", words: ["GRAPH", "MAP", "SKETCH"] },
    ],
  },
  {
    id: "crash",
    title: "Crash Course",
    pivot: "CRASH",
    categories: [
      { name: "Collisions", words: ["WRECK", "SMASH", "PILEUP"] },
      { name: "Computer failures", words: ["FREEZE", "HANG", "GLITCH"] },
      { name: "To turn up uninvited", words: ["INTRUDE", "BARGE", "INVADE"] },
      { name: "A market drop", words: ["SLUMP", "SLIDE", "TUMBLE"] },
    ],
  },
  {
    id: "court",
    title: "Hold Court",
    pivot: "COURT",
    categories: [
      { name: "Places you play", words: ["RINK", "PITCH", "FIELD"] },
      { name: "Royal trappings", words: ["THRONE", "CROWN", "SCEPTER"] },
      { name: "To chase a sweetheart", words: ["WOO", "PURSUE", "ROMANCE"] },
      { name: "Found in a courtroom", words: ["JUDGE", "JURY", "BENCH"] },
    ],
  },
  {
    id: "chip",
    title: "Chip In",
    pivot: "CHIP",
    categories: [
      { name: "Crunchy snacks", words: ["CRISP", "PRETZEL", "CRACKER"] },
      { name: "Used at a casino table", words: ["TOKEN", "COUNTER", "MARKER"] },
      { name: "Computer guts", words: ["PROCESSOR", "CIRCUIT", "TRANSISTOR"] },
      { name: "Small damage", words: ["SCRATCH", "NICK", "DENT"] },
    ],
  },
  {
    id: "seal",
    title: "Sealed Tight",
    pivot: "SEAL",
    categories: [
      { name: "Sea mammals", words: ["WALRUS", "NARWHAL", "ORCA"] },
      { name: "To make airtight", words: ["SHUT", "CLOSE", "FASTEN"] },
      { name: "Official marks", words: ["STAMP", "CREST", "EMBLEM"] },
      { name: "Elite soldiers", words: ["RANGER", "PARATROOPER", "COMMANDO"] },
    ],
  },
  {
    id: "bat",
    title: "Swing the Bat",
    pivot: "BAT",
    categories: [
      { name: "Creatures of the night", words: ["OWL", "MOTH", "RACCOON"] },
      { name: "Swung at a ball", words: ["PADDLE", "MALLET", "STICK"] },
      { name: "What eyelids do", words: ["FLUTTER", "BLINK", "WINK"] },
      { name: "Cricket terms", words: ["WICKET", "BOWLER", "CREASE"] },
    ],
  },
  {
    id: "deck",
    title: "Top Deck",
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
      { name: "To spot and mention", words: ["NOTICE", "OBSERVE", "REMARK"] },
    ],
  },
  {
    id: "park",
    title: "Walk in the Park",
    pivot: "PARK",
    categories: [
      { name: "Green spaces", words: ["GARDEN", "MEADOW", "COMMON"] },
      { name: "To bring a car to rest", words: ["STOP", "HALT", "IDLE"] },
      { name: "Amusement ___", words: ["FAIR", "CARNIVAL", "ARCADE"] },
      { name: "Baseball places", words: ["DUGOUT", "STADIUM", "DIAMOND"] },
    ],
  },
  {
    id: "switch",
    title: "Bait and Switch",
    pivot: "SWITCH",
    categories: [
      { name: "To give one for another", words: ["SWAP", "TRADE", "EXCHANGE"] },
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
      { name: "A series of", words: ["STREAK", "SEQUENCE", "SUCCESSION"] },
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
      { name: "To wipe out", words: ["ERASE", "DELETE", "DESTROY"] },
    ],
  },
  {
    id: "grade",
    title: "Make the Grade",
    pivot: "GRADE",
    categories: [
      { name: "What a report card shows", words: ["MARK", "SCORE", "RESULT"] },
      { name: "How steep a road is", words: ["SLOPE", "INCLINE", "GRADIENT"] },
      { name: "To put in order", words: ["ARRANGE", "RATE", "SORT"] },
      { name: "Quality levels", words: ["TIER", "CLASS", "BRACKET"] },
    ],
  },
  {
    id: "fry",
    title: "Fry Day",
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
      { name: "To correspond", words: ["TALLY", "FIT", "ALIGN"] },
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
      { name: "Comes through the door", words: ["MAIL", "PARCEL", "LETTER"] },
      { name: "Upright supports", words: ["PILLAR", "COLUMN", "POLE"] },
      { name: "To publish online", words: ["TWEET", "SHARE", "UPLOAD"] },
      { name: "What you're hired to do", words: ["ROLE", "JOB", "POSITION"] },
    ],
  },
  {
    id: "tank",
    title: "Tank Up",
    pivot: "TANK",
    categories: [
      { name: "Military vehicles", words: ["JEEP", "HUMVEE", "CHOPPER"] },
      { name: "Holds liquid", words: ["BARREL", "VAT", "JUG"] },
      { name: "To fail badly", words: ["FLOP", "BUST", "FLUNK"] },
      { name: "Sleeveless tops", words: ["VEST", "CAMI", "HALTER"] },
    ],
  },
  {
    id: "break",
    title: "Big Break",
    pivot: "BREAK",
    categories: [
      { name: "To split apart", words: ["SNAP", "CRACK", "SHATTER"] },
      { name: "A short rest", words: ["PAUSE", "RECESS", "BREATHER"] },
      { name: "A stroke of luck", words: ["CHANCE", "SHOT", "OPENING"] },
      { name: "To school a horse", words: ["TAME", "TRAIN", "BRIDLE"] },
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
      { name: "What a blacksmith does", words: ["SHAPE", "MOLD", "FORM"] },
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
      { name: "Writing tools", words: ["QUILL", "MARKER", "CRAYON"] },
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
      { name: "Loyal followers", words: ["ADMIRER", "SUPPORTER", "DEVOTEE"] },
      { name: "To open out wide", words: ["SPREAD", "SPLAY", "UNFURL"] },
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
      { name: "One and no more", words: ["ONLY", "LONE", "SINGLE"] },
      { name: "Parts of the foot", words: ["ARCH", "TOE", "INSTEP"] },
    ],
  },
  {
    id: "mold",
    title: "Break the Mold",
    pivot: "MOLD",
    categories: [
      { name: "Damp growth", words: ["MILDEW", "FUNGUS", "SPORE"] },
      { name: "To shape", words: ["FORM", "CARVE", "SCULPT"] },
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
      { name: "To identify with a tag", words: ["MARK", "STAMP", "LABEL"] },
    ],
  },
  {
    id: "cell",
    title: "Cell Block",
    pivot: "CELL",
    categories: [
      { name: "Body building blocks", words: ["NEURON", "TISSUE", "MEMBRANE"] },
      { name: "Prison rooms", words: ["CAGE", "DUNGEON", "LOCKUP"] },
      { name: "What you call from", words: ["MOBILE", "PHONE", "HANDSET"] },
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
      { name: "A deep hole", words: ["SHAFT", "PIT", "MINE"] },
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
      { name: "To give generously", words: ["LAVISH", "HEAP", "SPLURGE"] },
    ],
  },
  {
    id: "track",
    title: "Off Track",
    pivot: "TRACK",
    categories: [
      { name: "Railway parts", words: ["RAIL", "SIGNAL", "TIE"] },
      { name: "One item on an album", words: ["SONG", "TUNE", "CUT"] },
      { name: "To go after someone", words: ["TRACE", "TRAIL", "FOLLOW"] },
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
      { name: "Sculpted forms", words: ["STATUE", "CARVING", "BUST"] },
    ],
  },
  {
    id: "brush",
    title: "Brush Off",
    pivot: "BRUSH",
    categories: [
      { name: "Painting tools", words: ["ROLLER", "PALETTE", "EASEL"] },
      { name: "Grooming items", words: ["COMB", "RAZOR", "CLIPPERS"] },
      { name: "Dense shrubs", words: ["THICKET", "HEDGE", "BRAMBLE"] },
      { name: "To touch in passing", words: ["GRAZE", "SKIM", "GLANCE"] },
    ],
  },
  {
    id: "crane",
    title: "Crane Your Neck",
    pivot: "CRANE",
    categories: [
      { name: "Long-legged birds", words: ["HERON", "STORK", "FLAMINGO"] },
      { name: "Construction machines", words: ["FORKLIFT", "EXCAVATOR", "BULLDOZER"] },
      { name: "To lean out for a look", words: ["STRETCH", "EXTEND", "REACH"] },
      { name: "Folded from paper", words: ["BOAT", "FROG", "FAN"] },
    ],
  },
  {
    id: "draw",
    title: "Luck of the Draw",
    pivot: "DRAW",
    categories: [
      { name: "To move by force", words: ["HAUL", "DRAG", "TUG"] },
      { name: "Neither side wins", words: ["STALEMATE", "STANDOFF", "DEADHEAT"] },
      { name: "Made with a pencil", words: ["SCRIBBLE", "CARTOON", "OUTLINE"] },
      { name: "What pulls a crowd in", words: ["LURE", "MAGNET", "ATTRACTION"] },
    ],
  },
  {
    id: "spot",
    title: "Hit the Spot",
    pivot: "SPOT",
    categories: [
      { name: "A mark on the tablecloth", words: ["STAIN", "BLOT", "SMUDGE"] },
      { name: "To catch sight of", words: ["NOTICE", "DETECT", "GLIMPSE"] },
      { name: "Where something sits", words: ["SITE", "LOCATION", "POSITION"] },
      { name: "A break in the broadcast", words: ["ADVERT", "PROMO", "TRAILER"] },
    ],
  },
  {
    id: "run",
    title: "On the Run",
    pivot: "RUN",
    categories: [
      { name: "Move fast on foot", words: ["SPRINT", "JOG", "GALLOP"] },
      { name: "Be in charge of a business", words: ["MANAGE", "OPERATE", "DIRECT"] },
      { name: "Damage in a stocking", words: ["SNAG", "TEAR", "LADDER"] },
      { name: "An unbroken series", words: ["SPELL", "STRETCH", "PERIOD"] },
    ],
  },
  {
    id: "shift",
    title: "Night Shift",
    pivot: "SHIFT",
    categories: [
      { name: "A spell of work", words: ["STINT", "WATCH", "SESSION"] },
      { name: "To move a little", words: ["BUDGE", "INCH", "EDGE"] },
      { name: "A move to something new", words: ["CHANGE", "SWITCH", "TRANSITION"] },
      { name: "A simple loose dress", words: ["TUNIC", "SMOCK", "FROCK"] },
    ],
  },
  {
    id: "trip",
    title: "Round Trip",
    pivot: "TRIP",
    categories: [
      { name: "Time away from home", words: ["VOYAGE", "EXCURSION", "OUTING"] },
      { name: "To lose your footing", words: ["STUMBLE", "TUMBLE", "STAGGER"] },
      { name: "To set an alarm off", words: ["TRIGGER", "ACTIVATE", "SPRING"] },
      { name: "___ + WIRE", words: ["HIGH", "HAY", "LIVE"] },
    ],
  },
  {
    id: "cross",
    title: "Cross Purposes",
    pivot: "CROSS",
    categories: [
      { name: "In a bad mood", words: ["ANNOYED", "IRRITABLE", "GRUMPY"] },
      { name: "To get to the other side", words: ["TRAVERSE", "SPAN", "FORD"] },
      { name: "Made from two breeds", words: ["HYBRID", "BLEND", "MONGREL"] },
      { name: "___ + WORD", words: ["CATCH", "SWEAR", "BUZZ"] },
    ],
  },
  {
    id: "steam",
    title: "Full Steam",
    pivot: "STEAM",
    categories: [
      { name: "Cook over boiling water", words: ["POACH", "BRAISE", "SIMMER"] },
      { name: "A hot white cloud", words: ["VAPOR", "MIST", "HAZE"] },
      { name: "Getting a move on", words: ["ENERGY", "IMPETUS", "MOMENTUM"] },
      { name: "In a Victorian engine room", words: ["PISTON", "FLYWHEEL", "FURNACE"] },
    ],
  },
  {
    id: "sink",
    title: "Sink or Swim",
    pivot: "SINK",
    categories: [
      { name: "Go beneath the surface", words: ["SUBMERGE", "DROWN", "SCUTTLE"] },
      { name: "Holds water to wash in", words: ["BASIN", "TROUGH", "FONT"] },
      { name: "Put money into something", words: ["INVEST", "PLOW", "POUR"] },
      { name: "___ + HOLE", words: ["MAN", "KEY", "LOOP"] },
    ],
  },
  {
    id: "charm",
    title: "Third Time's a Charm",
    pivot: "CHARM",
    categories: [
      { name: "Magic worked on someone", words: ["HEX", "SPELL", "ENCHANTMENT"] },
      { name: "Hanging from a bracelet", words: ["BEAD", "PENDANT", "TRINKET"] },
      { name: "What makes someone likeable", words: ["CHARISMA", "ALLURE", "GRACE"] },
      { name: "Brings good luck", words: ["CLOVER", "HORSESHOE", "WISHBONE"] },
    ],
  },
  {
    id: "volume",
    title: "Speaks Volumes",
    pivot: "VOLUME",
    categories: [
      { name: "How loud it is", words: ["LEVEL", "DECIBELS", "AMPLITUDE"] },
      { name: "One book of a set", words: ["TOME", "EDITION", "INSTALLMENT"] },
      { name: "How much it holds", words: ["CAPACITY", "BULK", "SIZE"] },
      { name: "How much business passes through", words: ["TURNOVER", "THROUGHPUT", "TRAFFIC"] },
    ],
  },
  {
    id: "plug",
    title: "Shameless Plug",
    pivot: "PLUG",
    categories: [
      { name: "A mention on air", words: ["PROMOTE", "PUSH", "PUFF"] },
      { name: "Jammed in to block a gap", words: ["BUNG", "CORK", "WEDGE"] },
      { name: "Bits of the wiring", words: ["ADAPTER", "FUSE", "CABLE"] },
      { name: "Keep at it", words: ["SLOG", "GRIND", "PERSEVERE"] },
    ],
  },
  {
    id: "score",
    title: "Know the Score",
    pivot: "SCORE",
    categories: [
      { name: "The running count", words: ["TOTAL", "SUM", "RECKONING"] },
      { name: "What the orchestra reads", words: ["NOTATION", "SHEET", "ARRANGEMENT"] },
      { name: "A cut in a surface", words: ["SCRATCH", "GROOVE", "NOTCH"] },
      { name: "To get hold of something", words: ["OBTAIN", "ACQUIRE", "BAG"] },
    ],
  },
  {
    id: "rail",
    title: "Off the Rails",
    pivot: "RAIL",
    categories: [
      { name: "To protest furiously", words: ["RANT", "FUME", "RAGE"] },
      { name: "Part of a railway", words: ["SLEEPER", "GAUGE", "JUNCTION"] },
      { name: "Beside the staircase", words: ["BANISTER", "BALUSTRADE", "NEWEL"] },
      { name: "___ + WAY", words: ["SUB", "HIGH", "DRIVE"] },
    ],
  },
  {
    id: "mark",
    title: "Mark My Words",
    pivot: "MARK",
    categories: [
      { name: "Money before the euro", words: ["FRANC", "LIRA", "PESETA"] },
      { name: "Go over an exam paper", words: ["ASSESS", "CORRECT", "APPRAISE"] },
      { name: "A dirty smudge", words: ["SMEAR", "STREAK", "SPLOTCH"] },
      { name: "What you aim at", words: ["TARGET", "BULLSEYE", "GOAL"] },
    ],
  },
  {
    id: "present",
    title: "Present Company",
    pivot: "PRESENT",
    categories: [
      { name: "Something wrapped up", words: ["GIFT", "PACKAGE", "PARCEL"] },
      { name: "At this very moment", words: ["NOW", "TODAY", "CURRENTLY"] },
      { name: "Front the programme", words: ["HOST", "EMCEE", "INTRODUCE"] },
      { name: "Put before the judge", words: ["SUBMIT", "OFFER", "EXHIBIT"] },
    ],
  },
  {
    id: "stall",
    title: "Market Stall",
    pivot: "STALL",
    categories: [
      { name: "A pitch at the market", words: ["BOOTH", "STAND", "COUNTER"] },
      { name: "Play for time", words: ["DELAY", "STONEWALL", "FILIBUSTER"] },
      { name: "The engine gives up", words: ["SPUTTER", "CONK", "SEIZE"] },
      { name: "Seating in a theatre", words: ["BALCONY", "CIRCLE", "GALLERY"] },
    ],
  },
  {
    id: "swing",
    title: "In Full Swing",
    pivot: "SWING",
    categories: [
      { name: "Playground kit", words: ["SLIDE", "SEESAW", "SANDBOX"] },
      { name: "Big-band music", words: ["BEBOP", "RAGTIME", "BOOGIE"] },
      { name: "To pull something off", words: ["ARRANGE", "MANAGE", "FINAGLE"] },
      { name: "A wild go at the ball", words: ["SWIPE", "LUNGE", "WALLOP"] },
    ],
  },
  {
    id: "drive",
    title: "Test Drive",
    pivot: "DRIVE",
    categories: [
      { name: "What keeps you going", words: ["AMBITION", "MOTIVATION", "HUNGER"] },
      { name: "Storage inside a computer", words: ["DISK", "MEMORY", "CACHE"] },
      { name: "The way up to a house", words: ["PATH", "APPROACH", "LANE"] },
      { name: "Take the wheel", words: ["STEER", "MOTOR", "NAVIGATE"] },
    ],
  },
  {
    id: "grain",
    title: "Against the Grain",
    pivot: "GRAIN",
    categories: [
      { name: "Cereal crops", words: ["WHEAT", "BARLEY", "OATS"] },
      { name: "The pattern in timber", words: ["STRIPE", "TEXTURE", "VEIN"] },
      { name: "The tiniest amount", words: ["SPECK", "TRACE", "PARTICLE"] },
      { name: "Small units of weight", words: ["OUNCE", "DRAM", "CARAT"] },
    ],
  },
  {
    id: "peak",
    title: "Peak Season",
    pivot: "PEAK",
    categories: [
      { name: "The top of a mountain", words: ["SUMMIT", "CREST", "RIDGE"] },
      { name: "Somebody's best years", words: ["PRIME", "HEYDAY", "BLOOM"] },
      { name: "The front of a cap", words: ["BRIM", "VISOR", "BILL"] },
      { name: "When it is busiest", words: ["RUSH", "CRUSH", "SURGE"] },
    ],
  },
  {
    id: "hook",
    title: "Off the Hook",
    pivot: "HOOK",
    categories: [
      { name: "In the tackle box", words: ["BAIT", "FLOAT", "SINKER"] },
      { name: "The catchy part of a song", words: ["CHORUS", "RIFF", "REFRAIN"] },
      { name: "Thrown in the ring", words: ["JAB", "UPPERCUT", "HAYMAKER"] },
      { name: "Hang your coat on it", words: ["PEG", "HANGER", "RACK"] },
    ],
  },
  {
    id: "turn",
    title: "Turn for the Better",
    pivot: "TURN",
    categories: [
      { name: "Your chance to play", words: ["MOVE", "INNINGS", "STINT"] },
      { name: "Go round and round", words: ["ROTATE", "GYRATE", "CIRCLE"] },
      { name: "What old milk does", words: ["SOUR", "CURDLE", "SPOIL"] },
      { name: "A kink in the road", words: ["BEND", "CORNER", "CURVE"] },
    ],
  },
  {
    id: "lead",
    title: "Take the Lead",
    pivot: "LEAD",
    categories: [
      { name: "Heavy metals", words: ["TIN", "ZINC", "COPPER"] },
      { name: "Walking the dog", words: ["LEASH", "COLLAR", "HARNESS"] },
      { name: "What the detective follows", words: ["CLUE", "TIP", "TRAIL"] },
      { name: "The main part in a film", words: ["ROLE", "PROTAGONIST", "HEADLINER"] },
    ],
  },
  {
    id: "clip",
    title: "At a Clip",
    pivot: "CLIP",
    categories: [
      { name: "Cut the hedge back", words: ["TRIM", "SNIP", "SHEAR"] },
      { name: "Holds sheets together", words: ["STAPLE", "PIN", "BINDER"] },
      { name: "A short bit of film", words: ["OUTTAKE", "EXCERPT", "SEGMENT"] },
      { name: "How fast you are going", words: ["PACE", "SPEED", "RATE"] },
    ],
  },
  {
    id: "floor",
    title: "Ground Floor",
    pivot: "FLOOR",
    categories: [
      { name: "One storey up", words: ["MEZZANINE", "LANDING", "GALLERY"] },
      { name: "Put an opponent on the canvas", words: ["FLATTEN", "FELL", "DOWN"] },
      { name: "Leave somebody clueless", words: ["STUMP", "CONFOUND", "BAFFLE"] },
      { name: "Laid over the boards", words: ["CARPET", "TILE", "LINOLEUM"] },
    ],
  },
  {
    id: "prime",
    title: "Prime Cut",
    pivot: "PRIME",
    categories: [
      { name: "Grade A quality", words: ["CHOICE", "SELECT", "TOP"] },
      { name: "Kinds of number", words: ["INTEGER", "FRACTION", "DECIMAL"] },
      { name: "___ + TIME", words: ["BED", "LUNCH", "OVER"] },
      { name: "Set up in advance", words: ["READY", "BRIEF", "GROOM"] },
    ],
  },
  {
    id: "shock",
    title: "Shock to the System",
    pivot: "SHOCK",
    categories: [
      { name: "Down the wire", words: ["VOLT", "JOLT", "CURRENT"] },
      { name: "Catch somebody off guard", words: ["SURPRISE", "STARTLE", "ASTONISH"] },
      { name: "A thick head of hair", words: ["MOP", "MANE", "TUFT"] },
      { name: "Under the chassis", words: ["DAMPER", "STRUT", "AXLE"] },
    ],
  },
  {
    id: "spin",
    title: "Spin Cycle",
    pivot: "SPIN",
    categories: [
      { name: "Turn on the spot", words: ["WHIRL", "TWIRL", "PIROUETTE"] },
      { name: "How a story is framed", words: ["ANGLE", "SLANT", "GLOSS"] },
      { name: "A short drive out", words: ["JAUNT", "RIDE", "CRUISE"] },
      { name: "Settings on a washing machine", words: ["RINSE", "WASH", "DRAIN"] },
    ],
  },
  {
    id: "tender",
    title: "Tender Loving",
    pivot: "TENDER",
    categories: [
      { name: "Full of kindness", words: ["GENTLE", "SOFT", "LOVING"] },
      { name: "Hurts when touched", words: ["SORE", "ACHING", "PAINFUL"] },
      { name: "Sent in to win the contract", words: ["BID", "QUOTE", "PROPOSAL"] },
      { name: "A small boat serving a ship", words: ["DINGHY", "SKIFF", "LAUNCH"] },
    ],
  },
  {
    id: "channel",
    title: "Change the Channel",
    pivot: "CHANNEL",
    categories: [
      { name: "Where you find a programme", words: ["STATION", "NETWORK", "FREQUENCY"] },
      { name: "Salt water between two shores", words: ["STRAIT", "NARROWS", "PASSAGE"] },
      { name: "Aim your energy somewhere", words: ["DIRECT", "FOCUS", "STEER"] },
      { name: "Carries water underground", words: ["DUCT", "CONDUIT", "CULVERT"] },
    ],
  },
  {
    id: "vault",
    title: "Under the Vault",
    pivot: "VAULT",
    categories: [
      { name: "Where the bank keeps cash", words: ["SAFE", "STRONGBOX", "COFFER"] },
      { name: "Gymnastics apparatus", words: ["BEAM", "RINGS", "BARS"] },
      { name: "A curved ceiling", words: ["ARCH", "DOME", "CANOPY"] },
      { name: "Burial chambers", words: ["CRYPT", "TOMB", "CATACOMB"] },
    ],
  },
  {
    id: "panel",
    title: "Panel Show",
    pivot: "PANEL",
    categories: [
      { name: "Experts taking questions", words: ["JURY", "COMMISSION", "TRIBUNAL"] },
      { name: "A flat piece of wood", words: ["PLANK", "SLAB", "PLYWOOD"] },
      { name: "Parts of a comic book", words: ["STRIP", "FRAME", "SPREAD"] },
      { name: "In the cockpit", words: ["DASHBOARD", "CONSOLE", "DIAL"] },
    ],
  },
  {
    id: "step",
    title: "Step by Step",
    pivot: "STEP",
    categories: [
      { name: "Part of a staircase", words: ["STAIR", "RUNG", "TREAD"] },
      { name: "Moves on the dance floor", words: ["SHUFFLE", "GLIDE", "TAP"] },
      { name: "One part of a process", words: ["PHASE", "STAGE", "LEG"] },
      { name: "___ + MOTHER", words: ["GOD", "GRAND", "HOUSE"] },
    ],
  },
  {
    id: "snap",
    title: "Snap Decision",
    pivot: "SNAP",
    categories: [
      { name: "Break with a sharp sound", words: ["CRACK", "SPLIT", "FRACTURE"] },
      { name: "Taken with a camera", words: ["PHOTO", "SHOT", "PICTURE"] },
      { name: "A sudden cold spell", words: ["FREEZE", "FROST", "CHILL"] },
      { name: "Does up a jacket", words: ["BUTTON", "CLASP", "STUD"] },
    ],
  },
  {
    id: "temper",
    title: "Lose Your Temper",
    pivot: "TEMPER",
    categories: [
      { name: "Blind anger", words: ["FURY", "WRATH", "RAGE"] },
      { name: "Treat steel in the forge", words: ["HARDEN", "ANNEAL", "QUENCH"] },
      { name: "To tone something down", words: ["MODERATE", "SOFTEN", "MELLOW"] },
      { name: "The mood somebody is in", words: ["HUMOR", "DISPOSITION", "SPIRITS"] },
    ],
  },
  {
    id: "slate",
    title: "Clean Slate",
    pivot: "SLATE",
    categories: [
      { name: "Up on the roof", words: ["SHINGLE", "THATCH", "TILE"] },
      { name: "The candidates standing", words: ["TICKET", "LINEUP", "FIELD"] },
      { name: "To review savagely", words: ["PAN", "TRASH", "MAUL"] },
      { name: "Shades of grey", words: ["ASH", "PEWTER", "CHARCOAL"] },
    ],
  },
  {
    id: "strain",
    title: "Under Strain",
    pivot: "STRAIN",
    categories: [
      { name: "Hurt a muscle", words: ["WRENCH", "PULL", "TWEAK"] },
      { name: "A variety of virus", words: ["VARIANT", "TYPE", "BREED"] },
      { name: "Pour the pasta water off", words: ["SIEVE", "FILTER", "DRAIN"] },
      { name: "What a deadline puts you under", words: ["STRESS", "TENSION", "PRESSURE"] },
    ],
  },
];

// ---------------------------------------------------------------------------
// Dedicated emoji boss. Every spoke is shown as an emoji only — no letters —
// so you have to read the pictures, group them, then guess the link (BOLT).
// The lightning emoji is deliberately avoided so the link isn't spoiled.

export const EMOJI_BOSS: RawPuzzle = {
  id: "emoji-bolt",
  title: "The Lightning Bolt",
  pivot: "BOLT",
  categories: [
    { name: "Quick on their feet", words: ["SPRINTER", "CHEETAH", "HORSE"] },
    { name: "In the toolbox", words: ["WRENCH", "GEAR", "SCREW"] },
    { name: "Stormy weather", words: ["RAIN", "CLOUD", "WIND"] },
    { name: "Keeping it shut", words: ["LOCK", "KEY", "DOOR"] },
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
export function seededShuffle<T>(input: T[], seed: number): T[] {
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

// The heuristic alone made levels 1–5 feel identical, so the opening chapter is
// hand-ordered as a real ramp: STAR tutorial → all-concrete nouns (trunk) →
// one verb group (ring) → mixed concrete/abstract (bug) → mostly abstract verb
// groups (bank) → the first boss. Level 5 should already feel like a step up.
const OPENING = ["star", "trunk", "ring", "bug", "bank"];

const orderedRaw = [
  ...OPENING.map((id) => PUZZLES.find((p) => p.id === id)!),
  ...PUZZLES.filter((p) => !OPENING.includes(p.id)).sort(
    (a, b) => difficultyScore(a) - difficultyScore(b),
  ),
];

export const LEVELS: Level[] = orderedRaw.map((raw, i) => ({
  ...raw,
  tier: (i < orderedRaw.length / 3 ? 1 : i < (2 * orderedRaw.length) / 3 ? 2 : 3) as Tier,
}));

/** Localized via `tier.1` … `tier.3` — see src/i18n. */
export const TIER_KEY: Record<Tier, string> = { 1: "tier.1", 2: "tier.2", 3: "tier.3" };

// ---------------------------------------------------------------------------
// Chapters: a light story-flavoured grouping of the difficulty-ordered levels.
// The last level of each chapter is a "boss".

export interface Chapter {
  /** Catalogue keys — the copy itself lives in src/i18n. */
  nameKey: string;
  flavorKey: string;
  start: number; // inclusive index into LEVELS
  end: number; // exclusive
  boss: number; // index of the chapter's final (boss) level
}

// Chapter copy is localized: chapter.1.name / chapter.1.flavor … (src/i18n).
const CHAPTER_COUNT = 12;

// Front-loaded chapter sizes: the first chapter is short so a player meets a
// boss (the most distinctive content) by ~level 6 instead of level 8, and the
// early map feels less like a wall. Chapters grow as the campaign goes on —
// by then a player is here for the puzzles, not the ceremony — and the last
// chapter swallows any remainder.
const CHAPTER_SIZES = [6, 7, 7, 8, 8, 8, 8, 9, 9, 9, 10];

export const CHAPTERS: Chapter[] = (() => {
  const out: Chapter[] = [];
  let start = 0;
  for (let i = 0; i < CHAPTER_COUNT && start < LEVELS.length; i++) {
    const last = i === CHAPTER_COUNT - 1;
    const end = last ? LEVELS.length : Math.min(start + (CHAPTER_SIZES[i] ?? 8), LEVELS.length);
    out.push({ nameKey: `chapter.${i + 1}.name`, flavorKey: `chapter.${i + 1}.flavor`, start, end, boss: end - 1 });
    start = end;
  }
  return out;
})();

const BOSS_SET = new Set(CHAPTERS.map((c) => c.boss));

/** Which chapter a level belongs to (index into CHAPTERS). */
export function chapterOfLevel(index: number): number {
  const ci = CHAPTERS.findIndex((c) => index >= c.start && index < c.end);
  return ci < 0 ? 0 : ci;
}

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

// One entry per chapter, and the list is deliberately NOT cycled with a
// modulo: "emoji" swaps in the one bespoke picture board, so a second emoji
// chapter would replay a board the player has already solved. Adjacent
// chapters never repeat a twist either.
const CHAPTER_TWISTS: BossTwist[] = [
  "scramble",
  "oracle",
  "emoji",
  "blackout",
  "decoy",
  "scramble",
  "oracle",
  "decoy",
  "blackout",
  "scramble",
  "oracle",
  "blackout",
];

/** The twist for a given level index, or null if it isn't a boss. */
export function bossTwist(index: number): BossTwist | null {
  const chapter = CHAPTERS.findIndex((c) => c.boss === index);
  if (chapter === -1) return null;
  return CHAPTER_TWISTS[chapter % CHAPTER_TWISTS.length];
}

// ---------------------------------------------------------------------------
// Chapter keys. Each chapter hides a keyword, and every non-boss level in that
// chapter banks one of its letters when you clear it. Bank them all and the
// keyword can be spelled — which is what opens the chapter's boss door.
//
// The keyword's length must equal the chapter's non-boss level count, so one
// level buys exactly one letter. `npm run validate` enforces that, because a
// mismatch would either strand letters or leave a slot nothing can fill.

export const CHAPTER_KEYS = [
  "SPARK", // 1 First Light
  "EMBERS", // 2 Warming Up
  "TANGLE", // 3 Crossed Wires
  "MIRRORS", // 4 Double Meanings
  "SPIRALS", // 5 Twists & Turns
  "LEXICON", // 6 Rare Words
  "RIDDLES", // 7 Mind Benders
  "UNDERTOW", // 8 Deep Water
  "MISCHIEF", // 9 Sleight of Hand
  "PATIENCE", // 10 The Long Game
  "TIGHTROPE", // 11 No Safety Net
  "MASTERMIND", // 12 The Final Test
];

/** The keyword guarding a chapter's boss. */
export function chapterKey(chapter: number): string {
  return CHAPTER_KEYS[chapter % CHAPTER_KEYS.length];
}

/** Levels in a chapter that bank a key letter — everything but the boss. */
export function keyLevels(chapter: number): number[] {
  const c = CHAPTERS[chapter];
  const out: number[] = [];
  for (let i = c.start; i < c.end; i++) if (i !== c.boss) out.push(i);
  return out;
}

/**
 * Which letter each level hands over, chapter by chapter.
 *
 * The keyword is dealt out SCRAMBLED before the levels get it, for two
 * reasons. The map shows the letters you've collected, and a rail that spells
 * the answer left to right would hand over the anagram — the anagram *is* the
 * puzzle. And a jumble that fills in as you play is a far better collectible
 * than a word slowly typing itself.
 */
const KEY_DEAL: string[][] = CHAPTER_KEYS.map((word, ci) => {
  const letters = word.split("");
  // A shuffle is allowed to come back as the word itself; that one outcome
  // gives the key away, so try again from a moved seed. Repeated letters make
  // several shuffles read alike, never the word, so this settles at once.
  for (let attempt = 0; attempt < 8; attempt++) {
    const dealt = seededShuffle(letters, 90210 + ci * 7717 + attempt * 131);
    if (dealt.join("") !== word) return dealt;
  }
  return [...letters].reverse();
});

/** The key letter a level banks when it's cleared, or null if it banks none. */
export function keyLetterOf(index: number): string | null {
  const ci = CHAPTERS.findIndex((c) => index >= c.start && index < c.end);
  if (ci < 0) return null;
  const slot = keyLevels(ci).indexOf(index);
  return slot < 0 ? null : KEY_DEAL[ci % KEY_DEAL.length][slot];
}

/** Every slot in a chapter's key: the level that fills it, and with what. */
export function keySlots(chapter: number): { index: number; letter: string }[] {
  const deal = KEY_DEAL[chapter % KEY_DEAL.length];
  return keyLevels(chapter).map((index, slot) => ({ index, letter: deal[slot] }));
}

/**
 * The title of the board actually played at a level — NOT always
 * `LEVELS[index].title`, because the emoji boss substitutes its own board
 * (Game.tsx does the same swap). The level map shows this back to a player who
 * has solved the level, so it has to name the board they really saw.
 */
export function levelTitle(index: number): string {
  return bossTwist(index) === "emoji" ? EMOJI_BOSS.title : LEVELS[index].title;
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
