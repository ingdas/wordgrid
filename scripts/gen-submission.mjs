// CrazyGames submission pack (backlog #8): cover art (16:9 + square) rendered
// from branded HTML, plus real gameplay screenshots captured from the built
// app. Covers/screenshots land in assets/submission/ (not shipped with the
// game build). A short gameplay clip still needs a manual screen recording.
//
//   npm run build && npm run preview        # serve docs/ on :4173
//   node scripts/gen-submission.mjs         # (BASE=… to override the URL)
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync } from "node:fs";
import { launchBrowser } from "./browser.mjs";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "assets", "submission");
mkdirSync(OUT, { recursive: true });
const BASE = process.env.BASE || "http://localhost:4173/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- Puzzle Press theme tokens (kept in sync with src/index.css) ------------
const T = {
  paper: "#faf5ea",
  ink: "#26221a",
  inkSoft: "#6f6757",
  press: "#d9482b",
  serif: "Georgia,'Times New Roman',serif",
  sans: "system-ui,-apple-system,sans-serif",
};
const PAPER_BG = `radial-gradient(90% 70% at 50% 0%,rgba(217,72,43,.05),transparent 60%),radial-gradient(100% 80% at 50% 110%,rgba(38,34,26,.07),transparent 55%),${T.paper}`;
const logo = (s) =>
  `<div style="width:${s}px;height:${s}px;border-radius:${Math.round(s * 0.24)}px;display:grid;place-items:center;background:${T.press};box-shadow:${Math.round(s * 0.05)}px ${Math.round(s * 0.05)}px 0 rgba(38,34,26,.85);color:${T.paper};font-size:${Math.round(s * 0.5)}px;line-height:1;">◆</div>`;
const tile = (t, fs) =>
  `<div style="padding:${fs * 0.45}px ${fs * 0.7}px;border-radius:${fs * 0.55}px;background:#fff;border:3px solid ${T.ink};box-shadow:4px 4px 0 rgba(38,34,26,.25);font-weight:800;letter-spacing:.06em;color:${T.ink};font-size:${fs}px;font-family:${T.sans};">${t}</div>`;
const secretTile = (fs) =>
  `<div style="padding:${fs * 0.45}px ${fs * 0.75}px;border-radius:${fs * 0.55}px;background:${T.press};border:3px solid ${T.ink};box-shadow:4px 4px 0 rgba(38,34,26,.45);font-weight:800;font-size:${fs}px;color:${T.paper};font-family:${T.sans};">◆ ? ? ?</div>`;

const cover = (w, h) => {
  const s = Math.min(w, h) / 1080;
  return `<!doctype html><html><body style="margin:0">
<div style="width:${w}px;height:${h}px;background:${PAPER_BG};color:${T.ink};font-family:${T.serif};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${44 * s}px;">
  ${logo(170 * s)}
  <div style="font-size:${170 * s}px;font-weight:700;letter-spacing:-.02em;line-height:1;">WordGrid</div>
  <div style="font-family:${T.sans};font-size:${52 * s}px;color:${T.inkSoft};max-width:${0.82 * w}px;text-align:center;line-height:1.3;">Four hidden groups. One <b style="color:${T.press}">secret word</b> links them all.</div>
  <div style="display:flex;gap:${26 * s}px;margin-top:${16 * s}px;align-items:center;flex-wrap:wrap;justify-content:center;">
    ${tile("ICON", 46 * s)}${tile("MOON", 46 * s)}
    ${secretTile(46 * s)}
    ${tile("MEDAL", 46 * s)}${tile("HEART", 46 * s)}
  </div>
  <div style="font-family:${T.sans};font-size:${34 * s}px;font-weight:700;color:${T.press};letter-spacing:.14em;text-transform:uppercase;">A daily word puzzle</div>
</div></body></html>`;
};

// --- Demo progress so the screenshots show a lively mid-game account --------
const seedProgress = () => {
  const today = new Date();
  const y = new Date(today);
  y.setDate(y.getDate() - 1);
  const key = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  localStorage.clear();
  localStorage.setItem("wordgrid:tutorial", "1");
  localStorage.setItem(
    "wordgrid:progress",
    JSON.stringify({
      stars: { star: 3, trunk: 3, ring: 2, bug: 3, bank: 2, bark: 3, stick: 1, sheet: 2 },
      streak: 3,
      bestStreak: 5,
      linksGuessed: 7,
      best: {},
      daily: { lastDate: key(y), streak: 4 },
      achievements: [],
      hints: 3,
      history: [],
      score: 5200,
      endlessBest: 6,
    }),
  );
};

// Level 1 is the STAR puzzle; three of its groups (the fourth auto-solves).
const GROUPS = [
  ["ICON", "LEGEND", "IDOL"],
  ["MOON", "COMET", "PLANET"],
  ["MEDAL", "TROPHY", "RIBBON"],
];

const browser = await launchBrowser();
const page = await browser.newPage();

async function shot(name) {
  await sleep(900); // let springs settle
  await page.screenshot({ path: join(OUT, name) });
  console.log("wrote", name);
}

async function renderCover(w, h, name) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.setContent(cover(w, h), { waitUntil: "domcontentloaded" });
  await sleep(200);
  await page.screenshot({ path: join(OUT, name) });
  console.log("wrote", name);
}

await renderCover(1920, 1080, "cover-1920x1080.png");
await renderCover(1080, 1080, "cover-1080x1080.png");

async function openApp(w, h) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.evaluate(seedProgress);
  await page.reload({ waitUntil: "networkidle0" });
  await sleep(800);
}

const click = async (sel) => {
  await page.waitForSelector(sel, { visible: true, timeout: 8000 });
  await page.click(sel);
};
const clickWord = (w) => click(`button[aria-label="${w}"]`);
const submit = async () => {
  const [btn] = await page.$$("xpath/. //button[contains(., 'Submit group')]");
  await btn.click();
  await sleep(1100);
};

async function playIntoLevelOne() {
  // Home → level map → level 1 (STAR).
  await click("xpath/. //button[contains(., 'Continue ·')]");
  await sleep(700);
}

// --- Landscape set (CrazyGames' most common desktop embed is 16:9) ----------
await openApp(1280, 720);
await shot("screen-1-home-1280x720.png");
await playIntoLevelOne();
await shot("screen-2-levels-1280x720.png");
await click('button[aria-label^="Level 1,"]');
await sleep(900);

// Solve one group, then leave two tiles selected for a lively mid-game shot.
for (const w of GROUPS[0]) await clickWord(w);
await submit();
await clickWord("MOON");
await clickWord("COMET");
await shot("screen-3-gameplay-1280x720.png");

// Finish the remaining groups → the tap-to-spell finale with the letter bank.
await clickWord("PLANET");
await submit();
for (const w of GROUPS[2]) await clickWord(w);
await submit();
await sleep(1600); // last pair auto-solves, finale slides in
await shot("screen-4-finale-1280x720.png");

// --- One portrait shot (mobile presentation) --------------------------------
await openApp(720, 1280);
await playIntoLevelOne();
await click('button[aria-label^="Level 1,"]');
await sleep(900);
for (const w of GROUPS[0]) await clickWord(w);
await submit();
await clickWord("MOON");
await clickWord("COMET");
await shot("screen-5-gameplay-720x1280.png");

await browser.close();
console.log("done →", OUT);
