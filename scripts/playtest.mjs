// Headless-Chrome runthrough of the full flow: start → level map → coached
// tutorial → pair-matching game → guess-the-link finale → win → unlock.
// Verifies the secret link's WORD never appears until the reveal.
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

// Level 1 is the STAR puzzle; its four spoke-groups (the link STAR is hidden):
const GROUPS = [
  ["ICON", "LEGEND", "IDOL"],
  ["MOON", "COMET", "PLANET"],
  ["JELLY", "CAT", "SWORD"],
  ["HEART", "ARROW", "CROSS"],
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
async function solveGroup(group) {
  for (const w of group) await clickWord(w);
  await clickText("button", "Submit group");
  await sleep(500);
}
const bodyText = () => p.$eval("body", (e) => e.innerText);

// 1. Start screen (no auto-dialog now — tutorial is in-game)
if (await p.$('[role="dialog"]')) note("A modal auto-opened on first visit (tutorial should be in-game).");
await p.screenshot({ path: `${SHOT}/r2-start.png` });
if (!(await clickText("button", "Play"))) note("No Play button on start screen.");
await sleep(500);

// 2. Level map: 62 nodes; looser gating opens the first few (lookahead 3)
const nodes = await p.$$eval("button[aria-label^='Level ']", (els) => els.map((e) => e.disabled));
log("level nodes:", nodes.length, "locked:", nodes.filter(Boolean).length);
if (nodes.length !== 62) note(`Expected 62 level nodes, found ${nodes.length}.`);
if (nodes[0] || nodes[1] || nodes[2]) note("Levels 1-3 should be unlocked from the start.");
if (!nodes[3]) note("Level 4 should start locked (lookahead 3).");
await p.screenshot({ path: `${SHOT}/r3-levels.png` });

// 3. Enter level 1 → coached tutorial
await (await p.$("button[aria-label^='Level 1,']")).click();
await sleep(500);
const coachShown = /secret link/i.test(await bodyText());
log("coach tutorial shown:", coachShown);
if (!coachShown) note("Interactive tutorial coach did not appear on first level.");
await p.screenshot({ path: `${SHOT}/r4-coach.png` });
await clickText("button", "Next"); // dismiss coach step 0
await sleep(300);

// 4. Concealment: neither the link WORD (STAR) nor the title ("Star Power",
//    which spells out the link) may be visible mid-game.
const midText = await bodyText();
// The link tile/reveal would render as uppercase STAR; the title as "Star Power".
log("link word hidden mid-game:", !/\bSTAR\b/.test(midText) && !/star power/i.test(midText));
if (/\bSTAR\b/.test(midText)) note("Secret link word 'STAR' is visible during play.");
if (/star power/i.test(midText)) note("Level title leaks the link during play.");
if (!/\?\s*\?\s*\?/.test(midText)) note("Secret-link card is not showing a masked placeholder.");

// 4b. Hint: reveal a category description (token-based, no solve, no star cost)
if (!/reveal a group's theme/i.test(midText)) note("Prominent hint button not found.");
await clickText("button", "Reveal a group's theme");
await sleep(350);
const afterHint = await bodyText();
log("hint revealed a category theme:", /words for a celebrity/i.test(afterHint));
if (!/words for a celebrity/i.test(afterHint)) note("Hint did not reveal a category theme.");
await p.screenshot({ path: `${SHOT}/r-hint.png` });

// 5. Solve groups (coach auto-advances after the first; group 4 auto-solves)
await solveGroup(GROUPS[0]);
await clickText("button", "Let's go"); // dismiss coach step 2
await sleep(200);
await solveGroup(GROUPS[1]);
await solveGroup(GROUPS[2]);
await sleep(1200); // auto-solve final group → guessing

// 6. Guess-the-link finale — tap-to-build the answer from a letter bank (the
//    first letter is pre-filled for free, so we only tap the remaining letters).
const guessing = /spell the secret word/i.test(await bodyText());
log("tap-to-build finale shown:", guessing);
if (!guessing) note("Tap-to-build guess-the-link finale did not appear.");
await p.screenshot({ path: `${SHOT}/r5-guess.png` });
const bankCount = await p.$$eval("main button[aria-label^='Letter ']", (els) => els.length);
log("letter bank tiles:", bankCount);
if (bankCount < 10) note(`Letter bank looks too small (${bankCount} tiles).`);
async function tapLetter(ch) {
  for (const h of await p.$$("main button[aria-label^='Letter ']")) {
    const disabled = await h.evaluate((e) => e.disabled);
    if (!disabled && (await h.evaluate((e) => e.textContent.trim())) === ch) { await h.click(); return true; }
  }
  return false;
}
// STAR: 'S' is the free first letter; tap T, A, R.
for (const ch of ["T", "A", "R"]) {
  if (!(await tapLetter(ch))) note(`Could not tap letter ${ch} from the bank.`);
  await sleep(200);
}
await sleep(1300);

// 7. Win
const winText = await bodyText();
const won = /secret link was/i.test(winText);
log("won + reveal shown:", won);
if (!won) note("Win/reveal did not appear.");
if (!/star power/i.test(winText)) note("Level title not revealed on the win card.");
const starCount = (winText.match(/⭐/g) || []).length;
log("stars on win card:", starCount);
if (starCount < 3) note(`Expected 3 stars on a flawless win, saw ${starCount}.`);
log("link-guess acknowledged:", /guessed it/i.test(winText));
await p.screenshot({ path: `${SHOT}/r6-win.png` });

// 8. Back to map: window extends after a clear, stars banked (62*3 = 186)
await clickText("button", "Levels");
await sleep(500);
const after = await p.$$eval("button[aria-label^='Level ']", (els) => els.map((e) => e.disabled));
if (after[3] !== false) note("Level 4 not unlocked after clearing level 1 (window should extend).");
if (!/⭐\s*3\/186/.test(await bodyText())) note("Star total not updated to 3/186.");
await p.screenshot({ path: `${SHOT}/r7-levels-after.png` });

// 9. Play history records the finished game
await sleep(4000); // let the achievement toast clear so it can't intercept the click
await clickText("button", "⭐"); // open stats
await sleep(300);
await clickText("button", "View play history");
await sleep(300);
const histText = await bodyText();
log("history lists the played level:", /star power/i.test(histText));
if (!/star power/i.test(histText)) note("Play history did not record the finished level.");
await p.screenshot({ path: `${SHOT}/r8-history.png` });

// 10. Boss level: chapter-1 boss is the "scramble" twist (different gameplay)
await p.evaluate(() => {
  localStorage.setItem("wordgrid:tutorial", "1");
  localStorage.setItem("wordgrid:progress", JSON.stringify({ stars: { star: 3, bark: 3, stick: 3, bug: 3, sheet: 3 } }));
});
await p.goto(BASE, { waitUntil: "networkidle0" });
await sleep(400);
(await clickText("button", "Continue")) || (await clickText("button", "Play"));
await sleep(500);
const bossNode = await p.$("button[aria-label^='Level 8,']");
if (!bossNode) note("Boss level 8 was not unlocked for the boss test.");
else {
  await bossNode.click();
  await sleep(600);
  const bt = await bodyText();
  log("boss shows scrambled tiles:", /scrambled/i.test(bt) && !/BURGER/.test(bt));
  if (!/scrambled/i.test(bt)) note("Boss did not show the scrambled-tiles label.");
  if (/BURGER/.test(bt)) note("Boss tile shows the real word instead of a scramble.");
  await p.screenshot({ path: `${SHOT}/r9-boss.png` });
}

// 11. On a loss, the secret link must STAY hidden (so it can be guessed on replay)
await p.evaluate(() => localStorage.clear());
await p.goto(BASE, { waitUntil: "networkidle0" });
await sleep(400);
await clickText("button", "Play");
await sleep(400);
await (await p.$("button[aria-label^='Level 1,']")).click();
await sleep(500);
await clickText("button", "Next"); // dismiss coach step 0 if present
await sleep(300);
// Four distinct non-groups → four mistakes → loss (each spans multiple groups).
const WRONG = [
  ["ICON", "MOON", "JELLY"],
  ["ICON", "MOON", "HEART"],
  ["ICON", "COMET", "JELLY"],
  ["ICON", "COMET", "HEART"],
];
for (const g of WRONG) {
  for (const w of g) await clickWord(w);
  await clickText("button", "Submit group");
  await sleep(450);
  await clickText("button", "Clear"); // a wrong guess keeps the tiles selected
  await sleep(150);
}
const lostText = await bodyText();
log("loss reached:", /out of guesses/i.test(lostText));
if (!/out of guesses/i.test(lostText)) note("Four wrong guesses did not produce a loss.");
log("link stays hidden on loss:", !/\bSTAR\b/.test(lostText) && !/star power/i.test(lostText));
if (/\bSTAR\b/.test(lostText)) note("Secret link 'STAR' was revealed on a loss (should stay hidden).");
if (/star power/i.test(lostText)) note("Level title was revealed on a loss (spoils the link).");
if (!/replay/i.test(lostText)) note("Loss card should invite the player to replay.");
await p.screenshot({ path: `${SHOT}/r10-loss.png` });

await b.close();
console.log("\n=== CONSOLE ERRORS ===");
console.log(errors.length ? errors.join("\n") : "(none)");
console.log("\n=== ISSUES ===");
console.log(issues.length ? issues.map((s, i) => `${i + 1}. ${s}`).join("\n") : "(none)");
process.exit(issues.length ? 1 : 0);
