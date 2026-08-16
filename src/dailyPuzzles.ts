import type { RawPuzzle } from "./puzzles";

// ---------------------------------------------------------------------------
// The dedicated DAILY pool (CrazyGames backlog #4).
//
// These puzzles never appear in the campaign, so the Daily Challenge can't
// repeat or spoil a level the player hasn't reached. No pivot here is reused
// from the campaign. The daily rotation walks a fixed shuffled tour of this
// pool (see progress.ts), so a daily never repeats within a full cycle
// (80 days). Endless mode and Pairs also draw from this pool.
//
// Same shape as the campaign: 1 hidden pivot + 4 categories x 3 spokes.
// House style: category names in plain, global English — short words, no
// regional idioms — for the large non-native-speaker audience.
// ---------------------------------------------------------------------------

export const DAILY_PUZZLES: RawPuzzle[] = [
  {
    id: "key",
    title: "Find the Key",
    pivot: "KEY",
    categories: [
      { name: "On a keyboard", words: ["SPACE", "SHIFT", "ENTER"] },
      { name: "Music words", words: ["TEMPO", "CHORD", "MELODY"] },
      { name: "Opens a lock", words: ["CODE", "PASSWORD", "COMBINATION"] },
      { name: "Most important", words: ["VITAL", "CENTRAL", "MAIN"] },
    ],
  },
  {
    id: "board",
    title: "On Board",
    pivot: "BOARD",
    categories: [
      { name: "Long flat pieces of wood", words: ["PLANK", "SLAT", "PANEL"] },
      { name: "To get on a bus or ship", words: ["EMBARK", "ENTER", "CLIMB"] },
      { name: "A group that decides", words: ["COUNCIL", "COMMITTEE", "JURY"] },
      { name: "___ + GAME", words: ["VIDEO", "CARD", "MIND"] },
    ],
  },
  {
    id: "crown",
    title: "The Crown",
    pivot: "CROWN",
    categories: [
      { name: "Worn on the head", words: ["HELMET", "TIARA", "TURBAN"] },
      { name: "At the dentist", words: ["ENAMEL", "FILLING", "CAVITY"] },
      { name: "The very top", words: ["PEAK", "SUMMIT", "TIP"] },
      { name: "A king's things", words: ["THRONE", "ROBE", "ORB"] },
    ],
  },
  {
    id: "train",
    title: "Catch the Train",
    pivot: "TRAIN",
    categories: [
      { name: "Public transport", words: ["BUS", "TRAM", "SUBWAY"] },
      { name: "To get ready by repeating", words: ["REHEARSE", "PRACTICE", "PREPARE"] },
      { name: "Parts of a long dress", words: ["HEM", "SLEEVE", "COLLAR"] },
      { name: "One thing after another", words: ["CHAIN", "SERIES", "CONVOY"] },
    ],
  },
  {
    id: "watch",
    title: "On Watch",
    pivot: "WATCH",
    categories: [
      { name: "To look at", words: ["SEE", "OBSERVE", "VIEW"] },
      { name: "Worn on the wrist", words: ["BRACELET", "BANGLE", "WRISTBAND"] },
      { name: "To keep safe", words: ["GUARD", "PATROL", "PROTECT"] },
      { name: "Tells the time", words: ["CLOCK", "SUNDIAL", "TIMER"] },
    ],
  },
  {
    id: "band",
    title: "Join the Band",
    pivot: "BAND",
    categories: [
      { name: "Musicians who play together", words: ["TRIO", "QUARTET", "ORCHESTRA"] },
      { name: "Wraps around something", words: ["STRAP", "SASH", "RIBBON"] },
      { name: "Radio words", words: ["FREQUENCY", "STATIC", "ANTENNA"] },
      { name: "At a wedding", words: ["CAKE", "BOUQUET", "VOWS"] },
    ],
  },
  {
    id: "beam",
    title: "Full Beam",
    pivot: "BEAM",
    categories: [
      { name: "A line of light", words: ["RAY", "GLEAM", "GLOW"] },
      { name: "Holds up a roof", words: ["RAFTER", "JOIST", "TRUSS"] },
      { name: "Gymnastics events", words: ["VAULT", "FLOOR", "BARS"] },
      { name: "To put out a signal", words: ["BROADCAST", "TRANSMIT", "SEND"] },
    ],
  },
  {
    id: "box",
    title: "Open the Box",
    pivot: "BOX",
    categories: [
      { name: "Holds your stuff", words: ["CRATE", "CARTON", "BIN"] },
      { name: "To fight with fists", words: ["SPAR", "PUNCH", "JAB"] },
      { name: "___ + OFFICE", words: ["POST", "BACK", "HEAD"] },
      { name: "Shapes with corners", words: ["CUBE", "RECTANGLE", "PRISM"] },
    ],
  },
  {
    id: "cast",
    title: "The Cast",
    pivot: "CAST",
    categories: [
      { name: "Theatre words", words: ["SCRIPT", "PROP", "COSTUME"] },
      { name: "To throw", words: ["FLING", "HURL", "LOB"] },
      { name: "For a broken arm", words: ["PLASTER", "SPLINT", "BANDAGE"] },
      { name: "Done with a fishing rod", words: ["REEL", "HOOK", "LURE"] },
    ],
  },
  {
    id: "charge",
    title: "Take Charge",
    pivot: "CHARGE",
    categories: [
      { name: "To run straight at", words: ["RUSH", "STORM", "ATTACK"] },
      { name: "Battery words", words: ["VOLT", "AMP", "CABLE"] },
      { name: "A price to pay", words: ["FEE", "COST", "RATE"] },
      { name: "Courtroom words", words: ["VERDICT", "PLEA", "TRIAL"] },
    ],
  },
  {
    id: "coach",
    title: "The Coach",
    pivot: "COACH",
    categories: [
      { name: "Leads a sports team", words: ["MANAGER", "SKIPPER", "CAPTAIN"] },
      { name: "To help someone learn", words: ["TEACH", "MENTOR", "GUIDE"] },
      { name: "Vehicles", words: ["BUS", "VAN", "CARRIAGE"] },
      { name: "Airplane seat classes", words: ["ECONOMY", "BUSINESS", "FIRST"] },
    ],
  },
  {
    id: "coat",
    title: "A Warm Coat",
    pivot: "COAT",
    categories: [
      { name: "Winter clothing", words: ["PARKA", "JACKET", "SCARF"] },
      { name: "Layers of paint", words: ["PRIMER", "GLOSS", "VARNISH"] },
      { name: "An animal's covering", words: ["FUR", "PELT", "HIDE"] },
      { name: "To put a thin layer on", words: ["COVER", "GLAZE", "DUST"] },
    ],
  },
  {
    id: "count",
    title: "The Final Count",
    pivot: "COUNT",
    categories: [
      { name: "To add up", words: ["TALLY", "NUMBER", "TOTAL"] },
      { name: "Noble titles", words: ["DUKE", "BARON", "EARL"] },
      { name: "To be important", words: ["MATTER", "WEIGH", "REGISTER"] },
      { name: "Election words", words: ["BALLOT", "VOTE", "CAMPAIGN"] },
    ],
  },
  {
    id: "draft",
    title: "First Draft",
    pivot: "DRAFT",
    categories: [
      { name: "An early version", words: ["SKETCH", "OUTLINE", "PLAN"] },
      { name: "Cold moving air", words: ["BREEZE", "GUST", "CHILL"] },
      { name: "To pick for a team", words: ["RECRUIT", "SELECT", "ENLIST"] },
      { name: "Beer words", words: ["BREW", "PINT", "ALE"] },
    ],
  },
  {
    id: "drill",
    title: "The Drill",
    pivot: "DRILL",
    categories: [
      { name: "In a toolbox", words: ["WRENCH", "PLIERS", "SCREWDRIVER"] },
      { name: "Repeated practice", words: ["EXERCISE", "ROUTINE", "WORKOUT"] },
      { name: "To make a hole", words: ["BORE", "PIERCE", "PUNCTURE"] },
      { name: "Army words", words: ["SERGEANT", "BARRACKS", "REGIMENT"] },
    ],
  },
  {
    id: "duck",
    title: "Lucky Duck",
    pivot: "DUCK",
    categories: [
      { name: "Water birds", words: ["SWAN", "GOOSE", "HERON"] },
      { name: "To move out of the way", words: ["DODGE", "SWERVE", "EVADE"] },
      { name: "Meats on a menu", words: ["BEEF", "LAMB", "PORK"] },
      { name: "Bath-time things", words: ["SPONGE", "SOAP", "TOWEL"] },
    ],
  },
  {
    id: "fair",
    title: "Fair Play",
    pivot: "FAIR",
    categories: [
      { name: "Playing by the rules", words: ["JUST", "EQUAL", "HONEST"] },
      { name: "Fun events with tents", words: ["CARNIVAL", "CIRCUS", "RODEO"] },
      { name: "Light in color", words: ["PALE", "BLOND", "GOLDEN"] },
      { name: "Not bad, not great", words: ["AVERAGE", "DECENT", "PASSABLE"] },
    ],
  },
  {
    id: "fall",
    title: "Free Fall",
    pivot: "FALL",
    categories: [
      { name: "Seasons", words: ["SPRING", "SUMMER", "WINTER"] },
      { name: "To tumble down", words: ["TOPPLE", "STUMBLE", "COLLAPSE"] },
      { name: "To go down in number", words: ["DECLINE", "DECREASE", "DIP"] },
      { name: "A sad ending", words: ["DEFEAT", "RUIN", "DOOM"] },
    ],
  },
  {
    id: "file",
    title: "On File",
    pivot: "FILE",
    categories: [
      { name: "On a computer", words: ["FOLDER", "DOCUMENT", "DESKTOP"] },
      { name: "Nail-care tools", words: ["BUFFER", "CLIPPERS", "POLISH"] },
      { name: "Walking one behind another", words: ["QUEUE", "ROW", "PROCESSION"] },
      { name: "To hand in paperwork", words: ["SUBMIT", "LODGE", "PRESENT"] },
    ],
  },
  {
    id: "flat",
    title: "The Flat",
    pivot: "FLAT",
    categories: [
      { name: "No bumps at all", words: ["LEVEL", "EVEN", "SMOOTH"] },
      { name: "City homes", words: ["APARTMENT", "STUDIO", "LOFT"] },
      { name: "Tire problems", words: ["PUNCTURE", "BLOWOUT", "LEAK"] },
      { name: "Musical note words", words: ["SHARP", "MINOR", "NATURAL"] },
    ],
  },
  {
    id: "fly",
    title: "Learn to Fly",
    pivot: "FLY",
    categories: [
      { name: "Small insects", words: ["MOTH", "GNAT", "WASP"] },
      { name: "To move through the air", words: ["SOAR", "GLIDE", "FLOAT"] },
      { name: "On a pair of pants", words: ["ZIPPER", "BUTTON", "POCKET"] },
      { name: "Baseball hits", words: ["SINGLE", "DOUBLE", "BUNT"] },
    ],
  },
  {
    id: "fold",
    title: "Fold It In",
    pivot: "FOLD",
    categories: [
      { name: "What origami needs", words: ["CREASE", "BEND", "TUCK"] },
      { name: "On a sheep farm", words: ["PASTURE", "PEN", "BARN"] },
      { name: "To give up a game", words: ["QUIT", "WITHDRAW", "CONCEDE"] },
      { name: "Mixing in the kitchen", words: ["STIR", "BLEND", "WHISK"] },
    ],
  },
  {
    id: "frame",
    title: "In the Frame",
    pivot: "FRAME",
    categories: [
      { name: "Around a picture", words: ["BORDER", "MOUNT", "EDGE"] },
      { name: "Bowling words", words: ["SPARE", "PIN", "LANE"] },
      { name: "Parts of glasses", words: ["LENS", "ARM", "BRIDGE"] },
      { name: "Bits of a film", words: ["STILL", "SCENE", "CLIP"] },
    ],
  },
  {
    id: "hand",
    title: "Lend a Hand",
    pivot: "HAND",
    categories: [
      { name: "Card-game actions", words: ["DEAL", "BLUFF", "SHUFFLE"] },
      { name: "On a clock", words: ["DIAL", "FACE", "NUMERAL"] },
      { name: "To put in someone's grasp", words: ["PASS", "GIVE", "DELIVER"] },
      { name: "Someone who does the work", words: ["LABORER", "WORKER", "HELPER"] },
    ],
  },
  {
    id: "iron",
    title: "Strong as Iron",
    pivot: "IRON",
    categories: [
      { name: "Metals", words: ["STEEL", "COPPER", "BRASS"] },
      { name: "Golf words", words: ["PUTTER", "DRIVER", "TEE"] },
      { name: "Laundry-day things", words: ["HANGER", "DETERGENT", "BASKET"] },
      { name: "Very strong", words: ["TOUGH", "FIRM", "MIGHTY"] },
    ],
  },
  {
    id: "jack",
    title: "Jackpot",
    pivot: "JACK",
    categories: [
      { name: "Playing cards", words: ["KING", "QUEEN", "JOKER"] },
      { name: "Lifts heavy things", words: ["LEVER", "HOIST", "CRANE"] },
      { name: "Where a cable goes", words: ["PLUG", "OUTLET", "ADAPTER"] },
      { name: "___ + POT", words: ["TEA", "FLOWER", "HONEY"] },
    ],
  },
  {
    id: "lap",
    title: "Victory Lap",
    pivot: "LAP",
    categories: [
      { name: "Once around", words: ["LOOP", "ROUND", "ORBIT"] },
      { name: "Where a kitten naps", words: ["CUSHION", "BLANKET", "BASKET"] },
      { name: "To drink like a cat", words: ["SLURP", "LICK", "SIP"] },
      { name: "___ + TOP", words: ["DESK", "ROOF", "TABLE"] },
    ],
  },
  {
    id: "line",
    title: "Draw a Line",
    pivot: "LINE",
    categories: [
      { name: "Spoken in a play", words: ["DIALOGUE", "CUE", "MONOLOGUE"] },
      { name: "Fishing tackle", words: ["ROD", "REEL", "BAIT"] },
      { name: "Geometry words", words: ["ANGLE", "CURVE", "POINT"] },
      { name: "Bits of writing", words: ["VERSE", "SENTENCE", "PHRASE"] },
    ],
  },
  {
    id: "log",
    title: "Keep a Log",
    pivot: "LOG",
    categories: [
      { name: "Cut from trees", words: ["TIMBER", "STUMP", "PLANK"] },
      { name: "Books of records", words: ["DIARY", "JOURNAL", "LEDGER"] },
      { name: "Words from signing in", words: ["BROWSER", "ACCOUNT", "PROFILE"] },
      { name: "Math class words", words: ["SINE", "PI", "ALGEBRA"] },
    ],
  },
  {
    id: "march",
    title: "Quick March",
    pivot: "MARCH",
    categories: [
      { name: "Months", words: ["APRIL", "JUNE", "AUGUST"] },
      { name: "To walk like soldiers", words: ["STRIDE", "TROOP", "PATROL"] },
      { name: "Public demonstrations", words: ["PROTEST", "RALLY", "PICKET"] },
      { name: "Pieces of music", words: ["ANTHEM", "WALTZ", "POLKA"] },
    ],
  },
  {
    id: "mine",
    title: "All Mine",
    pivot: "MINE",
    categories: [
      { name: "Belongs to someone", words: ["YOURS", "HIS", "HERS"] },
      { name: "Dug into the ground", words: ["TUNNEL", "SHAFT", "QUARRY"] },
      { name: "Explosive weapons", words: ["BOMB", "TORPEDO", "GRENADE"] },
      { name: "___ + FIELD", words: ["BATTLE", "CORN", "AIR"] },
    ],
  },
  {
    id: "model",
    title: "A Perfect Model",
    pivot: "MODEL",
    categories: [
      { name: "Fashion-show words", words: ["RUNWAY", "CATWALK", "DESIGNER"] },
      { name: "A small copy", words: ["REPLICA", "MINIATURE", "TOY"] },
      { name: "One to copy", words: ["EXAMPLE", "IDEAL", "PATTERN"] },
      { name: "Kinds of a product", words: ["MAKE", "EDITION", "VERSION"] },
    ],
  },
  {
    id: "net",
    title: "Into the Net",
    pivot: "NET",
    categories: [
      { name: "Catches animals", words: ["TRAP", "SNARE", "MESH"] },
      { name: "Business money words", words: ["GROSS", "PROFIT", "INCOME"] },
      { name: "Tennis words", words: ["SERVE", "VOLLEY", "BASELINE"] },
      { name: "Internet words", words: ["ONLINE", "WIFI", "EMAIL"] },
    ],
  },
  {
    id: "patch",
    title: "Patch It Up",
    pivot: "PATCH",
    categories: [
      { name: "To repair", words: ["MEND", "FIX", "SEW"] },
      { name: "Software words", words: ["UPDATE", "UPGRADE", "DOWNLOAD"] },
      { name: "Where vegetables grow", words: ["PLOT", "SOIL", "BED"] },
      { name: "Pirate things", words: ["PARROT", "HOOK", "COMPASS"] },
    ],
  },
  {
    id: "pick",
    title: "Take Your Pick",
    pivot: "PICK",
    categories: [
      { name: "To decide on one", words: ["OPT", "SELECT", "ELECT"] },
      { name: "Guitar-playing words", words: ["STRUM", "RIFF", "SOLO"] },
      { name: "Digging tools", words: ["SHOVEL", "SPADE", "CHISEL"] },
      { name: "The one you like most", words: ["CHOICE", "BEST", "FAVORITE"] },
    ],
  },
  {
    id: "plant",
    title: "Plant a Seed",
    pivot: "PLANT",
    categories: [
      { name: "Grows in a garden", words: ["FLOWER", "SHRUB", "HERB"] },
      { name: "Where things are made", words: ["FACTORY", "MILL", "WORKSHOP"] },
      { name: "To put in the ground", words: ["SOW", "SEED", "BURY"] },
      { name: "Hidden spies", words: ["SPY", "MOLE", "AGENT"] },
    ],
  },
  {
    id: "plate",
    title: "A Full Plate",
    pivot: "PLATE",
    categories: [
      { name: "On the dinner table", words: ["BOWL", "CUP", "SAUCER"] },
      { name: "On the outside of a car", words: ["BUMPER", "WINDSHIELD", "MIRROR"] },
      { name: "Earthquake words", words: ["FAULT", "TREMOR", "QUAKE"] },
      { name: "A knight's armor", words: ["SHIELD", "HELMET", "VISOR"] },
    ],
  },
  {
    id: "pool",
    title: "Jump in the Pool",
    pivot: "POOL",
    categories: [
      { name: "Water to swim in", words: ["LAKE", "POND", "LAGOON"] },
      { name: "Pub games", words: ["DARTS", "SNOOKER", "BILLIARDS"] },
      { name: "To put together", words: ["COMBINE", "MERGE", "UNITE"] },
      { name: "___ + SIDE", words: ["SEA", "ROAD", "BED"] },
    ],
  },
  {
    id: "port",
    title: "Into Port",
    pivot: "PORT",
    categories: [
      { name: "Where ships stop", words: ["HARBOR", "DOCK", "PIER"] },
      { name: "Computer plugs", words: ["USB", "HDMI", "ETHERNET"] },
      { name: "After-dinner drinks", words: ["SHERRY", "BRANDY", "COGNAC"] },
      { name: "On a ship", words: ["STARBOARD", "STERN", "KEEL"] },
    ],
  },
  {
    id: "range",
    title: "Wide Range",
    pivot: "RANGE",
    categories: [
      { name: "Mountain features", words: ["RIDGE", "CLIFF", "FOOTHILLS"] },
      { name: "Kitchen appliances", words: ["STOVE", "OVEN", "COOKTOP"] },
      { name: "How far something reaches", words: ["SPAN", "SCOPE", "SPREAD"] },
      { name: "Wide open lands", words: ["PRAIRIE", "PASTURE", "PLAIN"] },
    ],
  },
  {
    id: "school",
    title: "Back to School",
    pivot: "SCHOOL",
    categories: [
      { name: "Groups of animals", words: ["POD", "FLOCK", "SWARM"] },
      { name: "Places to study", words: ["ACADEMY", "COLLEGE", "UNIVERSITY"] },
      { name: "To teach", words: ["EDUCATE", "INSTRUCT", "TUTOR"] },
      { name: "A way of thinking", words: ["STYLE", "TRADITION", "MOVEMENT"] },
    ],
  },
  {
    id: "screen",
    title: "On Screen",
    pivot: "SCREEN",
    categories: [
      { name: "Parts of a phone", words: ["DISPLAY", "SPEAKER", "CAMERA"] },
      { name: "To block from view", words: ["SHIELD", "HIDE", "MASK"] },
      { name: "Movie words", words: ["CINEMA", "PREMIERE", "TRAILER"] },
      { name: "To check someone first", words: ["TEST", "INTERVIEW", "VET"] },
    ],
  },
  {
    id: "shade",
    title: "Cool Shade",
    pivot: "SHADE",
    categories: [
      { name: "Blocks the sun", words: ["AWNING", "CANOPY", "PARASOL"] },
      { name: "A touch of color", words: ["TINT", "HUE", "TONE"] },
      { name: "Parts of a lamp", words: ["BULB", "BASE", "CORD"] },
      { name: "Ways to draw", words: ["DOODLE", "SKETCH", "TRACE"] },
    ],
  },
  {
    id: "shell",
    title: "Crack the Shell",
    pivot: "SHELL",
    categories: [
      { name: "Found on a beach", words: ["SAND", "SEAWEED", "DRIFTWOOD"] },
      { name: "Outer coverings", words: ["HUSK", "RIND", "PEEL"] },
      { name: "Fired in battle", words: ["CANNONBALL", "MISSILE", "ROCKET"] },
      { name: "Pasta shapes", words: ["PENNE", "MACARONI", "LASAGNA"] },
    ],
  },
  {
    id: "shot",
    title: "Take the Shot",
    pivot: "SHOT",
    categories: [
      { name: "A single go", words: ["ATTEMPT", "TRY", "CHANCE"] },
      { name: "At the doctor's office", words: ["VACCINE", "INJECTION", "BOOSTER"] },
      { name: "Pictures you take", words: ["PHOTO", "SELFIE", "PORTRAIT"] },
      { name: "Fired from a gun", words: ["BULLET", "PELLET", "ROUND"] },
    ],
  },
  {
    id: "sign",
    title: "Read the Sign",
    pivot: "SIGN",
    categories: [
      { name: "Seen along a road", words: ["BILLBOARD", "MILESTONE", "POSTER"] },
      { name: "To write your name", words: ["AUTOGRAPH", "INITIAL", "ENDORSE"] },
      { name: "What foretells something", words: ["OMEN", "HINT", "CLUE"] },
      { name: "Astrology words", words: ["ZODIAC", "HOROSCOPE", "TAURUS"] },
    ],
  },
  {
    id: "slip",
    title: "Don't Slip",
    pivot: "SLIP",
    categories: [
      { name: "A minor error", words: ["BLUNDER", "LAPSE", "MISTAKE"] },
      { name: "To lose your footing", words: ["SLIDE", "SKID", "GLIDE"] },
      { name: "Small pieces of paper", words: ["RECEIPT", "TICKET", "VOUCHER"] },
      { name: "To move quietly", words: ["SNEAK", "CREEP", "STEAL"] },
    ],
  },
  {
    id: "square",
    title: "Town Square",
    pivot: "SQUARE",
    categories: [
      { name: "Shapes", words: ["CIRCLE", "TRIANGLE", "OVAL"] },
      { name: "Open spaces in town", words: ["PLAZA", "MARKET", "FORUM"] },
      { name: "Not cool (slang)", words: ["NERD", "DORK", "GEEK"] },
      { name: "Math operations", words: ["ROOT", "POWER", "EXPONENT"] },
    ],
  },
  {
    id: "stage",
    title: "Center Stage",
    pivot: "STAGE",
    categories: [
      { name: "Places to perform", words: ["THEATER", "PLATFORM", "PODIUM"] },
      { name: "Where you are in a process", words: ["PHASE", "STEP", "PART"] },
      { name: "To put on an event", words: ["HOST", "ORGANIZE", "ARRANGE"] },
      { name: "Rocket words", words: ["LAUNCHPAD", "THRUSTER", "CAPSULE"] },
    ],
  },
  {
    id: "stand",
    title: "Take a Stand",
    pivot: "STAND",
    categories: [
      { name: "Small shops", words: ["STALL", "KIOSK", "BOOTH"] },
      { name: "To put up with", words: ["BEAR", "TOLERATE", "ENDURE"] },
      { name: "Your opinion", words: ["POSITION", "STANCE", "VIEW"] },
      { name: "Holds things up", words: ["TRIPOD", "EASEL", "RACK"] },
    ],
  },
  {
    id: "stock",
    title: "In Stock",
    pivot: "STOCK",
    categories: [
      { name: "Bought by investors", words: ["SHARE", "BOND", "FUND"] },
      { name: "Soup-making words", words: ["BROTH", "BONES", "SEASONING"] },
      { name: "What a store keeps", words: ["INVENTORY", "SUPPLY", "GOODS"] },
      { name: "Farm-animal words", words: ["CATTLE", "HERD", "FLOCK"] },
    ],
  },
  {
    id: "strike",
    title: "On Strike",
    pivot: "STRIKE",
    categories: [
      { name: "Worker protests", words: ["WALKOUT", "PICKET", "BOYCOTT"] },
      { name: "To land a blow", words: ["HIT", "SMACK", "WHACK"] },
      { name: "Bowling scores", words: ["SPARE", "SPLIT", "TURKEY"] },
      { name: "Umpire's calls", words: ["BALL", "OUT", "FOUL"] },
    ],
  },
  {
    id: "suit",
    title: "A Sharp Suit",
    pivot: "SUIT",
    categories: [
      { name: "Business-wear words", words: ["BLAZER", "SLACKS", "LAPEL"] },
      { name: "Card-game words", words: ["TRUMP", "DEALER", "DISCARD"] },
      { name: "To look right together", words: ["FLATTER", "BECOME", "COMPLEMENT"] },
      { name: "Legal actions", words: ["CASE", "CLAIM", "APPEAL"] },
    ],
  },
  {
    id: "tie",
    title: "It's a Tie",
    pivot: "TIE",
    categories: [
      { name: "Worn around the neck", words: ["SCARF", "NECKLACE", "CHOKER"] },
      { name: "An even result", words: ["DRAW", "DEADLOCK", "STALEMATE"] },
      { name: "To fasten tightly", words: ["KNOT", "BIND", "LASH"] },
      { name: "Bonds between people", words: ["CONNECTION", "KINSHIP", "FRIENDSHIP"] },
    ],
  },
  {
    id: "tip",
    title: "A Helpful Tip",
    pivot: "TIP",
    categories: [
      { name: "Extra money for service", words: ["GRATUITY", "BONUS", "REWARD"] },
      { name: "Helpful words", words: ["ADVICE", "GUIDANCE", "HINT"] },
      { name: "The furthest bit", words: ["POINT", "END", "APEX"] },
      { name: "To knock over", words: ["TOPPLE", "OVERTURN", "UPSET"] },
    ],
  },
  {
    id: "toast",
    title: "Raise a Toast",
    pivot: "TOAST",
    categories: [
      { name: "Breakfast foods", words: ["CEREAL", "PANCAKE", "WAFFLE"] },
      { name: "Said to honor someone", words: ["SPEECH", "CHEERS", "TRIBUTE"] },
      { name: "To cook a bit too long", words: ["BROWN", "CHAR", "SCORCH"] },
      { name: "In big trouble (slang)", words: ["DOOMED", "FINISHED", "RUINED"] },
    ],
  },
  {
    id: "top",
    title: "Spin the Top",
    pivot: "TOP",
    categories: [
      { name: "Classic toys", words: ["YOYO", "KITE", "DOMINO"] },
      { name: "Shirts", words: ["BLOUSE", "TEE", "TUNIC"] },
      { name: "The highest point", words: ["SUMMIT", "PINNACLE", "APEX"] },
      { name: "The very best", words: ["LEADING", "PRIME", "FOREMOST"] },
    ],
  },
  {
    id: "story",
    title: "The Whole Story",
    pivot: "STORY",
    categories: [
      { name: "Told at bedtime", words: ["TALE", "FABLE", "LEGEND"] },
      { name: "Floors of a building", words: ["LEVEL", "BASEMENT", "ATTIC"] },
      { name: "In a newspaper", words: ["REPORT", "ARTICLE", "SCOOP"] },
      { name: "Not quite the truth", words: ["FIB", "LIE", "EXCUSE"] },
    ],
  },
  {
    id: "web",
    title: "Caught in the Web",
    pivot: "WEB",
    categories: [
      { name: "Spider things", words: ["SILK", "VENOM", "FANGS"] },
      { name: "Website words", words: ["SITE", "BROWSER", "DOMAIN"] },
      { name: "A confusing mess", words: ["TANGLE", "MAZE", "SNARL"] },
      { name: "Helps with swimming", words: ["FLIPPER", "PADDLE", "FIN"] },
    ],
  },
  {
    id: "wing",
    title: "Wing It",
    pivot: "WING",
    categories: [
      { name: "Parts of a plane", words: ["COCKPIT", "ENGINE", "RUDDER"] },
      { name: "Parts of a building", words: ["ANNEX", "HALL", "LOBBY"] },
      { name: "Chicken pieces", words: ["DRUMSTICK", "THIGH", "BREAST"] },
      { name: "To make it up as you go", words: ["IMPROVISE", "INVENT", "FREESTYLE"] },
    ],
  },
  {
    id: "yard",
    title: "In the Yard",
    pivot: "YARD",
    categories: [
      { name: "Around the house", words: ["LAWN", "GARDEN", "PATIO"] },
      { name: "Units of length", words: ["METER", "FOOT", "INCH"] },
      { name: "Prison words", words: ["WARDEN", "INMATE", "PAROLE"] },
      { name: "American-football words", words: ["TOUCHDOWN", "FUMBLE", "HUDDLE"] },
    ],
  },
  {
    id: "bow",
    title: "Take a Bow",
    pivot: "BOW",
    categories: [
      { name: "Archery words", words: ["ARROW", "QUIVER", "TARGET"] },
      { name: "On a present", words: ["WRAPPING", "GIFT", "TAG"] },
      { name: "To bend down", words: ["CURTSY", "KNEEL", "STOOP"] },
      { name: "Hair accessories", words: ["BARRETTE", "HEADBAND", "SCRUNCHIE"] },
    ],
  },
  {
    id: "bill",
    title: "Pay the Bill",
    pivot: "BILL",
    categories: [
      { name: "Parts of a bird", words: ["BEAK", "FEATHER", "TALON"] },
      { name: "Money you owe", words: ["INVOICE", "DEBT", "DUES"] },
      { name: "Made in parliament", words: ["LAW", "ACT", "MOTION"] },
      { name: "Cash in your wallet", words: ["BANKNOTE", "BUCK", "TWENTY"] },
    ],
  },
  {
    id: "party",
    title: "Join the Party",
    pivot: "PARTY",
    categories: [
      { name: "Big happy events", words: ["FEAST", "BANQUET", "CELEBRATION"] },
      { name: "Political groups", words: ["FACTION", "COALITION", "ALLIANCE"] },
      { name: "People at a trial", words: ["WITNESS", "DEFENDANT", "LAWYER"] },
      { name: "A group on a mission", words: ["SQUAD", "CREW", "TEAM"] },
    ],
  },
  {
    id: "pump",
    title: "Pump It Up",
    pivot: "PUMP",
    categories: [
      { name: "Moves water", words: ["SIPHON", "HOSE", "TAP"] },
      { name: "Kinds of shoes", words: ["LOAFER", "SNEAKER", "SANDAL"] },
      { name: "At the gym", words: ["FLEX", "BENCH", "DEADLIFT"] },
      { name: "What a heart does", words: ["THROB", "PULSE", "BEAT"] },
    ],
  },
  {
    id: "wheel",
    title: "Turn the Wheel",
    pivot: "WHEEL",
    categories: [
      { name: "Car parts", words: ["TIRE", "AXLE", "HUBCAP"] },
      { name: "Sailing gear", words: ["HELM", "RUDDER", "SAIL"] },
      { name: "To turn in place", words: ["PIVOT", "SWIVEL", "ROTATE"] },
      { name: "Rides at a fair", words: ["COASTER", "CAROUSEL", "SLIDE"] },
    ],
  },
  // --- Merged from the parallel daily batch (word swaps applied to avoid ----
  // --- cross-pool category dupes and 3x spoke reuse) ------------------------
  {
    id: "bridge",
    title: "Build a Bridge",
    pivot: "BRIDGE",
    categories: [
      { name: "Ways to cross a river", words: ["TUNNEL", "FERRY", "RAFT"] },
      { name: "Card games", words: ["POKER", "SOLITAIRE", "RUMMY"] },
      { name: "Parts of a song", words: ["CHORUS", "VERSE", "INTRO"] },
      { name: "On a ship", words: ["HELM", "CABIN", "ANCHOR"] },
    ],
  },
  {
    id: "race",
    title: "Race You",
    pivot: "RACE",
    categories: [
      { name: "Running events", words: ["MARATHON", "HURDLES", "RELAY"] },
      { name: "To move fast", words: ["RUSH", "HURRY", "HUSTLE"] },
      { name: "Horse-track words", words: ["JOCKEY", "SADDLE", "STABLE"] },
      { name: "A scared heart does this", words: ["THUMP", "POUND", "FLUTTER"] },
    ],
  },
  {
    id: "belt",
    title: "Buckle Up",
    pivot: "BELT",
    categories: [
      { name: "Holds up trousers", words: ["BUCKLE", "SUSPENDERS", "WAISTBAND"] },
      { name: "To sing very loudly", words: ["BELLOW", "HOLLER", "ROAR"] },
      { name: "A stretch of country", words: ["ZONE", "REGION", "AREA"] },
      { name: "Car safety features", words: ["AIRBAG", "BRAKE", "MIRROR"] },
    ],
  },
  {
    id: "dress",
    title: "Dress Code",
    pivot: "DRESS",
    categories: [
      { name: "Garments", words: ["TUXEDO", "BLOUSE", "SKIRT"] },
      { name: "To get someone ready", words: ["WEAR", "CLOTHE", "STYLE"] },
      { name: "Salad preparation", words: ["TOSS", "MIX", "GARNISH"] },
      { name: "First-aid actions", words: ["BANDAGE", "TREAT", "WRAP"] },
    ],
  },
  {
    id: "horn",
    title: "Honk Honk",
    pivot: "HORN",
    categories: [
      { name: "Car sounds", words: ["BEEP", "HONK", "TOOT"] },
      { name: "Brass instruments", words: ["TRUMPET", "TUBA", "TROMBONE"] },
      { name: "On animal heads", words: ["ANTLER", "TUSK", "SPIKE"] },
      { name: "Warning signals", words: ["SIREN", "BUOY", "BEACON"] },
    ],
  },
  {
    id: "point",
    title: "Good Point",
    pivot: "POINT",
    categories: [
      { name: "Ways to score", words: ["GOAL", "TOUCHDOWN", "TALLY"] },
      { name: "To show where", words: ["AIM", "GESTURE", "INDICATE"] },
      { name: "On a compass", words: ["NORTH", "EAST", "WEST"] },
      { name: "The main idea", words: ["GIST", "MESSAGE", "MEANING"] },
    ],
  },
  {
    id: "punch",
    title: "Fruit Punch",
    pivot: "PUNCH",
    categories: [
      { name: "Party drinks", words: ["LEMONADE", "CIDER", "SODA"] },
      { name: "Boxing words", words: ["UPPERCUT", "CROSS", "KNOCKOUT"] },
      { name: "Strong flavours", words: ["ZESTY", "TANGY", "BOLD"] },
      { name: "What you do to a button", words: ["CLICK", "PRESS", "PUSH"] },
    ],
  },
  {
    id: "season",
    title: "In Season",
    pivot: "SEASON",
    categories: [
      { name: "Parts of the year", words: ["QUARTER", "TERM", "SEMESTER"] },
      { name: "To add flavour", words: ["SPICE", "PEPPER", "SALT"] },
      { name: "TV-show words", words: ["EPISODE", "SERIES", "FINALE"] },
      { name: "Sports calendar words", words: ["PLAYOFF", "OPENER", "TOURNAMENT"] },
    ],
  },
  {
    id: "space",
    title: "Outer Space",
    pivot: "SPACE",
    categories: [
      { name: "Out among the stars", words: ["ASTRONAUT", "GALAXY", "ROCKET"] },
      { name: "An empty stretch", words: ["ROOM", "GAP", "OPENING"] },
      { name: "Parking words", words: ["LOT", "GARAGE", "VALET"] },
      { name: "Page-layout words", words: ["MARGIN", "INDENT", "TAB"] },
    ],
  },
  {
    id: "staff",
    title: "Staff Meeting",
    pivot: "STAFF",
    categories: [
      { name: "People at work", words: ["PERSONNEL", "WORKFORCE", "EMPLOYEES"] },
      { name: "A wizard's kit", words: ["HAT", "CLOAK", "SPELLBOOK"] },
      { name: "On sheet music", words: ["MEASURE", "TREBLE", "NOTATION"] },
      { name: "Walking sticks", words: ["CANE", "CROOK", "ROD"] },
    ],
  },
  {
    id: "wake",
    title: "Wake Up",
    pivot: "WAKE",
    categories: [
      { name: "Morning things", words: ["ALARM", "SUNRISE", "COFFEE"] },
      { name: "Behind a boat", words: ["RIPPLE", "FOAM", "SPLASH"] },
      { name: "Solemn gatherings", words: ["FUNERAL", "VIGIL", "MEMORIAL"] },
      { name: "What's left afterwards", words: ["AFTERMATH", "FALLOUT", "IMPACT"] },
    ],
  },
  {
    id: "boot",
    title: "Boot Up",
    pivot: "BOOT",
    categories: [
      { name: "Footwear", words: ["SLIPPER", "CLOG", "MOCCASIN"] },
      { name: "To start a computer", words: ["RESTART", "STARTUP", "LOAD"] },
      { name: "British English words", words: ["BONNET", "LORRY", "PETROL"] },
      { name: "To kick someone out", words: ["EJECT", "EXPEL", "OUST"] },
    ],
  },
  {
    id: "current",
    title: "Current Events",
    pivot: "CURRENT",
    categories: [
      { name: "In the news", words: ["HEADLINE", "BULLETIN", "REPORT"] },
      { name: "Electricity words", words: ["VOLTAGE", "AMP", "WATT"] },
      { name: "Moving water", words: ["STREAM", "TIDE", "FLOW"] },
      { name: "Up to date", words: ["MODERN", "LATEST", "RECENT"] },
    ],
  },
  {
    id: "pilot",
    title: "The Pilot",
    pivot: "PILOT",
    categories: [
      { name: "Flies a plane", words: ["CAPTAIN", "AVIATOR", "NAVIGATOR"] },
      { name: "TV words", words: ["SITCOM", "NETWORK", "RERUN"] },
      { name: "An early version to check", words: ["TRIAL", "TEST", "EXPERIMENT"] },
      { name: "Steering things", words: ["WHEEL", "JOYSTICK", "HANDLEBARS"] },
    ],
  },
];
