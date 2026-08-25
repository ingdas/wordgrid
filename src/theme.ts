// The four group colours. Lives on its own so nothing else has to import the
// game screen to know what colour a group is.
export const CATEGORY_THEMES = [
  { grad: "from-[#f2b544] to-[#eda820]", ink: "#3b2703", emoji: "🟨", shape: "●", tint: "#a06e07" },
  { grad: "from-[#7cc0e8] to-[#5eb0e0]", ink: "#0a344a", emoji: "🟦", shape: "▲", tint: "#186a9e" },
  { grad: "from-[#c5a3e8] to-[#b48fd9]", ink: "#2f1547", emoji: "🟪", shape: "■", tint: "#7b47ad" },
  { grad: "from-[#8fd6ab] to-[#6cc793]", ink: "#093b22", emoji: "🟩", shape: "◆", tint: "#177a48" },
];

/**
 * One flat print ink per chapter, for the level map.
 *
 * The map used to be a single wall of identical gold tiles — one per level — so
 * every chapter, every clear and every unlock looked exactly alike. Giving each
 * chapter its own spot colour (still flat inks on cream, in keeping with the
 * press identity) makes the list navigable by colour and makes finishing a
 * chapter visibly change the page.
 *
 * `fill` is a tile face (always dark enough for ink text, light enough for the
 * offset shadow to read), `deep` is the same ink at text contrast on white, and
 * `wash` is the tint behind a chapter header.
 */
export const CHAPTER_INKS = [
  { fill: "#f0b23c", deep: "#8a5c00", wash: "#fbeed2" }, // gold
  { fill: "#6cb4e2", deep: "#166b9e", wash: "#dcedf9" }, // sky
  { fill: "#b48fd9", deep: "#6f3fa3", wash: "#ece2f7" }, // violet
  { fill: "#6cc793", deep: "#177a48", wash: "#dcf1e5" }, // mint
  { fill: "#ef9350", deep: "#a1490b", wash: "#fce4d2" }, // orange
  { fill: "#57aaa5", deep: "#12615d", wash: "#d8ecea" }, // teal
  { fill: "#e084a9", deep: "#a33a63", wash: "#fadfe8" }, // rose
  { fill: "#7f95dc", deep: "#31489f", wash: "#e0e5f8" }, // indigo
  { fill: "#a9c65a", deep: "#5b7211", wash: "#edf3d6" }, // lime
  { fill: "#93a2b3", deep: "#455568", wash: "#e3e8ee" }, // slate
  { fill: "#a879b8", deep: "#6a2f7c", wash: "#eddff2" }, // plum
  { fill: "#e2705a", deep: "#a93318", wash: "#fadcd5" }, // clay — the finale
];

/**
 * Each chapter also stains the page it's played on. `paper` is the cream
 * background pulled a few percent toward the chapter's wash, and `glow` is the
 * ink at low alpha for the backdrop's top light. Derived rather than authored
 * so a new chapter colour can't forget to bring them, and kept deliberately
 * faint — the identity is still warm newsprint, not a dozen different skins.
 */
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a: string, b: string, amount: number) => {
  const [ar, ag, ab] = hex(a);
  const [br, bg, bb] = hex(b);
  const ch = (x: number, y: number) => Math.round(x * amount + y * (1 - amount));
  return `#${[ch(ar, br), ch(ag, bg), ch(ab, bb)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};
const PAPER = "#faf5ea";

export const CHAPTER_PAGES = CHAPTER_INKS.map((c) => {
  const [r, g, b] = hex(c.fill);
  return { paper: mix(c.wash, PAPER, 0.5), glow: `rgba(${r}, ${g}, ${b}, 0.16)` };
});

/** The page stain for a chapter: background colour plus its top-light glow. */
export const chapterPage = (i: number) => CHAPTER_PAGES[i % CHAPTER_PAGES.length];

export type ChapterInk = (typeof CHAPTER_INKS)[number];

export const chapterInk = (i: number): ChapterInk => CHAPTER_INKS[i % CHAPTER_INKS.length];
