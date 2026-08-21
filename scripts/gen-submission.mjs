// CrazyGames submission pack: cover art in every aspect the portal asks for,
// plus real gameplay screenshots captured from the built app. Everything lands
// in assets/submission/ — none of it ships inside the game bundle.
//
//   npm run build && npm run preview        # serve docs/ on :4173
//   npm run submission                      # (BASE=… to override the URL)
//   COVERS=1 npm run submission             # just the cover art, no browser play
//
// The written half of the pack (titles, descriptions, tags) lives beside the
// images in assets/submission/SUBMISSION.md.
//
// The board data comes from src/puzzles.ts rather than a copy pasted in here,
// so re-ordering the campaign or rewriting a level can't leave this script
// clicking words that are no longer on the board.
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync } from "node:fs";
import { launchBrowser } from "./browser.mjs";
import { coverWide, coverSquare, coverPortrait, coverSmall } from "./submission-art.mjs";
import { CHAPTERS, LEVELS } from "../src/puzzles.ts";
import { DAILY_PUZZLES } from "../src/dailyPuzzles.ts";
import { DEDUCTION_LEVELS } from "../src/deductionLevels.ts";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "assets", "submission");
mkdirSync(OUT, { recursive: true });
const BASE = process.env.BASE || "http://localhost:4173/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await launchBrowser();
const page = await browser.newPage();
page.on("pageerror", (e) => console.warn("  page error:", e.message));

// --- covers -----------------------------------------------------------------
// One entry per placement the portal (or a store listing) asks for. The layout
// is chosen by shape, not scaled from a single master: at 400×300 a board of
// twelve words is mush, so that size gets the mark and the name instead.
const COVERS = [
  ["cover-1920x1080.png", 1920, 1080, coverWide],
  ["cover-1280x720.png", 1280, 720, coverWide],
  ["cover-800x450.png", 800, 450, coverWide],
  ["cover-1080x1080.png", 1080, 1080, coverSquare],
  ["cover-512x512.png", 512, 512, coverSmall],
  ["thumbnail-400x300.png", 400, 300, coverSmall],
  ["cover-1080x1920.png", 1080, 1920, coverPortrait],
];

for (const [name, w, h, render] of COVERS) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.setContent(render(w, h), { waitUntil: "domcontentloaded" });
  await page.evaluate(() => document.fonts.ready);
  await sleep(120);
  await page.screenshot({ path: join(OUT, name) });
  console.log("wrote", name);
}

// COVERS=1 stops here: the art iterates far faster than the screenshots, which
// need a built app on a running preview server.
if (process.env.COVERS) {
  await browser.close();
  console.log("covers only →", OUT);
  process.exit(0);
}

// --- a save that makes the screenshots look like a real account -------------
// Ten levels in: chapter 1 finished (its key spelled, its boss beaten), chapter
// 2 under way. Enough stars, streak and history for every screen to have
// something to show, and no screen to be showing an empty state.
const CLEARED = LEVELS.slice(0, 10).map((l) => l.id);

// Runs inside the page, so it takes everything it needs as arguments.
function seed(cleared, keys) {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const dayKey = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  localStorage.clear();
  localStorage.setItem("wordgrid:tutorial", "1");
  localStorage.setItem(
    "wordgrid:progress",
    JSON.stringify({
      // Mostly perfect, with a couple of two-star levels so the collection
      // reads as played rather than generated.
      stars: Object.fromEntries(cleared.map((id, i) => [id, i % 4 === 2 ? 2 : 3])),
      streak: 5,
      bestStreak: 7,
      linksGuessed: 9,
      best: {},
      daily: { lastDate: dayKey(y), streak: 4 },
      achievements: ["clear:0", "stars:0", "links:0"],
      hints: 4,
      history: [],
      score: 8400,
      endlessBest: 0,
      pairsBest: 14,
      deductionSolved: ["logic-1", "logic-2"],
      keys,
    }),
  );
}

async function openApp(w, h, { cleared = CLEARED, keys = [0], scale = 1 } = {}) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: scale });
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.evaluate(seed, cleared, keys);
  await page.reload({ waitUntil: "networkidle0" });
  await sleep(900);
}

async function shot(name) {
  await sleep(850); // let the springs settle
  // Clicking a control near the bottom of a tall screen scrolls it into view,
  // which would otherwise crop the masthead out of the picture.
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(220);
  await page.screenshot({ path: join(OUT, name) });
  console.log("wrote", name);
}

const byText = async (text) => {
  const [el] = await page.$$(`xpath/. //button[contains(., ${JSON.stringify(text)})]`);
  if (!el) throw new Error(`no button containing ${JSON.stringify(text)}`);
  return el;
};
const clickText = async (text, wait = 800) => {
  (await byText(text)).click();
  await sleep(wait);
};
const clickWord = async (word) => {
  await page.waitForSelector(`button[aria-label="${word}"]`, { visible: true, timeout: 8000 });
  await page.click(`button[aria-label="${word}"]`);
  await sleep(160);
};
const submitGroup = async () => {
  await clickText("Submit group", 1200);
};

/** Tap out the pivot on the finale's letter bank, one unused tile per letter. */
async function spellLink(word) {
  for (const letter of word.split("")) {
    const [el] = await page.$$(`xpath/. //button[@aria-label=${JSON.stringify(`Letter ${letter}`)}]`);
    if (!el) throw new Error(`no free letter tile for ${letter}`);
    await el.click();
    await sleep(220);
  }
}

/**
 * Colour `count` of the open Logic Grid's twelve tiles the way the puzzle's own
 * solution does, so the shot shows real deduction in progress rather than a
 * blank grid. The level is read off the header, not assumed.
 */
async function paintLogicGrid(count) {
  const header = await page.$eval("body", (b) => b.innerText);
  const n = Number(/Puzzle\s+(\d+)\s*\//.exec(header)?.[1] ?? 1);
  const solution = DEDUCTION_LEVELS[n - 1].solution;
  const brushes = await page.$$('button[aria-label^="Group "]');
  // Paint group by group: a brush is picked once and then used, which is how
  // the grid is actually played.
  for (let g = 0; g < brushes.length; g++) {
    const cells = solution.flatMap((v, i) => (v === g && i < count ? [i] : []));
    if (!cells.length) continue;
    await brushes[g].click();
    await sleep(180);
    for (const i of cells) {
      const tiles = await page.$$('button[aria-label^="Tile"]');
      await tiles[i].click();
      await sleep(160);
    }
  }
}

/**
 * Play the open Pairs board until `groups` groups are matched. The deck is
 * shuffled fresh every time, so this reads the twelve words off the cards, works
 * out which level's board it is dealing with, and only then starts matching —
 * the same information a player builds up by flipping.
 */
async function playPairs(groups) {
  // The cards are the only buttons with the card aspect ratio, and they keep
  // their DOM position for the whole board — so an index is a place on the table.
  const DECK = 'button[class*="aspect-[1.15/1]"]';
  const labels = () => page.$$eval(DECK, (bs) => bs.map((x) => x.getAttribute("aria-label")));
  const click = async (i) => {
    const deck = await page.$$(DECK);
    await deck[i].click();
  };

  // Turn every card over once, two at a time, remembering what was where.
  const seen = new Array(12).fill(null);
  for (let i = 0; i < 12; i += 2) {
    await click(i);
    await sleep(220);
    await click(i + 1);
    await sleep(260);
    const now = await labels();
    now.forEach((w, k) => {
      if (w && w !== "Face-down card") seen[k] = w;
    });
    await sleep(1200); // they turn back
  }
  if (seen.some((w) => !w)) throw new Error("did not read the whole Pairs deck");

  // Which board is this? The twelve spokes identify exactly one puzzle, and
  // Pairs deals from the campaign and the daily pool alike.
  const set = new Set(seen);
  const level = [...LEVELS, ...DAILY_PUZZLES].find((l) => {
    const spokes = l.categories.flatMap((c) => c.words.map((w) => w.toUpperCase()));
    return spokes.length === set.size && spokes.every((w) => set.has(w));
  });
  if (!level) throw new Error(`Pairs board matched no puzzle: ${seen.join(",")}`);

  // Some groups fall out of the reveal sweep by luck, so this counts what is
  // already face up rather than assuming the board is untouched.
  const faceUp = async () => (await labels()).filter((w) => w !== "Face-down card").length;
  for (const cat of level.categories) {
    if ((await faceUp()) >= groups * 2) break;
    const words = cat.words.map((w) => w.toUpperCase());
    const down = await labels();
    const free = seen.flatMap((w, i) => (words.includes(w) && down[i] === "Face-down card" ? [i] : []));
    if (free.length < 2) continue; // this one is already matched
    await click(free[0]);
    await sleep(240);
    await click(free[1]);
    await sleep(900);
  }
}

// --- landscape set (1280×720 is CrazyGames' most common desktop embed) ------
await openApp(1280, 720);
await shot("screen-1-home-1280x720.png");

await clickText("Browse all");
await shot("screen-2-collection-1280x720.png");

// The up-next card plays level 11 — the first board this save hasn't solved.
const level = LEVELS[10];
await clickText("Play →", 1100);

// One group solved and the next three picked out: a board caught mid-move,
// with Submit live. The extra wait lets the solve confetti land first — it
// photographs as speckle, not celebration.
for (const w of level.categories[0].words) await clickWord(w);
await submitGroup();
await sleep(2600);
for (const w of level.categories[1].words) await clickWord(w);
await shot("screen-3-board-1280x720.png");

// Finish the rest — the fourth group auto-solves — and the finale slides in.
await submitGroup();
for (const w of level.categories[2].words) await clickWord(w);
await submitGroup();
await sleep(1800);
await spellLink(level.pivot.slice(0, Math.max(1, level.pivot.length - 2)));
await shot("screen-4-finale-1280x720.png");

await spellLink(level.pivot.slice(Math.max(1, level.pivot.length - 2)));
await sleep(2200);
await shot("screen-5-win-1280x720.png");

// --- a boss, briefed and then fought ---------------------------------------
// The emoji boss (chapter 3) is the most legible twist in a still: a board with
// no words on it at all. Seeded one level short of it, with the chapter keys
// spelled, so the door is open and the briefing hasn't been read yet.
const bossIndex = CHAPTERS[2].boss;
const upToBoss = LEVELS.slice(0, bossIndex).map((l) => l.id);
await openApp(1280, 720, { cleared: upToBoss, keys: [0, 1, 2] });
await clickText("Browse all");
await clickText("Enter →", 1200);
await shot("screen-6-boss-briefing-1280x720.png");
await clickText("Got it", 1200);
await shot("screen-7-boss-board-1280x720.png");

// --- the other two modes ----------------------------------------------------
// Both are shown part-played. An untouched Logic Grid is twelve blank tiles and
// an untouched Pairs board is twelve identical card backs — true to the game,
// and useless as a picture of it.
await openApp(1280, 720);
await clickText("Logic", 1400);
await paintLogicGrid(8);
await shot("screen-8-logic-1280x720.png");

await openApp(1280, 720);
await clickText("Pairs", 1400);
await playPairs(3);
await shot("screen-9-pairs-1280x720.png");

// --- portrait set (phones, and the portal's mobile placements) -------------
// A phone-sized viewport at 2× rather than a 720-wide desktop window: the app
// lays out for the CSS width, so 720 CSS pixels would photograph a tablet.
const PHONE = { css: [390, 844], scale: 2 }; // → 780×1688 files
await openApp(...PHONE.css, { scale: PHONE.scale });
await shot("screen-10-home-780x1688.png");

await clickText("Browse all");
await clickText("Play →", 1100);
for (const w of level.categories[0].words) await clickWord(w);
await submitGroup();
await sleep(2600);
for (const w of level.categories[1].words) await clickWord(w);
await shot("screen-11-board-780x1688.png");

await submitGroup();
for (const w of level.categories[2].words) await clickWord(w);
await submitGroup();
await sleep(1800);
await spellLink(level.pivot.slice(0, Math.max(1, level.pivot.length - 2)));
await shot("screen-12-finale-780x1688.png");

await browser.close();
console.log("done →", OUT);
