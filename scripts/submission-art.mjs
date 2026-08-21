// Cover art for the CrazyGames submission, rendered from HTML by
// scripts/gen-submission.mjs. Kept apart from the driver because these are
// layouts, not automation: four aspect ratios that each get their own
// composition rather than one canvas squashed to fit.
//
// The look is the game's own "Puzzle Press" identity (src/index.css): cream
// paper, ink type, flat print colours, chunky offset shadows, stamp red. The
// board on the covers is the real level 1 board (STAR) with its groups already
// coloured and the pivot masked — the whole premise in one picture.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

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

// The four category colours a solved group is printed in.
const CAT = [
  { from: "#f2b544", to: "#eda820", ink: "#3b2703" }, // gold
  { from: "#7cc0e8", to: "#5eb0e0", ink: "#0a344a" }, // sky
  { from: "#c5a3e8", to: "#b48fd9", ink: "#2f1547" }, // violet
  { from: "#8fd6ab", to: "#6cc793", ink: "#093b22" }, // mint
];

// Level 1's board, in group order — the same twelve words a new player meets.
const BOARD = [
  ["ICON", "LEGEND", "IDOL"],
  ["MOON", "COMET", "PLANET"],
  ["MEDAL", "TROPHY", "RIBBON"],
  ["HEART", "ARROW", "CROSS"],
];

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

const paperBg = (w, h) => `
  radial-gradient(90% 70% at 50% 0%,rgba(217,72,43,.06),transparent 60%),
  radial-gradient(100% 80% at 50% 110%,rgba(38,34,26,.08),transparent 55%),
  ${T.paper}`;

// Newsprint grain, as a tiny inline SVG turbulence — the same trick the app
// uses to stop the cream reading as flat digital fill.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='.5'/%3E%3C/svg%3E\")";

// --- pieces ----------------------------------------------------------------
const shadow = (s) => `${Math.max(2, Math.round(3 * s))}px ${Math.max(2, Math.round(3 * s))}px 0 rgba(38,34,26,.5)`;

/** The app's logo mark: a stamp-red rounded square holding a ◆. */
export const logo = (px) => `<div style="flex:0 0 auto;width:${px}px;height:${px}px;border-radius:${px * 0.26}px;
  display:grid;place-items:center;background:linear-gradient(160deg,${T.press},${T.pressDeep});
  box-shadow:${px * 0.055}px ${px * 0.055}px 0 rgba(38,34,26,.5);color:${T.paper};
  font-size:${px * 0.46}px;line-height:1;font-family:${SANS};">◆</div>`;

/** A solved word tile, printed in its group's colour. */
const tile = (word, c, fs, s) => `<div style="display:grid;place-items:center;
  padding:${fs * 0.5}px ${fs * 0.35}px;border-radius:${fs * 0.5}px;
  background:linear-gradient(160deg,${c.from},${c.to});border:${Math.max(2, 2.5 * s)}px solid ${T.ink};
  box-shadow:${shadow(s)};color:${c.ink};font-family:${SANS};font-weight:800;
  font-size:${fs}px;letter-spacing:.04em;white-space:nowrap;">${word}</div>`;

/** The masked secret link — one ? per letter, never spelled out on the art. */
const linkCard = (fs, s, { wide = false } = {}) => `<div style="display:flex;align-items:center;
  gap:${fs * 0.7}px;padding:${fs * 0.55}px ${fs * 1.1}px;border-radius:${fs * 0.7}px;
  background:linear-gradient(160deg,${T.press},${T.pressDeep});border:${Math.max(2, 2.5 * s)}px solid ${T.ink};
  box-shadow:${shadow(s * 1.3)};color:${T.paper};font-family:${SANS};">
  <span style="font-size:${fs * 1.15}px;line-height:1;">◆</span>
  <span style="display:flex;flex-direction:column;gap:${fs * 0.12}px;">
    <span style="font-size:${fs * 0.42}px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;opacity:.85;">Secret link${wide ? " · in every group" : ""}</span>
    <span style="font-size:${fs * 1.05}px;font-weight:800;letter-spacing:${fs * 0.22}px;">? ? ? ?</span>
  </span></div>`;

/** The twelve-tile board, groups already coloured. */
const board = (fs, s, { cols = 4 } = {}) => {
  const flat = BOARD.flatMap((words, g) => words.map((w) => tile(w, CAT[g], fs, s)));
  // Read across in group order so each colour makes an obvious run of three.
  return `<div style="display:grid;grid-template-columns:repeat(${cols},minmax(0,1fr));
    gap:${fs * 0.5}px;">${flat.join("")}</div>`;
};

/** Small caps strip of what the game holds — the "why click" line. */
const facts = (fs, items) => `<div style="display:flex;gap:${fs * 0.9}px;align-items:center;
  flex-wrap:wrap;font-family:${SANS};font-size:${fs}px;font-weight:700;letter-spacing:.12em;
  text-transform:uppercase;color:${T.inkSoft};">${items
    // The separator travels with the item it precedes, so a wrap can never
    // leave a lone ◆ hanging off the end of a line.
    .map((x, i) =>
      i
        ? `<span style="display:inline-flex;gap:${fs * 0.9}px;white-space:nowrap;"><span style="color:${T.press}">◆</span><span>${x}</span></span>`
        : `<span style="white-space:nowrap;">${x}</span>`,
    )
    .join("")}</div>`;

const shell = (w, h, inner, { pad = 0 } = {}) => `<!doctype html><html><head><meta charset="utf-8">
<style>${FACES}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
.grain{position:absolute;inset:0;background-image:${GRAIN};background-size:160px 160px;
  mix-blend-mode:multiply;opacity:.055;pointer-events:none}
</style></head><body>
<div style="position:relative;width:${w}px;height:${h}px;overflow:hidden;background:${paperBg(w, h)};
  color:${T.ink};padding:${pad}px;">
  ${inner}
  <div class="grain"></div>
</div></body></html>`;

// --- layouts ---------------------------------------------------------------

/** 16:9 — the main store thumbnail. Masthead left, live board right. */
export function coverWide(w, h) {
  const s = h / 1080;
  return shell(
    w,
    h,
    `<div style="display:flex;height:100%;align-items:center;gap:${86 * s}px;">
      <div style="flex:1 1 46%;display:flex;flex-direction:column;gap:${30 * s}px;">
        ${logo(150 * s)}
        <div style="font-family:${SERIF};font-size:${176 * s}px;font-weight:700;letter-spacing:-.03em;line-height:.92;">WordGrid</div>
        <div style="font-family:${SANS};font-size:${52 * s}px;line-height:1.28;color:${T.inkSoft};max-width:${820 * s}px;">
          Four hidden groups.<br><b style="color:${T.press};font-weight:800;">One secret word</b> links them all.</div>
        <div style="margin-top:${14 * s}px;">${facts(28 * s, ["100 levels", "12 bosses", "Daily puzzle"])}</div>
      </div>
      <div style="flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:${36 * s}px;
        transform:rotate(-2.2deg);">
        ${linkCard(44 * s, s, { wide: true })}
        ${board(35 * s, s)}
      </div>
    </div>`,
    { pad: Math.round(92 * s) },
  );
}

/** 1:1 — square placements. Stacked, board underneath the masthead. */
export function coverSquare(w, h) {
  const s = w / 1080;
  return shell(
    w,
    h,
    `<div style="height:100%;display:flex;flex-direction:column;align-items:center;
      justify-content:center;gap:${34 * s}px;text-align:center;">
      ${logo(146 * s)}
      <div style="font-family:${SERIF};font-size:${150 * s}px;font-weight:700;letter-spacing:-.03em;line-height:1;">WordGrid</div>
      <div style="font-family:${SANS};font-size:${44 * s}px;line-height:1.3;color:${T.inkSoft};max-width:${800 * s}px;">
        Four hidden groups. <b style="color:${T.press};font-weight:800;">One secret word</b> links them all.</div>
      <div style="margin-top:${10 * s}px;transform:rotate(-1.6deg);display:flex;flex-direction:column;
        align-items:center;gap:${28 * s}px;">
        ${linkCard(40 * s, s)}
        ${board(32 * s, s, { cols: 4 })}
      </div>
      <div style="margin-top:${16 * s}px;">${facts(26 * s, ["100 levels", "Daily puzzle"])}</div>
    </div>`,
    { pad: Math.round(80 * s) },
  );
}

/** 9:16 — portrait placements and social. */
export function coverPortrait(w, h) {
  const s = w / 1080;
  return shell(
    w,
    h,
    `<div style="height:100%;display:flex;flex-direction:column;align-items:center;
      justify-content:center;gap:${52 * s}px;text-align:center;">
      ${logo(190 * s)}
      <div style="font-family:${SERIF};font-size:${170 * s}px;font-weight:700;letter-spacing:-.03em;line-height:1;">WordGrid</div>
      <div style="font-family:${SANS};font-size:${52 * s}px;line-height:1.3;color:${T.inkSoft};max-width:${880 * s}px;">
        Four hidden groups. <b style="color:${T.press};font-weight:800;">One secret word</b> links them all.</div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:${40 * s}px;transform:rotate(-1.6deg);">
        ${linkCard(52 * s, s)}
        ${board(44 * s, s, { cols: 3 })}
      </div>
      ${facts(30 * s, ["100 levels", "Daily puzzle"])}
    </div>`,
    { pad: Math.round(90 * s) },
  );
}

/**
 * Small formats (4:3 thumbnail, square app icon). Anything word-sized is
 * unreadable here, so these carry the mark, the name and one short line.
 */
export function coverSmall(w, h) {
  const s = Math.min(w / 400, h / 400);
  const stack = h / w > 0.9; // the icon is square, the thumbnail is 4:3
  const pad = Math.round((stack ? 34 : 26) * s);
  // The wordmark is the widest thing on these, so it is capped to the box
  // rather than scaled blindly — at 512 square the plain scale runs it off
  // both edges.
  const name = Math.min((stack ? 86 : 68) * s, (w - 2 * pad) / 5.6);
  return shell(
    w,
    h,
    `<div style="height:100%;display:flex;flex-direction:column;align-items:center;
      justify-content:center;gap:${(stack ? 26 : 18) * s}px;text-align:center;">
      ${logo((stack ? 150 : 108) * s)}
      <div style="font-family:${SERIF};font-size:${name}px;font-weight:700;
        letter-spacing:-.03em;line-height:1;">WordGrid</div>
      <div style="font-family:${SANS};font-size:${name * 0.31}px;font-weight:700;
        letter-spacing:.1em;text-transform:uppercase;color:${T.press};">One secret word</div>
      <div style="display:flex;gap:${8 * s}px;margin-top:${4 * s}px;">
        ${CAT.map(
          (c) =>
            `<div style="width:${(stack ? 46 : 38) * s}px;height:${(stack ? 20 : 16) * s}px;
              border-radius:999px;background:linear-gradient(160deg,${c.from},${c.to});
              border:${2 * s}px solid ${T.ink};"></div>`,
        ).join("")}
      </div>
    </div>`,
    { pad },
  );
}
