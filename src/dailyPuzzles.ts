// The dedicated Daily Challenge pool. These puzzles never appear in the
// campaign, so the daily can't spoil a level (and vice versa). Same structure
// as the campaign: pivot + 4 categories × 3 spokes. Ids and pivots must not
// collide with src/puzzles.ts — scripts/validate.mts enforces this.
//
// Authoring rules (see BACKLOG.md): common words only, no duplicate words
// within a puzzle, the pivot never appears as (or inside) a spoke, and no two
// categories a solver could reasonably swap.

import type { RawPuzzle } from "./puzzles";

export const DAILY_PUZZLES: RawPuzzle[] = [
  {
    id: "key",
    title: "Key Change",
    pivot: "KEY",
    categories: [
      { name: "Ways to get in", words: ["CODE", "PASSWORD", "BADGE"] },
      { name: "On a computer keyboard", words: ["ENTER", "SHIFT", "ESCAPE"] },
      { name: "Most important", words: ["MAIN", "CENTRAL", "VITAL"] },
      { name: "Music words", words: ["TEMPO", "MELODY", "RHYTHM"] },
    ],
  },
  {
    id: "board",
    title: "On Board",
    pivot: "BOARD",
    categories: [
      { name: "Long flat wood", words: ["PLANK", "PANEL", "TIMBER"] },
      { name: "Company leaders", words: ["DIRECTOR", "CHAIRMAN", "TRUSTEE"] },
      { name: "Classic games", words: ["CHESS", "CHECKERS", "DOMINOES"] },
      { name: "To get on a bus", words: ["HOP", "CLIMB", "STEP"] },
    ],
  },
  {
    id: "watch",
    title: "Watch This",
    pivot: "WATCH",
    categories: [
      { name: "Tells the time", words: ["CLOCK", "TIMER", "SUNDIAL"] },
      { name: "To look at", words: ["SEE", "VIEW", "LOOK"] },
      { name: "To guard a place", words: ["GUARD", "PATROL", "PROTECT"] },
      { name: "Worn on the wrist", words: ["BRACELET", "WRISTBAND", "CUFF"] },
    ],
  },
  {
    id: "train",
    title: "All Aboard",
    pivot: "TRAIN",
    categories: [
      { name: "Rides on rails", words: ["SUBWAY", "TRAM", "MONORAIL"] },
      { name: "To practice a skill", words: ["PRACTICE", "EXERCISE", "PREPARE"] },
      { name: "Worn by a bride", words: ["VEIL", "GOWN", "TIARA"] },
      { name: "A connected line", words: ["CHAIN", "LINE", "CONVOY"] },
    ],
  },
  {
    id: "band",
    title: "Join the Band",
    pivot: "BAND",
    categories: [
      { name: "Plays music together", words: ["ORCHESTRA", "CHOIR", "QUARTET"] },
      { name: "Around your wrist", words: ["STRAP", "BRACELET", "CUFF"] },
      { name: "A group of people", words: ["CREW", "GANG", "TROOP"] },
      { name: "A strip of material", words: ["STRIP", "RIBBON", "SASH"] },
    ],
  },
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
    id: "box",
    title: "Box It Up",
    pivot: "BOX",
    categories: [
      { name: "Containers", words: ["CARTON", "BIN", "CASE"] },
      { name: "To fight with fists", words: ["SPAR", "FIGHT", "BRAWL"] },
      { name: "At the theatre", words: ["STAGE", "SEAT", "CURTAIN"] },
      { name: "Solid shapes", words: ["CUBE", "PRISM", "PYRAMID"] },
    ],
  },
  {
    id: "crown",
    title: "The Crown",
    pivot: "CROWN",
    categories: [
      { name: "Royal treasures", words: ["ROBE", "JEWELS", "SCEPTER"] },
      { name: "At the dentist", words: ["FILLING", "BRACES", "MOLAR"] },
      { name: "The very top", words: ["PEAK", "SUMMIT", "TOP"] },
      { name: "Champions win them", words: ["TROPHY", "TITLE", "MEDAL"] },
    ],
  },
  {
    id: "file",
    title: "On File",
    pivot: "FILE",
    categories: [
      { name: "Office papers", words: ["FOLDER", "DOCUMENT", "RECORD"] },
      { name: "Toolbox tools", words: ["CHISEL", "PLIERS", "WRENCH"] },
      { name: "To smooth or shine", words: ["SAND", "BUFF", "POLISH"] },
      { name: "A line of people", words: ["QUEUE", "ROW", "LINE"] },
    ],
  },
  {
    id: "pool",
    title: "Pool Party",
    pivot: "POOL",
    categories: [
      { name: "Places to swim", words: ["SEA", "LAKE", "RIVER"] },
      { name: "Pub games", words: ["DARTS", "SNOOKER", "BILLIARDS"] },
      { name: "To combine together", words: ["MERGE", "COMBINE", "SHARE"] },
      { name: "A puddle of liquid", words: ["PUDDLE", "SPILL", "SLICK"] },
    ],
  },
  {
    id: "race",
    title: "Race You",
    pivot: "RACE",
    categories: [
      { name: "Running events", words: ["MARATHON", "SPRINT", "RELAY"] },
      { name: "To hurry", words: ["RUSH", "HURRY", "HUSTLE"] },
      { name: "Horse-track words", words: ["JOCKEY", "SADDLE", "STABLE"] },
      { name: "A scared heart does this", words: ["THUMP", "HAMMER", "FLUTTER"] },
    ],
  },
  {
    id: "shot",
    title: "Take the Shot",
    pivot: "SHOT",
    categories: [
      { name: "At the doctor", words: ["VACCINE", "NEEDLE", "SYRINGE"] },
      { name: "Basketball moves", words: ["DUNK", "LAYUP", "REBOUND"] },
      { name: "Photography words", words: ["SELFIE", "CLOSEUP", "PORTRAIT"] },
      { name: "An attempt", words: ["TRY", "ATTEMPT", "GO"] },
    ],
  },
  {
    id: "tip",
    title: "Top Tips",
    pivot: "TIP",
    categories: [
      { name: "Helpful advice", words: ["HINT", "POINTER", "CLUE"] },
      { name: "Extra money for service", words: ["GRATUITY", "BONUS", "REWARD"] },
      { name: "The pointed end", words: ["END", "EDGE", "PEAK"] },
      { name: "To lean over", words: ["LEAN", "TILT", "TOPPLE"] },
    ],
  },
  {
    id: "toast",
    title: "Morning Toast",
    pivot: "TOAST",
    categories: [
      { name: "Breakfast foods", words: ["CEREAL", "PANCAKE", "WAFFLE"] },
      { name: "To warm up", words: ["WARM", "HEAT", "GRILL"] },
      { name: "Raise a glass to someone", words: ["CHEERS", "TRIBUTE", "SALUTE"] },
      { name: "In big trouble (slang)", words: ["DOOMED", "FINISHED", "SUNK"] },
    ],
  },
  {
    id: "wing",
    title: "On the Wing",
    pivot: "WING",
    categories: [
      { name: "On a bird", words: ["BEAK", "FEATHER", "CLAW"] },
      { name: "Parts of a plane", words: ["COCKPIT", "ENGINE", "RUDDER"] },
      { name: "Hospital sections", words: ["WARD", "UNIT", "ANNEX"] },
      { name: "To make it up as you go", words: ["IMPROVISE", "INVENT", "FREESTYLE"] },
    ],
  },
  {
    id: "yard",
    title: "Yard Work",
    pivot: "YARD",
    categories: [
      { name: "Outside the house", words: ["LAWN", "FENCE", "DRIVEWAY"] },
      { name: "Units of length", words: ["FOOT", "INCH", "MILE"] },
      { name: "Railway places", words: ["DEPOT", "STATION", "PLATFORM"] },
      { name: "American football words", words: ["TOUCHDOWN", "QUARTERBACK", "HELMET"] },
    ],
  },
  {
    id: "belt",
    title: "Buckle Up",
    pivot: "BELT",
    categories: [
      { name: "Holds up trousers", words: ["BUCKLE", "SUSPENDERS", "WAISTBAND"] },
      { name: "To sing very loudly", words: ["BELLOW", "HOLLER", "ROAR"] },
      { name: "Zones and regions", words: ["ZONE", "REGION", "AREA"] },
      { name: "Car safety features", words: ["AIRBAG", "BRAKE", "MIRROR"] },
    ],
  },
  {
    id: "charge",
    title: "Take Charge",
    pivot: "CHARGE",
    categories: [
      { name: "Powers your phone", words: ["PLUG", "CABLE", "ADAPTER"] },
      { name: "To rush forward", words: ["ATTACK", "STAMPEDE", "STORM"] },
      { name: "A price to pay", words: ["FEE", "COST", "FARE"] },
      { name: "Courtroom words", words: ["VERDICT", "TRIAL", "APPEAL"] },
    ],
  },
  {
    id: "shade",
    title: "Cool Shade",
    pivot: "SHADE",
    categories: [
      { name: "Blocks the sun", words: ["UMBRELLA", "AWNING", "VISOR"] },
      { name: "A colour variation", words: ["TINT", "HUE", "TONE"] },
      { name: "Window covers", words: ["BLINDS", "SHUTTER", "DRAPES"] },
      { name: "A tiny amount", words: ["TAD", "TOUCH", "HAIR"] },
    ],
  },
  {
    id: "draft",
    title: "First Draft",
    pivot: "DRAFT",
    categories: [
      { name: "An early version", words: ["SKETCH", "OUTLINE", "PROTOTYPE"] },
      { name: "Cold indoor air", words: ["BREEZE", "CHILL", "GUST"] },
      { name: "Beer words", words: ["BREW", "LAGER", "PINT"] },
      { name: "Sports recruiting", words: ["PICK", "ROOKIE", "SCOUT"] },
    ],
  },
  {
    id: "dress",
    title: "Dress Code",
    pivot: "DRESS",
    categories: [
      { name: "Clothes", words: ["TUXEDO", "BLOUSE", "SKIRT"] },
      { name: "To put on clothes", words: ["WEAR", "STYLE", "OUTFIT"] },
      { name: "Salad preparation", words: ["TOSS", "MIX", "GARNISH"] },
      { name: "First-aid actions", words: ["BANDAGE", "TREAT", "WRAP"] },
    ],
  },
  {
    id: "drill",
    title: "Drill Team",
    pivot: "DRILL",
    categories: [
      { name: "Power tools", words: ["SAW", "SANDER", "GRINDER"] },
      { name: "A practice routine", words: ["ROUTINE", "REHEARSAL", "WORKOUT"] },
      { name: "To make holes", words: ["BORE", "PIERCE", "PUNCTURE"] },
      { name: "Army words", words: ["SERGEANT", "BARRACKS", "PLATOON"] },
    ],
  },
  {
    id: "duck",
    title: "Lucky Duck",
    pivot: "DUCK",
    categories: [
      { name: "Pond birds", words: ["SWAN", "GOOSE", "HERON"] },
      { name: "To bend down low", words: ["CROUCH", "STOOP", "SQUAT"] },
      { name: "Chinese restaurant menu", words: ["NOODLES", "DUMPLINGS", "RICE"] },
      { name: "Cartoon animals", words: ["BUNNY", "MOUSE", "COYOTE"] },
    ],
  },
  {
    id: "fall",
    title: "The Big Fall",
    pivot: "FALL",
    categories: [
      { name: "Autumn things", words: ["LEAVES", "PUMPKIN", "HARVEST"] },
      { name: "To trip over", words: ["TRIP", "STUMBLE", "TUMBLE"] },
      { name: "Prices going down", words: ["DECLINE", "DIP", "SLIDE"] },
      { name: "Rushing water", words: ["CASCADE", "RAPIDS", "TORRENT"] },
    ],
  },
  {
    id: "frame",
    title: "Picture Frame",
    pivot: "FRAME",
    categories: [
      { name: "Art gallery things", words: ["CANVAS", "EASEL", "GALLERY"] },
      { name: "Your skeleton", words: ["BONES", "RIBS", "SPINE"] },
      { name: "To pin the blame", words: ["ACCUSE", "TRAP", "BLAME"] },
      { name: "Parts of eyeglasses", words: ["LENS", "ARM", "HINGE"] },
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
      { name: "Warnings at sea", words: ["SIREN", "BUOY", "BEACON"] },
    ],
  },
  {
    id: "iron",
    title: "Iron Will",
    pivot: "IRON",
    categories: [
      { name: "Housework", words: ["LAUNDRY", "VACUUM", "DUSTING"] },
      { name: "Metals", words: ["STEEL", "COPPER", "TIN"] },
      { name: "Golf words", words: ["CADDIE", "FAIRWAY", "BIRDIE"] },
      { name: "Very strong", words: ["STURDY", "TOUGH", "SOLID"] },
    ],
  },
  {
    id: "jack",
    title: "Jackpot",
    pivot: "JACK",
    categories: [
      { name: "In a card deck", words: ["QUEEN", "KING", "JOKER"] },
      { name: "Changing a tire", words: ["SPARE", "TIRE", "LEVER"] },
      { name: "Plug it in", words: ["SOCKET", "OUTLET", "PORT"] },
      { name: "Halloween things", words: ["LANTERN", "COSTUME", "GHOST"] },
    ],
  },
  {
    id: "lap",
    title: "Victory Lap",
    pivot: "LAP",
    categories: [
      { name: "One time around", words: ["LOOP", "ROUND", "CIRCUIT"] },
      { name: "Cats sit on them", words: ["KNEES", "CUSHION", "BLANKET"] },
      { name: "Ways to drink", words: ["SLURP", "LICK", "GULP"] },
      { name: "Swimming-pool things", words: ["GOGGLES", "LANE", "FLOAT"] },
    ],
  },
  {
    id: "model",
    title: "Role Model",
    pivot: "MODEL",
    categories: [
      { name: "Fashion-show words", words: ["RUNWAY", "POSE", "CATWALK"] },
      { name: "A small copy", words: ["REPLICA", "MINIATURE", "FIGURINE"] },
      { name: "An example to follow", words: ["EXAMPLE", "IDEAL", "STANDARD"] },
      { name: "Car showroom words", words: ["SEDAN", "HYBRID", "EDITION"] },
    ],
  },
  {
    id: "march",
    title: "Quick March",
    pivot: "MARCH",
    categories: [
      { name: "Months", words: ["APRIL", "JUNE", "AUGUST"] },
      { name: "To walk like soldiers", words: ["STRIDE", "PARADE", "TROOP"] },
      { name: "Protest events", words: ["RALLY", "PROTEST", "DEMO"] },
      { name: "Marching-band sounds", words: ["DRUM", "BUGLE", "WHISTLE"] },
    ],
  },
  {
    id: "screen",
    title: "Screen Time",
    pivot: "SCREEN",
    categories: [
      { name: "Devices with displays", words: ["TELEVISION", "LAPTOP", "TABLET"] },
      { name: "To check carefully", words: ["FILTER", "VET", "SCAN"] },
      { name: "Keeps bugs out", words: ["MESH", "NET", "GAUZE"] },
      { name: "Movie words", words: ["CINEMA", "PREMIERE", "TRAILER"] },
    ],
  },
  {
    id: "patch",
    title: "Patch It Up",
    pivot: "PATCH",
    categories: [
      { name: "To repair clothes", words: ["SEW", "MEND", "STITCH"] },
      { name: "Software fixes", words: ["UPDATE", "FIX", "UPGRADE"] },
      { name: "Vegetable garden spots", words: ["GARDEN", "BED", "FARM"] },
      { name: "Pirate things", words: ["PARROT", "HOOK", "TREASURE"] },
    ],
  },
  {
    id: "plant",
    title: "Plant a Seed",
    pivot: "PLANT",
    categories: [
      { name: "Grows in soil", words: ["FERN", "CACTUS", "IVY"] },
      { name: "Factories", words: ["FACTORY", "MILL", "REFINERY"] },
      { name: "To place secretly", words: ["BURY", "HIDE", "STASH"] },
      { name: "Undercover people", words: ["SPY", "MOLE", "AGENT"] },
    ],
  },
  {
    id: "point",
    title: "Good Point",
    pivot: "POINT",
    categories: [
      { name: "Ways to score", words: ["GOAL", "BASKET", "TALLY"] },
      { name: "To aim a finger", words: ["AIM", "GESTURE", "INDICATE"] },
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
      { name: "Boxing moves", words: ["HOOK", "UPPERCUT", "CROSS"] },
      { name: "Strong flavours", words: ["ZESTY", "TANGY", "BOLD"] },
      { name: "To press a button", words: ["TAP", "CLICK", "PRESS"] },
    ],
  },
  {
    id: "range",
    title: "Wide Range",
    pivot: "RANGE",
    categories: [
      { name: "Mountain chains", words: ["ANDES", "ALPS", "ROCKIES"] },
      { name: "Kitchen appliances", words: ["OVEN", "STOVE", "MICROWAVE"] },
      { name: "A variety", words: ["VARIETY", "SELECTION", "ASSORTMENT"] },
      { name: "Target practice", words: ["TARGET", "ARCHERY", "BULLSEYE"] },
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
    id: "shell",
    title: "Seashells",
    pivot: "SHELL",
    categories: [
      { name: "On the beach", words: ["DUNE", "SEAWEED", "DRIFTWOOD"] },
      { name: "Parts of an egg", words: ["YOLK", "WHITE", "MEMBRANE"] },
      { name: "Tough outer layers", words: ["HUSK", "RIND", "PEEL"] },
      { name: "Fired by artillery", words: ["AMMO", "GRENADE", "MISSILE"] },
    ],
  },
  {
    id: "sign",
    title: "Sign Here",
    pivot: "SIGN",
    categories: [
      { name: "Seen along the road", words: ["BILLBOARD", "MILESTONE", "DETOUR"] },
      { name: "To write your name", words: ["AUTOGRAPH", "INITIAL", "ENDORSE"] },
      { name: "Zodiac words", words: ["LEO", "GEMINI", "TAURUS"] },
      { name: "A warning of what's coming", words: ["OMEN", "WARNING", "SYMPTOM"] },
    ],
  },
  {
    id: "space",
    title: "Space Out",
    pivot: "SPACE",
    categories: [
      { name: "Out among the stars", words: ["ASTRONAUT", "GALAXY", "ROCKET"] },
      { name: "Room to move", words: ["ROOM", "GAP", "OPENING"] },
      { name: "Parking words", words: ["LOT", "METER", "VALET"] },
      { name: "Page-layout words", words: ["MARGIN", "INDENT", "TAB"] },
    ],
  },
  {
    id: "square",
    title: "Town Square",
    pivot: "SQUARE",
    categories: [
      { name: "City gathering spots", words: ["PLAZA", "MARKET", "FOUNTAIN"] },
      { name: "Flat shapes", words: ["CIRCLE", "TRIANGLE", "HEXAGON"] },
      { name: "Math class words", words: ["ROOT", "EQUATION", "EXPONENT"] },
      { name: "Fair and honest", words: ["FAIR", "HONEST", "EVEN"] },
    ],
  },
  {
    id: "staff",
    title: "Staff Meeting",
    pivot: "STAFF",
    categories: [
      { name: "People at work", words: ["TEAM", "CREW", "PERSONNEL"] },
      { name: "A wizard's kit", words: ["WAND", "CLOAK", "SPELLBOOK"] },
      { name: "On sheet music", words: ["MEASURE", "TREBLE", "CHORD"] },
      { name: "Walking sticks", words: ["CANE", "CROOK", "ROD"] },
    ],
  },
  {
    id: "tie",
    title: "It's a Tie",
    pivot: "TIE",
    categories: [
      { name: "Office dress-up", words: ["BLAZER", "CUFFLINKS", "LOAFERS"] },
      { name: "An even score", words: ["DRAW", "DEADLOCK", "STALEMATE"] },
      { name: "To fasten", words: ["KNOT", "FASTEN", "SECURE"] },
      { name: "Connections between people", words: ["BOND", "LINK", "CONNECTION"] },
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
      { name: "Footwear", words: ["SANDAL", "SNEAKER", "SLIPPER"] },
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
      { name: "A trial run", words: ["TRIAL", "TEST", "EXPERIMENT"] },
      { name: "Steering a vehicle", words: ["WHEEL", "RUDDER", "JOYSTICK"] },
    ],
  },
];
