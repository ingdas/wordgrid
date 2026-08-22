// Cover art for the CrazyGames submission, rendered from HTML by
// scripts/gen-submission.mjs. Kept apart from the driver because these are
// layouts, not automation.
//
// THE PICTURE. Four words, one taken from each of a real board's four groups,
// all pointing at the masked link they share. A viewer can solve it before
// they click — which is exactly the hit the game sells — and it is an honest
// diagram of the mechanic rather than a claim about it. Everything else is cut:
// no tagline, no feature badge, no marketing sentence. Only the game's own
// characters appear on the canvas, plus the title.
//
// THE TITLE is set as a masthead over the picture rather than tucked into a
// corner: at the size a portal actually renders a thumbnail (~300px wide) it
// still has to be read at a glance.
//
// The look is the game's own "Puzzle Press" identity (src/index.css): cream
// paper, ink type and rules, flat print colours, chunky offset shadows and a
// stamp-red accent.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { LEVELS } from "../src/puzzles.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// --- theme tokens, in sync with src/index.css and src/theme.ts --------------
export const T = {
  paper: "#faf5ea",
  cream: "#efe7d3",
  ink: "#26221a",
  inkSoft: "#6f6757",
  press: "#d9482b",
  pressDeep: "#a93318",
  gold: "#eda820",
};

/** The four category colours a solved group is printed in. */
const CAT = [
  { from: "#f2b544", to: "#eda820", ink: "#3b2703" }, // gold
  { from: "#7cc0e8", to: "#5eb0e0", ink: "#0a344a" }, // sky
  { from: "#c5a3e8", to: "#b48fd9", ink: "#2f1547" }, // violet
  { from: "#8fd6ab", to: "#6cc793", ink: "#093b22" }, // mint
];

// --- the riddle -------------------------------------------------------------
// Level 20's board (BOLT), one spoke per group: hardware, running off,
// lightning, shutting a door. Four unrelated worlds in four short words, which
// is what makes the link land — and short enough to stay legible in the 400×300
// slot. The words are named here rather than derived because they were chosen
// by eye, but they are checked against the puzzle so a rewrite of that board
// can't leave the cover quietly lying about the game.
const PUZZLE_ID = "bolt";
const WORDS = ["NUT", "DASH", "FLASH", "LOCK"];

const RIDDLE = (() => {
  const level = LEVELS.find((l) => l.id === PUZZLE_ID);
  if (!level) throw new Error(`cover art: no puzzle "${PUZZLE_ID}" in src/puzzles.ts`);
  // One word per category, in category order, or the picture stops being true.
  WORDS.forEach((word, i) => {
    const spokes = level.categories[i].words.map((w) => w.toUpperCase());
    if (!spokes.includes(word)) {
      throw new Error(
        `cover art: "${word}" is no longer in group ${i + 1} of "${PUZZLE_ID}" (${spokes.join(", ")})`,
      );
    }
  });
  return { words: WORDS, marks: level.pivot.length };
})();

// Fonts are embedded so a cover renders identically on any machine (and with
// no network): the same two faces the game ships.
const font = (file) => readFileSync(join(ROOT, "node_modules", file)).toString("base64");
const FACES = `
@font-face{font-family:'Fraunces';font-weight:100 900;font-display:block;
  src:url(data:font/woff2;base64,${font("@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2")}) format('woff2');}
@font-face{font-family:'InterV';font-weight:100 900;font-display:block;
  src:url(data:font/woff2;base64,${font("@fontsource-variable/inter/files/inter-latin-wght-normal.woff2")}) format('woff2');}`;

const SERIF = "'Fraunces',Georgia,'Times New Roman',serif";
const SANS = "'InterV',system-ui,-apple-system,sans-serif";

// Newsprint grain, as a tiny inline SVG turbulence — the same trick the app
// uses to stop the cream reading as flat digital fill.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='.5'/%3E%3C/svg%3E\")";

const SHADOW = "rgba(38,34,26,.5)";

const shell = (w, h, inner) => `<!doctype html><html><head><meta charset="utf-8">
<style>${FACES}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
</style></head><body>
<div style="position:relative;width:${w}px;height:${h}px;overflow:hidden;color:${T.ink};
  background:
    radial-gradient(85% 70% at 50% 14%,rgba(217,72,43,.07),transparent 62%),
    radial-gradient(100% 80% at 50% 112%,rgba(38,34,26,.07),transparent 55%),
    ${T.paper};">
  ${inner}
  <div style="position:absolute;inset:0;background-image:${GRAIN};background-size:160px 160px;
    mix-blend-mode:multiply;opacity:.055;"></div>
</div></body></html>`;

// --- pieces -----------------------------------------------------------------

/** The app's logo mark: a stamp-red rounded square holding a ◆. */
export const logo = (px) => `<div style="flex:0 0 auto;width:${px}px;height:${px}px;
  border-radius:${px * 0.26}px;display:grid;place-items:center;
  background:linear-gradient(160deg,${T.press},${T.pressDeep});
  box-shadow:${px * 0.055}px ${px * 0.055}px 0 ${SHADOW};color:${T.paper};
  font-size:${px * 0.46}px;line-height:1;font-family:${SANS};">◆</div>`;

/**
 * Mark plus wordmark, sized to survive a 300px-wide thumbnail. `markPx: 0`
 * drops the mark, which is what the smallest formats want — down there it only
 * crowds the name it is supposed to introduce.
 */
const masthead = (s, { markPx, titlePx }) => `<div style="display:flex;align-items:center;
  justify-content:center;gap:${markPx * s * 0.25}px;">
  ${markPx ? logo(markPx * s) : ""}
  <div style="font-family:${SERIF};font-size:${titlePx * s}px;font-weight:700;
    letter-spacing:-.03em;line-height:1;white-space:nowrap;">WordGrid</div></div>`;

/** One of the four words, printed in its group's colour. */
const tile = (s, i, { w, h, label, fs }) => {
  const c = CAT[i];
  return `<div style="width:${w}px;height:${h}px;display:grid;place-items:center;
    border-radius:${fs * 0.42}px;background:linear-gradient(160deg,${c.from},${c.to});
    border:${4 * s}px solid ${T.ink};box-shadow:${7 * s}px ${7 * s}px 0 ${SHADOW};
    font-family:${SANS};font-weight:800;font-size:${fs}px;letter-spacing:.03em;
    color:${c.ink};white-space:nowrap;">${label}</div>`;
};

/** The masked link — one ? per letter, never spelled out on the art. */
const linkCard = (s, { w, h, fs }) => `<div style="width:${w}px;height:${h}px;display:flex;
  align-items:center;justify-content:center;gap:${fs * 0.24}px;border-radius:${fs * 0.4}px;
  background:linear-gradient(160deg,${T.press},${T.pressDeep});border:${5 * s}px solid ${T.ink};
  box-shadow:${10 * s}px ${10 * s}px 0 ${SHADOW};color:${T.paper};font-family:${SANS};
  font-weight:800;font-size:${fs}px;letter-spacing:${fs * 0.18}px;white-space:nowrap;">
  <span style="font-size:${fs * 0.6}px;letter-spacing:0;">◆</span>${"? ".repeat(RIDDLE.marks).trim()}</div>`;

const RULE = "rgba(38,34,26,.42)";
const stroke = (s, d) =>
  `<path d="${d}" fill="none" stroke="${RULE}" stroke-width="${5.5 * s}" stroke-linecap="round"/>`;

/**
 * The four lines, every one of them landing on the SAME point at the top of the
 * card. Four groups, one word — said with geometry instead of a sentence.
 * Each line leaves its tile's bottom edge and drops.
 */
const fan = (s, from, hub) =>
  from
    .map(([sx, sy]) => {
      const my = (sy + hub[1]) / 2;
      return stroke(s, `M${sx},${sy} C${sx},${my} ${hub[0]},${my} ${hub[0]},${hub[1]}`);
    })
    .join("");

/**
 * The same fan out of a 2×2. The back row can't drop straight down — the front
 * row is in the way — so those two leave sideways and come down the outside of
 * the block instead.
 */
const fanFromGrid = (s, { x0, gridW, gridY, tw, th, gap }, hub) => {
  const [hx, hy] = hub;
  // The lane the back row comes down. It has to clear the block, and still sit
  // inside the page — on a narrow format there isn't room for the full swing.
  const out = Math.min(86 * s, Math.max(0, x0 - 26 * s));
  const backY = gridY + th / 2;
  const frontY = gridY + th + gap + th + 6 * s;
  const lanes = [x0 - out, x0 + gridW + out];
  return [
    // back row, out through the side and down past the front row
    stroke(s, `M${x0},${backY} C${lanes[0]},${backY} ${lanes[0]},${hy} ${hx},${hy}`),
    stroke(s, `M${x0 + gridW},${backY} C${lanes[1]},${backY} ${lanes[1]},${hy} ${hx},${hy}`),
    // front row, straight down like the landscape fan
    ...[x0 + tw / 2, x0 + gridW - tw / 2].map((sx) => {
      const my = (frontY + hy) / 2;
      return stroke(s, `M${sx},${frontY} C${sx},${my} ${hx},${my} ${hx},${hy}`);
    }),
  ].join("");
};

// --- compositions -----------------------------------------------------------
// Two of them. Landscape lays the four words out in a row; everything squarer or
// taller folds them into a 2×2. Both are the same picture.

/** 16:9 — the main store thumbnail. Masthead, a row of four, the card. */
function rowLayout(w, h) {
  const s = h / 1080;
  const { words } = RIDDLE;
  const tw = 372 * s, th = 168 * s, gap = 44 * s;
  const x0 = (w - (4 * tw + 3 * gap)) / 2;
  const tileY = 356 * s;
  const cw = (180 + 155 * RIDDLE.marks) * s, ch = 262 * s;
  const cy = 700 * s;
  const hub = [w / 2, cy - 10 * s];
  const from = words.map((_, i) => [x0 + i * (tw + gap) + tw / 2, tileY + th + 8 * s]);
  return shell(
    w,
    h,
    `<div style="position:absolute;left:0;right:0;top:${118 * s}px;">
       ${masthead(s, { markPx: 112, titlePx: 152 })}</div>
     <svg width="${w}" height="${h}" style="position:absolute;inset:0;">${fan(s, from, hub)}</svg>
     ${words
       .map(
         (word, i) => `<div style="position:absolute;left:${x0 + i * (tw + gap)}px;top:${tileY}px;">
           ${tile(s, i, { w: tw, h: th, label: word, fs: 60 * s })}</div>`,
       )
       .join("")}
     <div style="position:absolute;left:${(w - cw) / 2}px;top:${cy}px;">
       ${linkCard(s, { w: cw, h: ch, fs: 116 * s })}</div>`,
  );
}

/**
 * Everything square or taller, and the small formats too: masthead, a 2×2 of
 * words, the card. The layout is drawn against a design box (`unitW`×`unitH`)
 * and scaled to fit the real canvas, so one set of numbers serves every size in
 * the family without the widest one growing until it touches the edges.
 */
function stackLayout(w, h, { unitW, unitH, markPx, titlePx, tw, th, gap, cardW, cardH, tileFs, cardFs, lead }) {
  const s = Math.min(w / unitW, h / unitH);
  const { words } = RIDDLE;
  const TW = tw * s, TH = th * s, G = gap * s;
  const gridW = TW * 2 + G;
  const x0 = (w - gridW) / 2;
  const CH = cardH * s, CW = Math.min(w - 40 * s, cardW * s);
  const LEAD = lead * s;

  const head = titlePx * s;
  const stack = head + LEAD + TH * 2 + G + LEAD + CH;
  const top = (h - stack) / 2;
  const gridY = top + head + LEAD;
  const cy = gridY + TH * 2 + G + LEAD;
  const hub = [w / 2, cy - 8 * s];

  return shell(
    w,
    h,
    `<div style="position:absolute;left:0;right:0;top:${top}px;">
       ${masthead(s, { markPx, titlePx })}</div>
     <svg width="${w}" height="${h}" style="position:absolute;inset:0;">
       ${fanFromGrid(s, { x0, gridW, gridY, tw: TW, th: TH, gap: G }, hub)}</svg>
     ${words
       .map(
         (word, i) => `<div style="position:absolute;left:${x0 + (i % 2) * (TW + G)}px;
           top:${gridY + Math.floor(i / 2) * (TH + G)}px;">
           ${tile(s, i, { w: TW, h: TH, label: word, fs: tileFs * s })}</div>`,
       )
       .join("")}
     <div style="position:absolute;left:${(w - CW) / 2}px;top:${cy}px;">
       ${linkCard(s, { w: CW, h: CH, fs: cardFs * s })}</div>`,
  );
}

export const coverWide = (w, h) => rowLayout(w, h);

export const coverSquare = (w, h) =>
  stackLayout(w, h, {
    unitW: 1080,
    unitH: 1080,
    markPx: 96,
    titlePx: 132,
    tw: 396,
    th: 176,
    gap: 40,
    cardW: 574,
    cardH: 232,
    tileFs: 62,
    cardFs: 104,
    lead: 92,
  });

export const coverPortrait = (w, h) =>
  stackLayout(w, h, {
    unitW: 1080,
    unitH: 1920,
    markPx: 124,
    titlePx: 168,
    tw: 466,
    th: 214,
    gap: 46,
    cardW: 648,
    cardH: 290,
    tileFs: 74,
    cardFs: 128,
    lead: 150,
  });

/**
 * 4:3 and small squares. Same picture, drawn against a smaller design canvas so
 * the title and the four words keep their weight — these are the sizes that end
 * up as the actual tile in a grid, where a logo on its own says nothing.
 */
export const coverSmall = (w, h) =>
  stackLayout(w, h, {
    // A 4:3 design box, so the 512 square scales off its width rather than
    // growing to fill it.
    unitW: 533,
    unitH: 400,
    markPx: 0, // no mark down here — see masthead()
    titlePx: 62,
    tw: 176,
    th: 62,
    gap: 11,
    cardW: 300,
    cardH: 80,
    tileFs: 29,
    cardFs: 38,
    lead: 32,
  });
