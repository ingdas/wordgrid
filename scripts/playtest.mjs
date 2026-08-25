// Headless-Chrome runthrough of the full flow: start → level map → coached
// tutorial → pair-matching game → guess-the-link finale → win → unlock.
// Verifies the secret link's WORD never appears until the reveal.
//
//   npm run build && npm run preview        # serve on :4173
//   npm i -D puppeteer                       # one-time (kept out of deps)
//   BASE=http://localhost:4173/ node scripts/playtest.mjs
import { launchBrowser } from "./browser.mjs";

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
  ["MEDAL", "TROPHY", "RIBBON"],
  ["ACT", "PERFORM", "APPEAR"],
];

const b = await launchBrowser();
const p = await b.newPage();
await p.setViewport({ width: 430, height: 880, deviceScaleFactor: 2 });
const errors = [];
// Ignore network noise from the (optional) CrazyGames SDK script, which can't
// load in sandboxed/offline test environments; the game no-ops without it.
p.on("console", (m) => {
  if (m.type() !== "error") return;
  if (/Failed to load resource/.test(m.text())) return;
  errors.push(m.text());
});
p.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

await p.goto(BASE, { waitUntil: "networkidle0" });
// A fresh visit as well as a fresh save: the opening plays once per visit, and
// this first load has already spent it.
await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await p.reload({ waitUntil: "networkidle0" });

async function clickText(sel, text) {
  for (const h of await p.$$(sel)) {
    // Skip anything not actually on screen — the rotate-to-portrait hint keeps
    // a hidden "Play anyway" button in the DOM at every viewport.
    const ok = await h.evaluate((e, want) => {
      const r = e.getBoundingClientRect();
      return (e.textContent || "").includes(want) && r.width > 0 && r.height > 0;
    }, text);
    if (ok) { await h.click(); return true; }
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

// 0. The opening. It owns the first paint for about four seconds — the plate
//    stamps its `data-intro` with the time it started, so the run is measured
//    from the page's own clock rather than from when the navigation settled.
const introMs = await p.evaluate(
  () =>
    new Promise((resolve) => {
      const plate = document.querySelector("[data-intro]");
      if (!plate) return resolve(-1);
      const started = Number(plate.getAttribute("data-intro")) || performance.now();
      const tick = () => {
        if (!document.querySelector("[data-intro]")) return resolve(Math.round(performance.now() - started));
        if (performance.now() - started > 8000) return resolve(-2);
        setTimeout(tick, 50);
      };
      tick();
    }),
);
log("opening animation on launch:", introMs >= 0 ? `${introMs}ms` : introMs === -1 ? "did not play" : "never finished");
if (introMs === -1) note("The opening animation did not play on a fresh launch.");
if (introMs === -2) note("The opening animation never finished (nothing to play under it).");
if (introMs > 4300) note(`The opening ran ${introMs}ms — it has to be over in about four seconds.`);
if (introMs >= 0 && introMs < 2000) note(`The opening ran only ${introMs}ms — it should be a real sequence, not a flash.`);
await sleep(700); // the tutorial board deals in under the lifted plate

// 1. First launch drops straight into the tutorial game — no menu.
if (await clickText("button", "Play")) note("First launch showed a Play menu instead of starting the game.");
const onBoard = (await p.$("main button[aria-pressed]")) != null;
log("first launch starts in-game:", onBoard);
if (!onBoard) note("First launch did not start directly in the tutorial level.");
const coach0 = await bodyText();
const welcome = /how to play/i.test(coach0) && /links all four groups/i.test(coach0);
log("welcome how-to overlay shown:", welcome);
if (!welcome) note("Welcome how-to overlay did not appear on first launch.");
log("tutorial is skippable:", /skip tutorial/i.test(coach0));
if (!/skip tutorial/i.test(coach0)) note("Welcome overlay has no Skip button.");
await p.screenshot({ path: `${SHOT}/r4-coach.png` });
if (!(await clickText("button", "Let's play"))) note("Welcome overlay has no 'Let's play' button.");
await sleep(800); // let the overlay finish its exit animation before touching the board

// 2. Concealment: neither the link WORD (STAR) nor the title ("Star Power")
//    may be visible mid-game.
const midText = await bodyText();
log("link word hidden mid-game:", !/\bSTAR\b/.test(midText) && !/star power/i.test(midText));
if (/\bSTAR\b/.test(midText)) note("Secret link word 'STAR' is visible during play.");
if (/star power/i.test(midText)) note("Level title leaks the link during play.");
if (!/\?\s*\?\s*\?/.test(midText)) note("Secret-link card is not showing a masked placeholder.");

// 3. The tutorial guides by THEME (no tile is highlighted) so the player thinks.
//    The copy is derived from the board's own first category, so it names that
//    theme and never the three tiles under it.
//    (scoped to the coach card — the tiles themselves are of course on screen)
const coachText = await p.evaluate(() => {
  // Ancestors match too, so take the tightest node that still holds the body.
  const cards = [...document.querySelectorAll("div")]
    .map((d) => d.innerText || "")
    .filter((t) => /Your move/.test(t) && /Submit/.test(t));
  return cards.sort((a, b) => a.length - b.length)[0] || "";
});
const namesTheme = /words for a celebrity/i.test(coachText);
const namesTiles = /\bICON\b|\bLEGEND\b|\bIDOL\b/.test(coachText);
log("tutorial prompts a theme, not exact words:", namesTheme && !namesTiles);
if (!namesTheme) note("Tutorial step-1 does not name the board's first theme.");
if (namesTiles) note("Tutorial step-1 gave away the three tiles.");

// 3b. Hint: reveal a category description (token-based, no solve, no star cost)
if (!/reveal a group's theme/i.test(midText)) note("Prominent hint button not found.");
await clickText("button", "Reveal a group's theme");
await sleep(350);
const afterHint = await bodyText();
log("hint revealed a category theme:", /words for a celebrity/i.test(afterHint));
if (!/words for a celebrity/i.test(afterHint)) note("Hint did not reveal a category theme.");
await p.screenshot({ path: `${SHOT}/r-hint.png` });

// 4. Solve all four groups (coach advances after the first; the last group is
//    submitted like any other — nothing solves itself)
await solveGroup(GROUPS[0]);
await clickText("button", "Got it"); // dismiss coach step 2
await sleep(200);
await solveGroup(GROUPS[1]);
await solveGroup(GROUPS[2]);
const threeDown = await bodyText();
// A tile of the last group, read from the fixture — hardcoding a word here
// went stale the moment the tutorial board's fourth group changed.
const lastTile = new RegExp(`\\b${GROUPS[3][0]}\\b`);
log("last group waits to be submitted:", lastTile.test(threeDown) && !/spell the secret word/i.test(threeDown));
if (!lastTile.test(threeDown)) note("The last group left the board before it was submitted.");
if (/spell the secret word/i.test(threeDown)) note("The finale opened with a group still on the board.");
await solveGroup(GROUPS[3]);
await sleep(700); // the fourth banner lands → guessing

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
// 6b. A first-timer's finale comes with a third coach card that reads every
//     group name out as a clue to the one word (derived from the board, so it
//     names the last theme too) — a toast is gone before the bank sinks in.
const finaleText = await bodyText();
const finaleCoached = /last step/i.test(finaleText) && /to be in a movie/i.test(finaleText) && /words for a celebrity/i.test(finaleText);
log("finale coach lists the group themes as clues:", finaleCoached);
if (!finaleCoached) note("Tutorial finale coach card did not list the group themes as clues.");
if (!/wrong tries cost nothing/i.test(finaleText)) note("Finale coach should say wrong tries are free.");

// 6c. Wrong words escalate: the first miss restates the clue, the second hands
//     over a free letter. The hint bank is untouched, and it never reaches the
//     last letter, so the player always spells the ending themselves.
const hintBadge = async () => {
  for (const h of await p.$$("main button")) {
    const txt = await h.evaluate((e) => e.innerText);
    if (/reveal a letter/i.test(txt)) return (txt.match(/(\d+)\s*$/) || [])[1] ?? null;
  }
  return null;
};
const usedCount = async () => (await p.$$("main button[aria-label$=', used']")).length;
const hintsBefore = await hintBadge();
for (const ch of ["T", "S", "A", "R"]) { await tapLetter(ch); await sleep(120); } // TSAR: not the word
await sleep(700);
const afterMiss1 = await bodyText();
log("first finale miss restates the clue:", /fit all four group names/i.test(afterMiss1));
if (!/fit all four group names/i.test(afterMiss1)) note("First wrong link word in the tutorial did not get the coach's nudge.");
if ((await usedCount()) !== 0) note("A wrong word left letters marked as used.");
for (const ch of ["R", "A", "T", "S"]) { await tapLetter(ch); await sleep(120); } // RATS: not the word
await sleep(700);
const afterMiss2 = await bodyText();
const freeLetter = /on the house/i.test(afterMiss2) && (await usedCount()) === 1;
log("second finale miss gives a free letter:", freeLetter);
if (!/on the house/i.test(afterMiss2)) note("Second wrong link word in the tutorial did not hand over a letter.");
if ((await usedCount()) !== 1) note(`Expected exactly one bank letter locked by the free reveal, saw ${await usedCount()}.`);
const hintsAfter = await hintBadge();
log("hint bank untouched by the free letter:", hintsBefore, "→", hintsAfter);
if (hintsBefore !== hintsAfter) note(`The tutorial's free letter spent a hint token (${hintsBefore} → ${hintsAfter}).`);
await p.screenshot({ path: `${SHOT}/r5b-finale-coach.png` });
// S is on the house now; spell the rest.
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

// 8. Back to the index: the unlock window extends after a clear, stars are
//    banked (3 per level, so the ceiling is LEVELS.length*3 — read off the page
//    rather than hard-coded, since the campaign grows), and a solved level is
//    listed by title while an unsolved one is not.
await clickText("button", "Levels");
// The map pays out the letter the clear just bought BEFORE it opens anything
// new, so a fresh entry is still locked for the length of the hand-over plus
// the unlock reveal. Wait both out or every entry reads as shut.
await sleep(5500);
const nodes = await p.$$eval("button[aria-label^='Level ']", (els) =>
  els.map((e) => ({ label: e.getAttribute("aria-label") || "", disabled: e.disabled })),
);
log("index entries:", nodes.length, "locked:", nodes.filter((n) => n.disabled).length);
// Chapters the player can't reach yet are a single teaser line with no entries,
// and the boss is the panel at the foot of the chapter rather than an entry —
// so after clearing level 1 the list is chapter 1's five non-boss levels.
if (nodes.length !== 5) note(`Expected chapter 1's 5 entries, found ${nodes.length}.`);
// The letter that level bought is on the chapter's rail, and only that one.
const rail = await p.$$eval("[aria-label^='Chapter key']", (els) => els[0]?.getAttribute("aria-label") || "");
log("chapter 1 rail:", rail);
if (!/1 of 5 letters/i.test(rail)) note(`Clearing level 1 did not bank exactly one letter (${rail}).`);
if (nodes[0]?.disabled) note("Level 1 should be unlocked after clearing it.");
if (nodes[3]?.disabled) note("Level 4 should be unlocked after clearing level 1 (lookahead 3).");
if (!nodes[4]?.disabled) note("Level 5 should still be locked after clearing only level 1.");
const starTotal = (await bodyText()).match(/⭐\s*(\d+)\/(\d+)/);
if (!starTotal || starTotal[1] !== "3") note(`Star total not updated to 3 (saw ${starTotal ? starTotal[0] : "nothing"}).`);
else if (Number(starTotal[2]) % 3 !== 0) note(`Star ceiling ${starTotal[2]} is not 3 per level.`);

// The index names levels you've solved and only those. A title is a strong hint
// at the link ("Star Power" → STAR), so leaking one for an unplayed level would
// spoil it before the player ever opens the board.
const idxText = await bodyText();
log("solved level listed by title:", /star power/i.test(idxText));
if (!/star power/i.test(idxText)) note("A solved level is not listed by its title.");
for (const [lvl, title] of [[2, "Packed Trunk"], [3, "Ring of Truth"], [6, "Stick With It"]]) {
  if (idxText.includes(title)) note(`Index leaks level ${lvl}'s title ("${title}") before it's solved.`);
}
// And the thing most visits are for: play the next level straight off the card.
if (!/up next/i.test(idxText)) note("Index has no 'Up next' card.");
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
await p.evaluate(() => localStorage.setItem("wordgrid:tutorial", "1"));
await p.goto(BASE + "?debug", { waitUntil: "networkidle0" }); // unlock all levels for the test
await sleep(400);
// Same visit, back at the menu: the opening has had its one run.
const replayed = (await p.$("[data-intro]")) != null;
log("opening does not replay within the visit:", !replayed);
if (replayed) note("The opening animation replayed on a later return to the menu in the same visit.");
await clickText("button", "Browse all"); // Home's CTA now plays; the map is its own link
await sleep(500);
const bossNode = await p.$("button[aria-label^='Play the boss']");
if (!bossNode) note("No boss node found for the boss test.");
else {
  await bossNode.click();
  await sleep(600);
  // The briefing opens itself on a boss you haven't beaten, and it has to say
  // what the twist DOES — a name on its own ("scrambled tiles") is the thing
  // players couldn't read the mechanic out of.
  const brief = await bodyText();
  const briefed = /boss fight/i.test(brief) && /anagram/i.test(brief) && /what changes/i.test(brief);
  log("boss briefing explains the twist:", briefed);
  if (!briefed) note("The boss briefing did not explain the scramble twist.");
  await p.screenshot({ path: `${SHOT}/r9-boss-brief.png` });

  if (!(await clickText("button", "Got it"))) note("The boss briefing has no dismiss button.");
  await sleep(400);
  const bt = await bodyText();
  log("first boss shows scrambled tiles:", /scrambled/i.test(bt));
  if (!/scrambled/i.test(bt)) note("First boss did not show the scrambled-tiles label.");
  // …and the rule survives the dismissal, so a player who forgets mid-fight
  // can still read it (and tap it to get the briefing back).
  const rule = /unscramble it, then group/i.test(bt);
  log("boss rule stays on the board:", rule);
  if (!rule) note("The boss rule strip is not on the board after the briefing.");
  await p.screenshot({ path: `${SHOT}/r9-boss.png` });

  const reopened = await clickText("button", "unscramble it, then group");
  await sleep(400);
  const back = /what changes/i.test(await bodyText());
  log("rule strip reopens the briefing:", reopened && back);
  if (!(reopened && back)) note("Tapping the boss rule did not reopen the briefing.");
  await clickText("button", "Got it");
  await sleep(300);
}

// 11. On a loss, the secret link must STAY hidden (so it can be guessed on replay)
await p.evaluate(() => {
  localStorage.clear();
  localStorage.setItem("wordgrid:tutorial", "1"); // skip the coach for this run
});
await p.goto(BASE, { waitUntil: "networkidle0" });
await sleep(400);
await clickText("button", "Browse all"); // Home's CTA now plays; the map is its own link
await sleep(400);
await (await p.$("button[aria-label^='Level 1,']")).click();
await sleep(500);
// Four distinct non-groups → four mistakes → loss (each spans multiple groups).
const WRONG = [
  ["ICON", "MOON", "MEDAL"],
  ["ICON", "MOON", "APPEAR"],
  ["ICON", "COMET", "MEDAL"],
  ["ICON", "COMET", "APPEAR"],
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

// 11b. Chapter keys: the boss door. Seeded rather than played — clearing five
//      levels for real would take longer than the rest of this script.
{
  const CH1 = ["star", "trunk", "ring", "bug", "bank"]; // chapter 1's non-boss levels
  await p.setViewport({ width: 430, height: 880, deviceScaleFactor: 1 });
  await p.goto(BASE, { waitUntil: "networkidle0" });
  await p.evaluate((ids) => {
    localStorage.clear();
    localStorage.setItem("wordgrid:tutorial", "1");
    const stars = {};
    ids.forEach((id) => (stars[id] = 3));
    localStorage.setItem("wordgrid:progress", JSON.stringify({
      stars, streak: 5, bestStreak: 5, linksGuessed: 5, best: {}, daily: { lastDate: "", streak: 0 },
      achievements: [], hints: 3, history: [], score: 2000, endlessBest: 0,
      seen: ids, keys: [],
    }));
  }, CH1);
  await p.reload({ waitUntil: "networkidle0" });
  await sleep(600);
  await clickText("button", "Browse all");
  await sleep(1000);

  // A sealed door offers no way in at all — there is no boss button to disable.
  const shut = (await p.$("button[aria-label^='Play the boss']")) == null;
  const before = await bodyText();
  log("boss shut behind its key:", shut);
  if (!shut) note("Chapter 1's boss should be locked until its key is spelled.");
  if (!/Unseal/i.test(before)) note("Key is ready but the index offers no way to open it.");
  // Every letter is on the rail, so the door names the fight — but the keyword
  // itself must not be sitting on the page before it's spelled.
  if (!/scrambled tiles/i.test(before)) note("A ready door does not name the boss's twist.");
  if (/\bSPARK\b/.test(before)) note("The index leaks the chapter keyword before it's spelled.");
  // The rail carries the letters in a jumble; in the answer's order it would
  // hand over the anagram for free.
  const railLetters = await p.$$eval("[aria-label^='Chapter key'] .sr-only", (els) =>
    els.map((e) => (e.textContent.match(/^Letter (\w)$/) || [])[1]).filter(Boolean).join(""),
  );
  log("rail letters:", railLetters);
  if ([...railLetters].sort().join("") !== "AKPRS") note(`The rail is not SPARK's letters: ${railLetters}`);
  if (railLetters === "SPARK") note("The rail spells the keyword before it's earned.");

  await clickText("button", "Unseal");
  await sleep(600);
  const panel = await bodyText();
  if (!/chapter key/i.test(panel)) note("Chapter key panel did not open.");
  if (/\bSPARK\b/.test(panel)) note("The key panel gives the answer away.");
  // The bank must be exactly the banked letters — no decoy padding, or the
  // "one letter per level" promise is a lie.
  const tiles = await p.$$eval("button[aria-label^='Letter ']", (els) => els.map((e) => e.textContent.trim()));
  log("key bank tiles:", tiles.join(""));
  if (tiles.length !== 5) note(`Key bank should hold exactly the 5 banked letters, got ${tiles.length}.`);
  if ([...tiles].sort().join("") !== "AKPRS") note(`Key bank letters are not SPARK's: ${tiles.join("")}`);
  await p.screenshot({ path: `${SHOT}/r11-key.png` });

  for (const ch of "SPARK") {
    const ok = await p.evaluate((c) => {
      const btn = [...document.querySelectorAll("button[aria-label^='Letter ']")]
        .find((e) => !e.disabled && e.textContent.trim() === c);
      if (btn) { btn.click(); return true; }
      return false;
    }, ch);
    if (!ok) note(`Could not tap key letter ${ch}.`);
    await sleep(160);
  }
  // The door waits for the key panel to dismiss itself before it swings, so
  // the reorder and the flash aren't spent under something covering them.
  await sleep(3600);
  const opened = (await p.$("button[aria-label^='Play the boss']")) != null;
  log("boss opens once the key is spelled:", opened);
  if (!opened) note("Spelling the chapter key did not open the boss.");
  // …and the jumble settles into the keyword, which is the trophy.
  if (!/\bSPARK\b/.test(await bodyText())) note("The solved rail does not show the keyword.");
  const saved = await p.evaluate(() => JSON.parse(localStorage.getItem("wordgrid:progress")).keys);
  if (!saved.includes(0)) note("Solved chapter key was not persisted.");
  await p.screenshot({ path: `${SHOT}/r11-key-open.png` });
}

// 12. The 1280x720 landscape iframe — CrazyGames' most common desktop embed.
//     The index has to sit above the fold there like the game screen does: the
//     collection scrolls inside its own pane, the page itself never scrolls.
//     Checked with everything solved, the longest the list can ever get.
await p.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
await p.evaluate(() => localStorage.setItem("wordgrid:tutorial", "1"));
await p.goto(BASE + "?debug", { waitUntil: "networkidle0" }); // everything open
await sleep(500);
await clickText("button", "Browse all");
await sleep(900);
const embed = await p.evaluate(() => ({
  down: document.documentElement.scrollHeight - window.innerHeight,
  across: document.documentElement.scrollWidth - window.innerWidth,
  pane: !!document.querySelector(".lg\\:overflow-y-auto"),
}));
log("1280x720 embed overflow:", `${embed.down}px down, ${embed.across}px across`);
if (embed.down > 0) note(`Index overflows the 1280x720 embed by ${embed.down}px — it should fit above the fold.`);
if (embed.across > 0) note(`Index scrolls horizontally at 1280x720 by ${embed.across}px.`);
if (!embed.pane) note("Index has no internal scroll pane at lg; the page will scroll instead.");
await p.screenshot({ path: `${SHOT}/r11-embed.png` });

await b.close();
console.log("\n=== CONSOLE ERRORS ===");
console.log(errors.length ? errors.join("\n") : "(none)");
console.log("\n=== ISSUES ===");
console.log(issues.length ? issues.map((s, i) => `${i + 1}. ${s}`).join("\n") : "(none)");
process.exit(issues.length ? 1 : 0);
