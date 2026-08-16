// Headless regression cover for Pairs mode, alongside scripts/playtest.mjs.
//
//   npm run build && npx vite preview --port 4173
//   npm install --no-save puppeteer
//   BASE=http://localhost:4173/ node scripts/pairs.test.mjs
//
// Three checks, two of them repros of iteration-24 bugs:
//   1. a clean run — matching → a deliberate wrong couple → coupling → finale
//   2. "🔀 New" pressed inside the 450ms phase-opening window must not carry a
//      stale timer onto the fresh board (it opened coupling with nothing placed)
//   3. a burst of taps must cost exactly one move and flip exactly two cards
//      (stale guards billed a move per tap and let a card pair with itself)
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

/** Home → Pairs, from a cleared save (first launch drops into the tutorial). */
async function openPairs() {
  await p.goto(BASE + "?debug", { waitUntil: "networkidle0" });
  await p.evaluate(() => localStorage.clear());
  await p.goto(BASE + "?debug", { waitUntil: "networkidle0" });
  await sleep(600);
  await clickText("button", "Skip tutorial");
  await sleep(600);
  await clickText("button", "Levels");
  await sleep(600);
  await p.evaluate(() =>
    [...document.querySelectorAll("button")].find((e) => e.getAttribute("aria-label") === "Home")?.click()
  );
  await sleep(600);
  if (!(await clickText("button", "Pairs"))) throw new Error("could not open Pairs");
  await sleep(700);
}

// A placed card is the only one carrying an inline ink colour, which survives
// the red "wrong" flash (that swaps classes but never sets a colour).
const cards = () =>
  p.evaluate(() =>
    [...document.querySelectorAll("main .grid > button")].map((btn, i) => {
      const front = btn.querySelectorAll("div > div")[1];
      const label = btn.getAttribute("aria-label") || "";
      const placed = !!(front && front.style.color);
      return {
        i,
        label,
        faceDown: label === "Face-down card",
        placed,
        leftover: !placed,
        shape: placed ? (front.textContent || "").trim().charAt(0) : "",
        // A face-up card's front sits at rotateY(180deg) — a matrix3d with -1
        // in the x scale. Identity means it is facing away, and
        // backface-visibility has made it invisible.
        turned: front ? /^matrix3d\(-1/.test(getComputedStyle(front).transform) : false,
      };
    })
  );
const phaseText = () =>
  p.evaluate(() =>
    [...document.querySelectorAll("p")]
      .map((e) => e.textContent.trim())
      .find((s) => /Flip two cards|Four left|tap a card from the group|Spell the word/.test(s)) || "(none)"
  );
const moveCount = async () => {
  const m = (await p.evaluate(() => document.body.innerText)).match(/(\d+)\s+moves?/i);
  return m ? Number(m[1]) : null;
};
const tap = async (i) => { (await p.$$("main .grid > button"))[i].click(); };

/** Flip pairs until `stopAt` matched cards are down. Returns false if stuck. */
async function playMatching(stopAt = 8, onFourth = null) {
  const different = new Set();
  for (let guard = 0; guard < 120; guard++) {
    const st = await cards();
    const free = st.filter((c) => c.faceDown).map((c) => c.i);
    if (free.length < 2) return true;
    let pick = null;
    outer: for (const a of free) for (const bb of free) {
      if (a >= bb || different.has(`${a}|${bb}`)) continue;
      pick = [a, bb]; break outer;
    }
    if (!pick) return false;
    const before = await moveCount();
    await tap(pick[0]);
    await sleep(90);
    await tap(pick[1]);
    await sleep(150);
    const after = await moveCount();
    if (after !== before + 1) note(`a flipped pair cost ${after - before} moves, not 1`);
    await sleep(430); // the hit path resolves at 500ms from the second tap
    const st2 = await cards();
    const hit = st2[pick[0]].placed && st2[pick[1]].placed;
    const placed = st2.filter((c) => c.placed).length;
    if (placed % 2 !== 0) note(`an odd number of cards is matched (${placed}) — matches come in pairs`);
    if (hit && placed >= stopAt) {
      if (onFourth) await onFourth();
      return true;
    }
    if (!hit) { different.add(`${pick[0]}|${pick[1]}`); await sleep(520); }
  }
  return false;
}

// ---------------------------------------------------------------- 1. a run
await openPairs();
log("check 1: a clean run, including a wrong couple");
if (!(await playMatching(8))) note("could not clear the matching phase");
await sleep(900);
if (!(await phaseText()).startsWith("Four left")) note("four pairs down did not open the coupling phase");
const leftovers = (await cards()).filter((c) => c.leftover);
if (leftovers.length !== 4) note(`expected 4 leftovers, got ${leftovers.length}`);

// Hold a leftover and tap groups until one is wrong: the mistake must cost a
// move, keep the card in hand, and place nothing.
let sawWrong = false;
for (const lo of leftovers) {
  if (sawWrong) break;
  await tap(lo.i);
  await sleep(200);
  for (const g of [...new Set((await cards()).filter((c) => c.placed).map((c) => c.shape))]) {
    const target = (await cards()).find((c) => c.placed && c.shape === g);
    const before = await moveCount();
    await tap(target.i);
    await sleep(140);
    const wrong = /Not that group/.test(await p.evaluate(() => document.body.innerText));
    const after = await moveCount();
    if (after !== before + 1) note(`a couple attempt cost ${after - before} moves, not 1`);
    if (wrong) {
      sawWrong = true;
      const held = (await cards()).find((c) => c.i === lo.i);
      if (!held.leftover) note("a wrong couple placed the card anyway");
      // The card is still in hand — it also has to still be VISIBLE. The
      // shake used to strip the front face's half-turn, so the card the
      // player was holding went blank for the rest of the round.
      await sleep(1400); // well past the 700ms red flash
      const settled = (await cards()).find((c) => c.i === lo.i);
      if (!settled.turned)
        note(`the held card went invisible after a wrong couple (front face is not turned to camera)`);
      log(`  wrong couple: ${lo.label} → ${g} — kept in hand, still visible, +1 move ✓`);
    }
    break;
  }
}
if (!sawWrong) log("  (no wrong couple came up on this board)");

// Finish the board, then spell the link.
for (let guard = 0; guard < 60; guard++) {
  const los = (await cards()).filter((c) => c.leftover);
  if (!los.length) break;
  const lo = los[0];
  await tap(lo.i);
  await sleep(150);
  const placedNow = (await cards()).filter((c) => c.placed);
  for (const g of [...new Set(placedNow.map((c) => c.shape))]) {
    await tap(placedNow.find((c) => c.shape === g).i);
    await sleep(260);
    if (!(await cards())[lo.i].leftover) break;
    await sleep(600);
  }
  await sleep(700);
}
await sleep(1300);
if (!(await phaseText()).startsWith("Spell the word")) note("a full board did not open the spell phase");
await clickText("button", "Show me the word");
await sleep(1200);
if (!/Board cleared/.test(await p.evaluate(() => document.body.innerText))) note("the end card never opened");
if (SHOT) await p.screenshot({ path: `${SHOT}/pairs-endcard.png` });
await clickText("button", "Next puzzle");
await sleep(1400);
if ((await cards()).filter((c) => c.faceDown).length !== 12) note("Next puzzle did not deal a fresh face-down board");
if ((await moveCount()) !== 0) note("Next puzzle did not reset the move counter");
log(`  run complete, end card and Next puzzle clean ✓`);

// ------------------------------------------------- 2. New races a phase timer
await openPairs();
log("check 2: 🔀 New pressed inside the phase-opening window");
await playMatching(8, async () => {
  await clickText("button", "New");
  await sleep(60);
  if ((await cards()).filter((c) => c.faceDown).length !== 12) note("New did not deal a fresh face-down board");
  await sleep(1200);
  const st = await cards();
  const phase = await phaseText();
  log(`  1.2s after New: "${phase}" | face-down ${st.filter((c) => c.faceDown).length}, placed ${st.filter((c) => c.placed).length}`);
  if (!phase.startsWith("Flip two cards"))
    note(`a stale timer carried onto the new board — phase is "${phase}"`);
  if (st.filter((c) => c.faceDown).length !== 12)
    note("the new board did not stay face down");
});

// ----------------------------------------------------------- 3. a tap burst
await openPairs();
log("check 3: a burst of taps");
for (let round = 0; round < 3; round++) {
  const before = await moveCount();
  await p.evaluate(() => [...document.querySelectorAll("main .grid > button")].forEach((btn) => btn.click()));
  await sleep(120);
  const st = await cards();
  const faceUp = st.filter((c) => !c.faceDown).length;
  const after = await moveCount();
  if (after !== before + 1) note(`a 12-tap burst cost ${after - before} moves, not 1`);
  if (faceUp !== 2) note(`a 12-tap burst turned ${faceUp} cards face up, not 2`);
  await sleep(1200);
  const settled = await cards();
  if ((await phaseText()).startsWith("Flip two cards")) {
    const stranded = settled.filter((c) => !c.faceDown && !c.placed).length;
    if (stranded) note(`${stranded} card(s) left face up in the matching phase without matching`);
  }
}
log("  bursts cost one move and flip two cards ✓");

console.log("\n=== CONSOLE ERRORS ===");
console.log(errors.length ? errors.join("\n") : "(none)");
console.log("\n=== ISSUES ===");
console.log(issues.length ? issues.join("\n") : "(none)");
await b.close();
process.exit(issues.length || errors.length ? 1 : 0);
