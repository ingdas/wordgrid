import puppeteer from "puppeteer";

const SHOT = "/tmp/claude-0/-home-user-wordgrid/7884fd69-a405-5300-aba5-f0d64da6b15b/scratchpad";
const BASE = process.env.BASE || "http://localhost:4200/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log("•", ...a);

// Puzzle 0 (STAR) groups — pivot STAR + two spokes each.
const GROUPS = [
  ["STAR", "ICON", "LEGEND"],
  ["STAR", "MOON", "COMET"],
  ["STAR", "JELLY", "CAT"],
  ["STAR", "HEART", "ARROW"],
];

const issues = [];
const note = (s) => {
  issues.push(s);
  log("ISSUE:", s);
};

async function newPage(browser, { reduce = false } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width: 430, height: 880, deviceScaleFactor: 2 });
  if (reduce) await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
  page.__errors = errors;
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.evaluate(() => localStorage.clear()).catch(() => {});
  await page.reload({ waitUntil: "networkidle0" });
  await sleep(300);
  return page;
}

async function dismissHelp(page) {
  const dlg = await page.$('[role="dialog"]');
  if (!dlg) return false;
  const btns = await page.$$('[role="dialog"] button');
  for (const b of btns) {
    if (/Got it/.test(await b.evaluate((e) => e.textContent))) {
      await b.click();
      break;
    }
  }
  // Wait until the modal is fully detached so it can't intercept clicks.
  await page.waitForFunction(() => !document.querySelector('[role="dialog"]'), { timeout: 4000 });
  await sleep(150);
  return true;
}

async function tileInfo(page) {
  return page.$$eval("main button[aria-pressed]", (els) =>
    els.map((e) => ({
      word: e.textContent.replace(/◆/g, "").trim(),
      pressed: e.getAttribute("aria-pressed") === "true",
      disabled: e.disabled,
      overflow: e.scrollWidth > e.clientWidth + 1,
      w: Math.round(e.getBoundingClientRect().width),
    }))
  );
}

async function clickWord(page, word) {
  const handles = await page.$$("main button[aria-pressed]");
  for (const h of handles) {
    if ((await h.evaluate((e) => e.textContent.replace(/◆/g, "").trim())) === word) {
      await h.click();
      return true;
    }
  }
  return false;
}

async function clickLabeled(page, sel, text) {
  for (const h of await page.$$(sel)) {
    if ((await h.evaluate((e) => e.textContent)).includes(text)) {
      await h.click();
      return true;
    }
  }
  return false;
}

async function bannerCount(page) {
  // Banners are .rounded-2xl.bg-gradient-to-r; this avoids matching the
  // "Next puzzle" button which is .rounded-full.bg-gradient-to-r.
  return page.$$eval("main .rounded-2xl.bg-gradient-to-r", (e) => e.length).catch(() => 0);
}

async function mistakesLeft(page) {
  return page
    .$eval('[role="img"][aria-label*="remaining"]', (e) => {
      const m = e.getAttribute("aria-label").match(/(\d+) of/);
      return m ? Number(m[1]) : null;
    })
    .catch(() => null);
}

async function submitGroup(page, group) {
  for (const w of group) await clickWord(page, w);
  // Make sure the intended tiles are actually selected before submitting.
  const pressed = (await tileInfo(page)).filter((x) => x.pressed).map((x) => x.word).sort();
  const want = [...group].sort();
  if (JSON.stringify(pressed) !== JSON.stringify(want)) {
    await clickLabeled(page, "main button", "Clear").catch(() => {});
    await sleep(100);
    for (const w of group) await clickWord(page, w);
  }
  await clickLabeled(page, "main button", "Submit");
  await sleep(450);
}

// ====================================================================
const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

// --- Test A: first-visit help, tiles, solve flow, win reveal --------
let page = await newPage(browser);
const autoHelp = !!(await page.$('[role="dialog"]'));
log("help auto-opened:", autoHelp);
if (!autoHelp) note("How-to-play did not auto-open on first visit.");
await page.screenshot({ path: `${SHOT}/01-help.png` });
await dismissHelp(page);
await page.screenshot({ path: `${SHOT}/02-start.png` });

let info = await tileInfo(page);
if (info.length !== 9) note(`Expected 9 tiles, found ${info.length}.`);
const overflow = info.filter((x) => x.overflow).map((x) => x.word);
if (overflow.length) note(`Tiles overflow: ${overflow.join(", ")}`);
const widths = [...new Set(info.map((x) => x.w))];
if (widths.length > 1) note(`Non-uniform tile widths: ${widths.join(",")}`);
log("tiles:", info.length, "uniform width:", widths.length === 1, "overflow:", overflow.length);

// Solve first three groups. Spokes should LEAVE the board (no in-grid colour),
// and no remaining tile should ever be coloured/disabled during play.
for (let i = 0; i < 3; i++) {
  await submitGroup(page, GROUPS[i]);
  const bc = await bannerCount(page);
  if (bc !== i + 1) note(`After solving group ${i + 1}, banner count = ${bc} (expected ${i + 1}).`);
  const info2 = await tileInfo(page);
  const expectedTiles = 9 - (i + 1) * 2;
  if (info2.length !== expectedTiles)
    note(`After ${i + 1} solves, ${info2.length} tiles on board (expected ${expectedTiles}).`);
  const colouredOrDisabled = info2.filter((x) => x.disabled).length;
  if (colouredOrDisabled > 0)
    note(`After ${i + 1} solves, ${colouredOrDisabled} board tiles are disabled/locked (expected 0 mid-play).`);
  // Concealment: the pivot (STAR) must still be present and look like any other tile.
  const pivotStillPlain = info2.some((x) => x.word === "STAR");
  if (!pivotStillPlain) note("Pivot tile vanished from the board mid-play.");
  // Strongest check: every unselected board tile must share one identical
  // background, so the pivot cannot be spotted by colour.
  const styles = await page.$$eval("main button[aria-pressed='false']", (els) =>
    els.map((e) => {
      const s = getComputedStyle(e);
      return `${s.backgroundColor}|${s.backgroundImage}`;
    })
  );
  const distinct = [...new Set(styles)];
  if (distinct.length > 1)
    note(`Mid-play tiles have ${distinct.length} distinct backgrounds — pivot derivable by colour.`);
}
const firstBanner = await page.$eval("main .bg-gradient-to-r", (e) => e.innerText).catch(() => "");
log("first banner:", JSON.stringify(firstBanner.replace(/\n/g, " ")));
if (!/SHARED/.test(firstBanner)) note("Pivot not masked as 'SHARED' in banner during play.");
if (/STAR/.test(firstBanner)) note("Pivot word 'STAR' leaked into banner during play.");

await page.screenshot({ path: `${SHOT}/03-three-solved.png` });
// Wait for auto-solve of the 4th group + win.
await sleep(1200);
const mainText = await page.$eval("main", (e) => e.innerText);
const won = /shared word was/i.test(mainText);
log("auto-solved last + won:", won);
if (!won) note("Final group did not auto-solve into a win.");
const reveal = mainText.replace(/\n/g, " ").match(/shared word was\s+([A-Z]+)/i);
log("reveal text:", reveal ? reveal[1] : "(none)");
if (!reveal || reveal[1] !== "STAR") note("Win card did not reveal the shared word (STAR).");
await page.screenshot({ path: `${SHOT}/04-win.png` });

// confetti present without reduced motion?
const confettiOn = await page.evaluate(() => document.querySelectorAll(".z-50 span").length);
log("confetti pieces (motion on):", confettiOn);
await page.close();

// --- Test B: repeated wrong guess must not cost a life --------------
page = await newPage(browser);
await dismissHelp(page);
const before = await mistakesLeft(page);
const wrong = ["ICON", "MOON", "HEART"]; // three different spokes -> never a group
await submitGroup(page, wrong);
const afterFirst = await mistakesLeft(page);
await clickLabeled(page, "main button", "Clear");
await sleep(150);
await submitGroup(page, wrong);
const afterRepeat = await mistakesLeft(page);
log(`mistakes left: start=${before} afterWrong=${afterFirst} afterRepeat=${afterRepeat}`);
if (afterFirst === null) note("Could not read mistakes counter.");
else {
  if (afterFirst !== before - 1) note(`A wrong guess changed mistakes by ${before - afterFirst} (expected 1).`);
  if (afterRepeat < afterFirst) note("Repeated identical wrong guess still cost a life.");
}
// also: a guess missing the pivot should give the pivot hint
const toastTxt = await page.$eval("body", (e) => e.innerText).catch(() => "");
log("pivot-hint shown for no-pivot guess:", /shares one word/i.test(toastTxt));
await page.close();

// --- Test C: lose flow reveals everything ---------------------------
page = await newPage(browser);
await dismissHelp(page);
const wrongs = [
  ["ICON", "MOON", "HEART"],
  ["ICON", "MOON", "ARROW"],
  ["ICON", "MOON", "JELLY"],
  ["ICON", "MOON", "CAT"],
];
for (const g of wrongs) {
  await submitGroup(page, g);
  await clickLabeled(page, "main button", "Clear").catch(() => {});
  await sleep(120);
}
await sleep(500);
const lostText = await page.$eval("main", (e) => e.innerText);
log("lose card shown:", /Out of guesses/i.test(lostText));
if (!/Out of guesses/i.test(lostText)) note("Loss state did not trigger after 4 mistakes.");
const lostBanners = await bannerCount(page);
log("banners revealed on loss:", lostBanners, "(expect 4)");
if (lostBanners !== 4) note(`On loss, ${lostBanners} banners revealed (expected 4).`);
await page.screenshot({ path: `${SHOT}/06-lost.png` });
await page.close();

// --- Test D: reduced motion -> no confetti --------------------------
page = await newPage(browser, { reduce: true });
await dismissHelp(page);
for (let i = 0; i < 3; i++) await submitGroup(page, GROUPS[i]);
await sleep(1200);
const confettiReduced = await page.evaluate(() => document.querySelectorAll(".z-50 span").length);
log("confetti under reduced-motion (expect 0):", confettiReduced);
if (confettiReduced > 0) note("Confetti rendered despite prefers-reduced-motion.");
await page.screenshot({ path: `${SHOT}/05-reduced-win.png` });

// --- Desktop screenshot for good measure ----------------------------
await page.setViewport({ width: 1100, height: 900, deviceScaleFactor: 1 });
await page.reload({ waitUntil: "networkidle0" });
await dismissHelp(page);
await page.screenshot({ path: `${SHOT}/07-desktop.png` });

const allErrors = page.__errors;
await browser.close();

console.log("\n=== CONSOLE ERRORS ===");
console.log(allErrors.length ? allErrors.join("\n") : "(none)");
console.log("\n=== ISSUES FOUND ===");
console.log(issues.length ? issues.map((s, i) => `${i + 1}. ${s}`).join("\n") : "(none)");
