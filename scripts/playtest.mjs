// Headless-Chrome runthrough of the full flow: tutorial → start → level map →
// game → win → unlock. Asserts on the DOM, including that the pivot is never
// distinguishable by colour mid-game. Run with:
//
//   npm run build && npm run preview        # serve on :4173
//   npm i -D puppeteer                       # one-time (kept out of deps)
//   BASE=http://localhost:4173/ node scripts/playtest.mjs
import puppeteer from "puppeteer";

const SHOT = process.env.SHOT || ".";
const BASE = process.env.BASE || "http://localhost:4173/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log("•", ...a);
const issues = [];
const note = (s) => { issues.push(s); log("ISSUE:", s); };

// Level 1 is always the STAR puzzle.
const GROUPS = [
  ["STAR", "ICON", "LEGEND"],
  ["STAR", "MOON", "COMET"],
  ["STAR", "JELLY", "CAT"],
  ["STAR", "HEART", "ARROW"],
];

const b = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox"] });
const p = await b.newPage();
await p.setViewport({ width: 430, height: 880, deviceScaleFactor: 2 });
const errors = [];
p.on("console", (m) => m.type() === "error" && errors.push(m.text()));
p.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

await p.goto(BASE, { waitUntil: "networkidle0" });
await p.evaluate(() => localStorage.clear());
await p.reload({ waitUntil: "networkidle0" });
await sleep(500);

async function clickText(sel, text) {
  for (const h of await p.$$(sel)) {
    const t = (await h.evaluate((e) => e.textContent)) || "";
    if (t.includes(text)) { await h.click(); return true; }
  }
  return false;
}
async function clickWord(w) {
  for (const h of await p.$$("main button[aria-pressed]")) {
    if ((await h.evaluate((e) => e.textContent.replace(/◆/g, "").trim())) === w) { await h.click(); return true; }
  }
  return false;
}
async function solveGroup(g) {
  for (const w of g) await clickWord(w);
  await clickText("button", "Submit");
  await sleep(500);
}

// 1. First-visit tutorial
log("tutorial auto-opened:", !!(await p.$('[role="dialog"]')));
if (!(await p.$('[role="dialog"]'))) note("Tutorial did not auto-open on first visit.");
await p.screenshot({ path: `${SHOT}/r1-tutorial.png` });
await clickText('[role="dialog"] button', "Let's play");
await p.waitForFunction(() => !document.querySelector('[role="dialog"]'), { timeout: 4000 });
await sleep(200);

// 2. Start screen → Play
await p.screenshot({ path: `${SHOT}/r2-start.png` });
if (!(await clickText("button", "Play"))) note("No Play button on start screen.");
await sleep(500);

// 3. Level map
await p.screenshot({ path: `${SHOT}/r3-levels.png` });
const nodes = await p.$$eval("button[aria-label^='Level ']", (els) => els.map((e) => e.disabled));
log("level nodes:", nodes.length, "locked:", nodes.filter(Boolean).length);
if (nodes.length !== 31) note(`Expected 31 level nodes, found ${nodes.length}.`);
if (nodes[0]) note("Level 1 should be unlocked.");
if (!nodes[1]) note("Level 2 should start locked.");

// 4. Enter level 1
await (await p.$("button[aria-label^='Level 1,']")).click();
await sleep(500);
await p.screenshot({ path: `${SHOT}/r4-game.png` });

// 5. Solve; verify concealment (uniform tile backgrounds) after first group
await solveGroup(GROUPS[0]);
const styles = await p.$$eval("main button[aria-pressed='false']", (els) =>
  els.map((e) => { const s = getComputedStyle(e); return `${s.backgroundColor}|${s.backgroundImage}`; })
);
const distinct = [...new Set(styles)].length;
log("distinct mid-play tile backgrounds (expect 1):", distinct);
if (distinct > 1) note("Pivot derivable by colour mid-play.");

await solveGroup(GROUPS[1]);
await solveGroup(GROUPS[2]);
await sleep(1400); // auto-solve last + win
const won = /shared word was/i.test(await p.$eval("body", (e) => e.innerText));
log("won + reveal shown:", won);
if (!won) note("Win/reveal did not appear.");
const starCount = await p.evaluate(() => (document.body.innerText.match(/⭐/g) || []).length);
log("stars on win card:", starCount);
if (starCount < 3) note(`Expected 3 stars on a flawless win, saw ${starCount}.`);
await p.screenshot({ path: `${SHOT}/r5-win.png` });

// 6. Back to map: level 2 unlocked, stars banked
await clickText("button", "Levels");
await sleep(500);
const after = await p.$$eval("button[aria-label^='Level ']", (els) => els.map((e) => e.disabled));
if (after[1] !== false) note("Level 2 not unlocked after clearing level 1.");
if (!/⭐\s*3\/93/.test(await p.$eval("body", (e) => e.innerText))) note("Star total not updated to 3/93.");
await p.screenshot({ path: `${SHOT}/r6-levels-after.png` });

await b.close();
console.log("\n=== CONSOLE ERRORS ===");
console.log(errors.length ? errors.join("\n") : "(none)");
console.log("\n=== ISSUES ===");
console.log(issues.length ? issues.map((s, i) => `${i + 1}. ${s}`).join("\n") : "(none)");
process.exit(issues.length ? 1 : 0);
