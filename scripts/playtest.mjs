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

// 1. First launch drops straight into the tutorial game — no menu.
if (await clickText("button", "Play")) note("First launch showed a Play menu instead of starting the game.");
const onBoard = (await p.$("main button[aria-pressed]")) != null;
log("first launch starts in-game:", onBoard);
if (!onBoard) note("First launch did not start directly in the tutorial level.");
const coach0 = await bodyText();
log("welcome coach shown:", /welcome to wordgrid/i.test(coach0));
if (!/welcome to wordgrid/i.test(coach0)) note("Welcome tutorial coach did not appear on first launch.");
log("tutorial is skippable:", /\bskip\b/i.test(coach0));
if (!/\bskip\b/i.test(coach0)) note("Tutorial has no Skip button.");
await p.screenshot({ path: `${SHOT}/r4-coach.png` });
await clickText("button", "Show me"); // advance past the welcome step
await sleep(300);

// 2. Concealment: neither the link WORD (STAR) nor the title ("Star Power")
//    may be visible mid-game.
const midText = await bodyText();
log("link word hidden mid-game:", !/\bSTAR\b/.test(midText) && !/star power/i.test(midText));
if (/\bSTAR\b/.test(midText)) note("Secret link word 'STAR' is visible during play.");
if (/star power/i.test(midText)) note("Level title leaks the link during play.");
if (!/\?\s*\?\s*\?/.test(midText)) note("Secret-link card is not showing a masked placeholder.");

// 3. The tutorial guides by THEME (no tile is highlighted) so the player thinks.
log("tutorial prompts a theme, not exact words:", /famous person/i.test(midText));
if (!/famous person/i.test(midText)) note("Tutorial step-1 theme prompt missing.");

// 3b. Hint: reveal a category description (token-based, no solve, no star cost)
if (!/reveal a group's theme/i.test(midText)) note("Prominent hint button not found.");
await clickText("button", "Reveal a group's theme");
await sleep(350);
const afterHint = await bodyText();
log("hint revealed a category theme:", /words for a celebrity/i.test(afterHint));
if (!/words for a celebrity/i.test(afterHint)) note("Hint did not reveal a category theme.");
await p.screenshot({ path: `${SHOT}/r-hint.png` });

// 4. Solve groups (coach advances after the first; group 4 auto-solves)
await solveGroup(GROUPS[0]);
await clickText("button", "I'm on it"); // dismiss coach step 2
await sleep(200);
await solveGroup(GROUPS[1]);
await solveGroup(GROUPS[2]);
await sleep(1200); // auto-solve final group → guessing

// 4c. Solved groups keep showing their words during the finale.
const dispNow = await bodyText();
log("solved words still shown at finale:", /ICON/.test(dispNow) && /LEGEND/.test(dispNow));
if (!/ICON/.test(dispNow)) note("Solved group words are not displayed during the finale.");

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
// STAR: tap every letter from the bank (no free first letter).
for (const ch of ["S", "T", "A", "R"]) {
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

// 8. Back to map: 62 nodes, window extends after a clear, stars banked (62*3 = 186)
await clickText("button", "Levels");
await sleep(500);
const nodes = await p.$$eval("button[aria-label^='Level ']", (els) => els.map((e) => e.disabled));
log("level nodes:", nodes.length, "locked:", nodes.filter(Boolean).length);
if (nodes.length !== 62) note(`Expected 62 level nodes, found ${nodes.length}.`);
if (nodes[0]) note("Level 1 should be unlocked after clearing it.");
if (nodes[3]) note("Level 4 should be unlocked after clearing level 1 (lookahead 3).");
if (!nodes[4]) note("Level 5 should still be locked after clearing only level 1.");
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

// 10. Boss level: the first chapter's boss is the "scramble" twist (different
//     gameplay). Unlock everything, then click the first 👑 boss node.
await p.evaluate(() => {
  localStorage.setItem("wordgrid:tutorial", "1");
  localStorage.setItem("wordgrid:debug", "1"); // unlock all levels for the test
});
await p.goto(BASE, { waitUntil: "networkidle0" });
await sleep(400);
(await clickText("button", "Continue")) || (await clickText("button", "Play"));
await sleep(500);
const bossNode = await p.$("button[aria-label*=', boss,']");
if (!bossNode) note("No boss node found for the boss test.");
else {
  await bossNode.click();
  await sleep(600);
  const bt = await bodyText();
  log("first boss shows scrambled tiles:", /scrambled/i.test(bt));
  if (!/scrambled/i.test(bt)) note("First boss did not show the scrambled-tiles label.");
  await p.screenshot({ path: `${SHOT}/r9-boss.png` });
}

// 11. On a loss, the secret link must STAY hidden (so it can be guessed on replay)
await p.evaluate(() => {
  localStorage.clear();
  localStorage.setItem("wordgrid:tutorial", "1"); // skip the coach for this run
});
await p.goto(BASE, { waitUntil: "networkidle0" });
await sleep(400);
(await clickText("button", "Continue")) || (await clickText("button", "Play"));
await sleep(400);
await (await p.$("button[aria-label^='Level 1,']")).click();
await sleep(500);
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
// Running out of guesses first offers a one-time "second chance" — decline it.
await sleep(300);
const offered = /second chance|don't stop now/i.test(await bodyText());
log("second-chance offer shown:", offered);
if (!offered) note("Second-chance offer did not appear after running out of guesses.");
await clickText("button", "No thanks");
await sleep(400);
const lostText = await bodyText();
log("loss reached after declining:", /out of guesses/i.test(lostText));
if (!/out of guesses/i.test(lostText)) note("Declining the second chance did not produce a loss.");
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
