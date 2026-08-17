// Headless cover for debug mode, alongside scripts/playtest.mjs.
//
//   npm run build && npx vite preview --port 4173
//   npm install --no-save puppeteer
//   BASE=http://localhost:4173/ node scripts/debug.playtest.mjs
//
// Five checks:
//   1. the tool tray only exists in debug mode, and the Settings toggle is a
//      real way in and out of it
//   2. the in-game tools: reveal every theme, peek at the link, auto-solve
//   3. hints are free (the bank reads ∞ and never goes down)
//   4. the index tool clears the next level for real (stars are persisted)
//   5. the Logic Grid paints its own solution
import { launchBrowser } from "./browser.mjs";

const BASE = process.env.BASE || "http://localhost:4173/";
const SHOT = process.env.SHOT || null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log("•", ...a);
const issues = [];
const note = (s) => { issues.push(s); console.log("ISSUE:", s); };

const b = await launchBrowser();
const p = await b.newPage();
await p.setViewport({ width: 430, height: 880, deviceScaleFactor: 1 });
const errors = [];
p.on("console", (m) => {
  if (m.type() !== "error") return;
  if (/Failed to load resource/.test(m.text())) return; // the optional CrazyGames SDK
  errors.push(m.text());
});
p.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

async function clickText(sel, text) {
  for (const h of await p.$$(sel)) {
    const ok = await h.evaluate((e, want) => {
      const r = e.getBoundingClientRect();
      return (e.textContent || "").includes(want) && r.width > 0 && r.height > 0;
    }, text);
    if (ok) { await h.click(); return true; }
  }
  return false;
}
const bodyText = () => p.$eval("body", (e) => e.innerText);
const trayButton = () => p.$('button[aria-label="Debug tools"]');
async function openTray() {
  const btn = await trayButton();
  if (!btn) return false;
  if ((await btn.evaluate((e) => e.getAttribute("aria-expanded"))) !== "true") await btn.click();
  await sleep(250);
  return true;
}
async function useTool(label) {
  if (!(await openTray())) throw new Error("no debug tray to open");
  if (!(await clickText("button", label))) throw new Error(`no debug tool "${label}"`);
  await sleep(400);
}

// A save that has seen the tutorial, on the tutorial board (level 1 = STAR).
// `hints` seeds the bank, so "free hints" can be tested from an empty one.
async function freshDebugSave(hints = 3) {
  await p.goto(BASE, { waitUntil: "networkidle0" });
  await p.evaluate((n) => {
    localStorage.clear();
    localStorage.setItem("wordgrid:tutorial", "1");
    localStorage.setItem("wordgrid:debug", "1");
    localStorage.setItem("wordgrid:progress", JSON.stringify({ hints: n }));
  }, hints);
  await p.goto(BASE, { waitUntil: "networkidle0" });
  await sleep(600);
}

// 1. Off by default; the Settings toggle turns it on and off again.
{
  await p.goto(BASE, { waitUntil: "networkidle0" });
  await p.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("wordgrid:tutorial", "1");
  });
  await p.goto(BASE, { waitUntil: "networkidle0" });
  await sleep(600);
  await clickText("button", "Play");
  await sleep(600);
  log("no tray for an ordinary player:", (await trayButton()) == null);
  if (await trayButton()) note("Debug tray is mounted with debug mode off.");

  // Home → Settings → Developer → Debug mode
  await clickText("button", "Levels");
  await sleep(400);
  await p.evaluate(() =>
    [...document.querySelectorAll("button")].find((e) => e.getAttribute("aria-label") === "Home")?.click()
  );
  await sleep(500);
  const gear = await p.$('button[aria-label="Settings"]');
  if (!gear) note("Home has no Settings button.");
  else await gear.click();
  await sleep(400);
  const settings = await bodyText();
  if (!/developer/i.test(settings)) note("Settings has no Developer section.");
  const toggle = await p.$('button[aria-label="Debug mode"]');
  if (!toggle) note("Settings has no Debug mode toggle.");
  else {
    await toggle.click();
    await sleep(300);
    const on = await p.evaluate(() => localStorage.getItem("wordgrid:debug"));
    log("settings toggle turns debug on:", on === "1");
    if (on !== "1") note("Settings toggle did not turn debug mode on.");
    await clickText("button", "Done");
    await sleep(900); // let the modal's exit animation release the backdrop
    await clickText("button", "Play");
    await sleep(900);
    log("tray appears without a reload:", (await trayButton()) != null);
    if (!(await trayButton())) note("Debug tray did not appear after toggling debug on.");
  }
  if (SHOT) await p.screenshot({ path: `${SHOT}/debug-tray.png` });
}

// 2. The in-game tools, on the tutorial board (link STAR, first theme
//    "words for a celebrity").
{
  await freshDebugSave(0); // an EMPTY bank: hints still have to be free
  await clickText("button", "Play");
  await sleep(700);
  const before = await bodyText();
  if (/\bSTAR\b/.test(before)) note("The link word is visible before anything was peeked at.");

  // Hints are free here: the badge reads ∞ from an empty bank, the ad refill
  // is never offered, and spending one leaves the bank where it was.
  log("hint badge is unlimited:", /∞/.test(before));
  if (!/∞/.test(before)) note("Hint button does not show an unlimited bank in debug.");
  if (/out of hints/i.test(before)) note("Debug mode offered the ad refill on an empty bank.");
  await clickText("button", "Reveal a group's theme");
  await sleep(400);
  const hinted = await bodyText();
  log("a hint lands on an empty bank:", /words for a celebrity/i.test(hinted));
  if (!/words for a celebrity/i.test(hinted)) note("A hint could not be spent from an empty bank in debug.");
  const bank = await p.evaluate(() => JSON.parse(localStorage.getItem("wordgrid:progress") || "{}").hints);
  log("bank after the hint:", bank);
  if (bank !== 0) note(`A hint was charged in debug mode (bank is now ${bank}).`);

  await useTool("Reveal all themes");
  const themed = await bodyText();
  const themes = (themed.match(/celebrity|night sky|FISH|shapes/gi) || []).length;
  log("themes on screen after 'Reveal all themes':", themes);
  if (themes < 3) note("'Reveal all themes' did not reveal the remaining groups.");

  await useTool("Peek at the link");
  const peeked = await bodyText();
  log("peek shows the link word:", /\bSTAR\b/.test(peeked));
  if (!/\bSTAR\b/.test(peeked)) note("'Peek at the link' did not reveal the link word.");
  await useTool("Hide the link again");
  if (/\bSTAR\b/.test(await bodyText())) note("Peek could not be turned back off.");

  await useTool("Auto-solve level");
  await sleep(900);
  const won = await bodyText();
  log("auto-solve wins the level:", /solved/i.test(won) && /\bSTAR\b/.test(won));
  if (!/\bSTAR\b/.test(won)) note("Auto-solve did not reveal the link.");
  const stars = await p.evaluate(() => JSON.parse(localStorage.getItem("wordgrid:progress") || "{}").stars || {});
  log("auto-solve recorded the clear:", JSON.stringify(stars));
  if (!Object.values(stars).some((s) => s === 3)) note("Auto-solve did not record a 3-star clear.");
  if (SHOT) await p.screenshot({ path: `${SHOT}/debug-autosolve.png` });
}

// 3. Force a loss, from a fresh board.
{
  await freshDebugSave();
  await clickText("button", "Play");
  await sleep(700);
  await useTool("Force a loss");
  await sleep(600);
  const lost = await bodyText();
  log("forced loss reaches the loss card:", /out of guesses|so close/i.test(lost));
  if (!/out of guesses|so close/i.test(lost)) note("'Force a loss' did not end the run.");
  if (/\bSTAR\b/.test(lost)) note("A forced loss leaked the link word.");
}

// 4. The index tool clears the next level outright.
{
  await freshDebugSave();
  if (!(await clickText("button", "Browse all"))) note("Home has no link to the index.");
  await sleep(900);
  const cleared = () =>
    p.evaluate(() => Object.values(JSON.parse(localStorage.getItem("wordgrid:progress") || "{}").stars || {}).length);
  const was = await cleared();
  await useTool("Clear next level");
  await sleep(500);
  const now = await cleared();
  log("index clears a level:", `${was} → ${now}`);
  if (now !== was + 1) note("'Clear next level' did not record a clear.");
  await useTool("+10 hints");
  const hints = await p.evaluate(() => JSON.parse(localStorage.getItem("wordgrid:progress") || "{}").hints);
  log("hint bank topped up:", hints);
  if (!(hints >= 13)) note("'+10 hints' did not top the bank up.");
  if (SHOT) await p.screenshot({ path: `${SHOT}/debug-index.png` });
}

// 5. The Logic Grid solves itself.
{
  await freshDebugSave();
  if (!(await clickText("button", "Logic"))) note("Home has no Logic Grid button.");
  await sleep(700);
  await useTool("Auto-solve grid");
  await sleep(800);
  const grid = await bodyText();
  log("logic grid auto-solved:", /deduced/i.test(grid));
  if (!/deduced/i.test(grid)) note("'Auto-solve grid' did not solve the grid.");
  const solvedIds = await p.evaluate(
    () => (JSON.parse(localStorage.getItem("wordgrid:progress") || "{}").deductionSolved || []).length
  );
  log("logic solve recorded:", solvedIds);
  if (solvedIds < 1) note("A debug-solved grid was not recorded as solved.");
  if (SHOT) await p.screenshot({ path: `${SHOT}/debug-logic.png` });
}

await b.close();
console.log("\n=== CONSOLE ERRORS ===");
console.log(errors.length ? errors.join("\n") : "(none)");
console.log("\n=== ISSUES ===");
console.log(issues.length ? issues.map((s, i) => `${i + 1}. ${s}`).join("\n") : "(none)");
process.exit(issues.length ? 1 : 0);
