// Headless cover for the iteration-33 work, alongside scripts/playtest.mjs.
//
//   npm run build && npx vite preview --port 4173
//   npm install --no-save puppeteer
//   BASE=http://localhost:4173/ node scripts/iteration33.playtest.mjs
//
// Four checks, one per change:
//   1. daily quests — the card is on the home screen, and clearing a board
//      moves it and pays the hint
//   2. the link mask is one ? per letter of the actual pivot
//   3. modals trap Tab and hand focus back on Escape
//   4. no durable storage — the game still plays, and says so
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

async function seed(progress = {}, extra = {}) {
  await p.goto(BASE, { waitUntil: "networkidle0" });
  await p.evaluate((prog, more) => {
    localStorage.clear();
    localStorage.setItem("wordgrid:tutorial", "1");
    localStorage.setItem("wordgrid:progress", JSON.stringify(prog));
    for (const [k, v] of Object.entries(more)) localStorage.setItem(k, v);
  }, progress, extra);
  await p.goto(BASE + "?debug", { waitUntil: "networkidle0" }); // everything open, free hints
  await sleep(700);
}

async function openTray() {
  const btn = await p.$('button[aria-label="Debug tools"]');
  if (!btn) return false;
  if ((await btn.evaluate((e) => e.getAttribute("aria-expanded"))) !== "true") await btn.click();
  await sleep(250);
  return true;
}

// 1. The quest card, and a quest actually paying out. ------------------------
{
  await seed({ hints: 3 });
  const home = await bodyText();
  log("home shows today's quests:", /quest/i.test(home));
  if (!/quest/i.test(home)) note("No quest card on the home screen.");

  const rows = await p.$$eval("li", (els) =>
    els.filter((e) => /💡|✓|\d\/\d/.test(e.innerText) && e.innerText.length < 60).length
  );
  log("quest rows on the card:", rows);
  if (rows < 3) note(`Expected 3 quest rows, saw ${rows}.`);

  // The rank/XP bar is gone: nothing on the home screen claims a level.
  log("no rank/XP bar left behind:", !/\bXP\b|\bLv \d/.test(home));
  if (/\bXP\b|\bLv \d/.test(home)) note("Home still shows the removed rank ladder.");

  if (SHOT) await p.screenshot({ path: `${SHOT}/home-quests.png` });

  // Auto-solve a board: that's "solve 1", and whatever else the day drew.
  const before = await p.evaluate(() => JSON.parse(localStorage.getItem("wordgrid:progress") || "{}"));
  await clickText("button", "Play");
  await sleep(700);
  if (!(await openTray())) note("No debug tray in game.");
  await clickText("button", "Auto-solve level");
  await sleep(2500);
  const after = await p.evaluate(() => JSON.parse(localStorage.getItem("wordgrid:progress") || "{}"));
  const counted = after.quests && Object.keys(after.quests.counts || {}).length > 0;
  log("the win moved today's quests:", counted, JSON.stringify(after.quests?.counts ?? {}));
  if (!counted) note("A cleared board recorded no quest progress.");
  log("hints before/after:", before.hints ?? 3, "→", after.hints);
  if ((after.hints ?? 0) < (before.hints ?? 3) + 1) note("A cleared board paid no hint at all.");
  if (after.quests?.claimed?.length) log("quests paid out:", after.quests.claimed.join(", "));
}

// 2. The link mask counts the pivot's letters. --------------------------------
{
  await seed({ hints: 3 });
  await clickText("button", "Play");
  await sleep(900);
  const mask = await p.evaluate(() => {
    const el = [...document.querySelectorAll("span")].find((e) => /^\?( \?)+$/.test(e.textContent.trim()));
    return el ? { text: el.textContent.trim(), label: el.getAttribute("aria-label") } : null;
  });
  if (!mask) note("No masked link card on the board.");
  else {
    const count = mask.text.split(" ").length;
    // Level 1 is the tutorial board — its pivot is STAR.
    log("link mask:", mask.text, "→", count, "letters;", mask.label);
    if (count !== 4) note(`The STAR board's mask shows ${count} marks, not 4.`);
  }
  if (SHOT) await p.screenshot({ path: `${SHOT}/link-mask.png` });
}

// 3. Modals keep the keyboard inside, and give it back. -----------------------
{
  await seed({ hints: 3 });
  const gear = await p.$('button[aria-label="Settings"]');
  if (!gear) note("Home has no Settings button.");
  else await gear.click();
  await sleep(500);

  const inside = await p.evaluate(async () => {
    const dialog = document.querySelector('[role="dialog"]');
    const focusedInside = () => dialog.contains(document.activeElement);
    return { start: focusedInside(), dialog: !!dialog };
  });
  log("focus starts inside the dialog:", inside.start);
  if (!inside.start) note("Opening a modal left focus outside it.");

  let escaped = 0;
  for (let i = 0; i < 25; i++) {
    await p.keyboard.press("Tab");
    const still = await p.evaluate(() => {
      const d = document.querySelector('[role="dialog"]');
      return d ? d.contains(document.activeElement) : false;
    });
    if (!still) escaped++;
  }
  log("tab escapes out of the dialog:", escaped, "of 25");
  if (escaped > 0) note(`Tab left the modal ${escaped} times — the trap is leaking.`);

  await p.keyboard.down("Shift");
  await p.keyboard.press("Tab");
  await p.keyboard.up("Shift");
  const backwards = await p.evaluate(() => {
    const d = document.querySelector('[role="dialog"]');
    return d ? d.contains(document.activeElement) : false;
  });
  log("shift-tab stays inside too:", backwards);
  if (!backwards) note("Shift-Tab walked out of the modal.");

  await p.keyboard.press("Escape");
  await sleep(500);
  const restored = await p.evaluate(() => ({
    closed: !document.querySelector('[role="dialog"]'),
    focus: document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.tagName,
  }));
  log("escape closed it, focus went back to:", restored.focus, "| closed:", restored.closed);
  if (!restored.closed) note("Escape did not close the modal.");
  if (restored.focus !== "Settings") note(`Focus was not restored to the opener (got ${restored.focus}).`);
}

// 4. A browser with no storage at all. ---------------------------------------
{
  await p.goto(BASE, { waitUntil: "networkidle0" });
  await p.evaluate(() => localStorage.clear());
  // Refuse localStorage the way a partitioned embed does: the object is there,
  // and writing to it throws.
  await p.evaluateOnNewDocument(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: () => null,
        setItem: () => { throw new Error("blocked"); },
        removeItem: () => {},
        clear: () => {},
      },
    });
  });
  await p.goto(BASE, { waitUntil: "networkidle0" });
  await sleep(1200);
  const playable = await p.$$eval("button", (els) => els.some((e) => /play|start/i.test(e.innerText)));
  log("the game still loads and is playable:", playable);
  if (!playable) note("A storage-less browser broke the game.");

  // The warning only fires once the mirror has finished waiting for the SDK.
  await sleep(9500);
  const warned = /won't be saved|no se guardará/i.test(await bodyText());
  log("the player is warned progress won't save:", warned);
  if (!warned) note("No warning shown when nothing can be persisted.");
  if (SHOT) await p.screenshot({ path: `${SHOT}/storage-warning.png` });
}

console.log("\n=== CONSOLE ERRORS ===");
console.log(errors.length ? errors.join("\n") : "(none)");
console.log("\n=== ISSUES ===");
console.log(issues.length ? issues.join("\n") : "(none)");
await b.close();
process.exit(issues.length || errors.length ? 1 : 0);
