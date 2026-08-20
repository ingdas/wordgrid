// Level tracking, driven through a real browser against a real server.
//
// The unit tests (scripts/stats.test.mts) pin the module's behaviour; this
// pins the thing the module exists to protect — that a game with tracking
// *configured* is still exactly as playable with the network pulled out from
// under it, and that nothing raised while offline is lost.
//
// It runs the reference server (server/stats-server.mjs) on a throwaway SQLite
// file and serves the built `docs/` itself — with the `<meta
// name="wordgrid:stats">` tag filled in, which is exactly how a real deploy
// switches tracking on — then plays level 1 for real, since debug play is
// deliberately not tracked.
//
// Self-contained: no `vite preview` needed, just a build.
//
//   npm run build
//   npm i -D puppeteer
//   node scripts/stats.playtest.mjs
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, normalize } from "node:path";
import { launchBrowser } from "./browser.mjs";

const DOCS = new URL("../docs/", import.meta.url).pathname;
const GAME_PORT = Number(process.env.GAME_PORT || 8898);
const BASE = `http://localhost:${GAME_PORT}/`;
const STATS_PORT = Number(process.env.STATS_PORT || 8899);
const STATS_URL = `http://localhost:${STATS_PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log("•", ...a);
const issues = [];
const note = (s) => {
  issues.push(s);
  log("ISSUE:", s);
};

// Level 1 is the STAR puzzle (id "star"); its four spoke-groups.
const GROUPS = [
  ["ICON", "LEGEND", "IDOL"],
  ["MOON", "COMET", "PLANET"],
  ["MEDAL", "TROPHY", "RIBBON"],
  ["HEART", "ARROW", "CROSS"],
];

// --- the stats server ------------------------------------------------------

const dir = mkdtempSync(join(tmpdir(), "wordgrid-stats-"));
const server = spawn(process.execPath, [new URL("../server/stats-server.mjs", import.meta.url).pathname], {
  env: { ...process.env, PORT: String(STATS_PORT), DB: join(dir, "stats.db") },
  stdio: ["ignore", "pipe", "pipe"],
});
server.stdout.on("data", (d) => process.env.VERBOSE && process.stdout.write(`  [stats] ${d}`));
const stop = () => {
  server.kill();
  game?.close();
  rmSync(dir, { recursive: true, force: true });
};

async function serverUp() {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(`${STATS_URL}/health`);
      if (r.ok) return true;
    } catch {
      /* not listening yet */
    }
    await sleep(150);
  }
  return false;
}
if (!(await serverUp())) {
  console.error("stats server did not start");
  stop();
  process.exit(1);
}
const levels = async () => (await (await fetch(`${STATS_URL}/levels`)).json()).levels;

// --- the game, served with tracking switched on ----------------------------

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

const game = createServer((req, res) => {
  const path = normalize(decodeURI(new URL(req.url, BASE).pathname)).replace(/^(\.\.[/\\])+/, "");
  const file = path === "/" ? "index.html" : path.replace(/^\//, "");
  let body;
  try {
    body = readFileSync(join(DOCS, file));
  } catch {
    res.writeHead(404).end("not found");
    return;
  }
  if (file === "index.html") {
    // The one line a deploy edits to start collecting.
    const html = body
      .toString("utf8")
      .replace(/<meta name="wordgrid:stats" content="[^"]*"\s*\/>/, `<meta name="wordgrid:stats" content="${STATS_URL}" />`);
    if (!html.includes(STATS_URL)) note("index.html has no wordgrid:stats meta tag to configure.");
    body = Buffer.from(html, "utf8");
  }
  res.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" });
  res.end(body);
});
await new Promise((r) => game.listen(GAME_PORT, r));

// --- the browser -----------------------------------------------------------

const b = await launchBrowser();
const p = await b.newPage();
await p.setViewport({ width: 430, height: 880, deviceScaleFactor: 2 });
const errors = [];
p.on("console", (m) => {
  if (m.type() !== "error") return;
  if (/Failed to load resource|ERR_INTERNET_DISCONNECTED|net::ERR/.test(m.text())) return;
  errors.push(m.text());
});
p.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

/** Everything below drives a page by what a player can see on it. */
async function clickText(page, sel, text) {
  for (const h of await page.$$(sel)) {
    const ok = await h.evaluate((e, want) => {
      const r = e.getBoundingClientRect();
      return (e.textContent || "").includes(want) && r.width > 0 && r.height > 0;
    }, text);
    if (ok) {
      await h.click();
      return true;
    }
  }
  return false;
}
async function clickAria(page, label) {
  const h = await page.$(`button[aria-label="${label}"]`);
  if (!h) return false;
  await h.click();
  return true;
}
async function clickWord(page, w) {
  for (const h of await page.$$("main button[aria-pressed]")) {
    if ((await h.evaluate((e) => e.textContent.replace(/◆/g, "").trim())) === w) {
      await h.click();
      return true;
    }
  }
  return false;
}
async function submitGroup(page, group) {
  for (const w of group) await clickWord(page, w);
  await clickText(page, "button", "Submit group");
  // Long enough for the solved-group animation to finish: the next group's
  // tiles are not clickable while it plays.
  await sleep(900);
}
const bodyText = (page) => page.$eval("body", (e) => e.innerText);
const queued = (page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("wordgrid:stats-queue") || "[]").length);

/**
 * A brand-new install, on a level 1 board, with an install id we choose — the
 * counts are "distinct people", so a test about them has to say who is who.
 * The reload is what makes the id stick: the first load has already picked a
 * random one by the time we can write to storage.
 */
async function bootFresh(page, playerId, { offline = false } = {}) {
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await sleep(800); // let that first load's own event go out
  await page.evaluate((id) => {
    localStorage.clear();
    localStorage.setItem("wordgrid:player", id);
  }, playerId);
  if (offline) await page.setOfflineMode(true);
  await page.reload({ waitUntil: offline ? "domcontentloaded" : "networkidle0" });
  await sleep(offline ? 1600 : 700);
  // Skip *before* starting: "Let's play" dismisses the welcome sheet with the
  // coach still on, and a coached run forgives every wrong guess — which would
  // make the losing player below unable to lose.
  const started =
    (await clickText(page, "button", "Skip tutorial")) || (await clickText(page, "button", "Let's play"));
  if (!started) note(`The welcome overlay never appeared for ${playerId}.`);
  await sleep(500);
  if (!(await page.$("main button[aria-pressed]"))) note(`No board on screen for ${playerId}.`);
}

/** Play level 1 through to the win card. */
async function winLevelOne(page) {
  await submitGroup(page, GROUPS[0]);
  await submitGroup(page, GROUPS[1]);
  await submitGroup(page, GROUPS[2]);
  await sleep(1800); // the last group auto-solves → the link finale
  for (const ch of "STAR") {
    for (const h of await page.$$("button")) {
      const hit = await h.evaluate((e, c) => {
        const r = e.getBoundingClientRect();
        return e.textContent.trim() === c && r.width > 0 && r.width < 90;
      }, ch);
      if (hit) {
        await h.click();
        break;
      }
    }
    await sleep(180);
  }
  // The last letter locks the word in by itself; the button is a fallback.
  await clickText(page, "button", "Lock it in");
  await sleep(2500);
}

/** Burn all four mistakes, declining the second chance. */
async function loseLevelOne(page) {
  const wrong = [
    ["ICON", "MOON", "MEDAL"],
    ["LEGEND", "COMET", "TROPHY"],
    ["IDOL", "PLANET", "RIBBON"],
    ["ICON", "COMET", "HEART"],
  ];
  for (const group of wrong) {
    // A wrong guess leaves the three tiles selected, and the board only ever
    // holds three — so without this the next trio is ignored and the same
    // guess is resubmitted as a repeat, which costs nothing.
    await clickText(page, "button", "Clear");
    await sleep(150);
    for (const w of group) await clickWord(page, w);
    await clickText(page, "button", "Submit group");
    await sleep(900);
  }
  await sleep(600);
  await clickText(page, "button", "No thanks"); // decline the rewarded continue
  await sleep(1600);
}

const zero = { players: 0, solvers: 0, plays: 0, wins: 0 };
const star = async () => (await levels()).star ?? zero;

// 1. OFFLINE. The level is played with the network cut — served by the game's
//    own service worker, which is how an installed copy plays on a train.
log("playing the first level offline…");
const before = await (async () => {
  await p.goto(BASE, { waitUntil: "networkidle0" });
  await sleep(800);
  return star();
})();
await bootFresh(p, "playtest-solver-0001", { offline: true });

const dealt = (await p.$("main button[aria-pressed]")) != null;
log("offline: the board loaded from the cache:", dealt);
if (!dealt) note("The game did not start offline.");
await winLevelOne(p);

const won = /cracked|Level complete|Next level|⭐/i.test(await bodyText(p));
log("offline: the level was won normally:", won);
if (!won) note("The level could not be completed offline with tracking configured.");

const pendingOffline = await queued(p);
log("offline: events waiting in the queue:", pendingOffline);
if (pendingOffline < 2) note(`Offline play queued ${pendingOffline} events; expected at least the start and the win.`);
if ((await star()).plays !== before.plays) note("The server recorded a play while the browser was offline.");

// 2. BACK ONLINE. The queue drains by itself and the numbers turn up.
await p.setOfflineMode(false);
await p.evaluate(() => window.dispatchEvent(new Event("online")));
await sleep(2000);
const after = await star();
log("online: level 1 now reads:", JSON.stringify(after));
if (after.plays !== before.plays + 1 || after.wins !== before.wins + 1) {
  note(`Expected one more win in one more attempt; went from ${before.plays}/${before.wins} to ${after.plays}/${after.wins}.`);
}
if (after.solvers !== before.solvers + 1) note(`Expected one more solver, got ${after.solvers} (was ${before.solvers}).`);
const drained = await queued(p);
log("online: queue after the flush:", drained);
if (drained !== 0) note(`The queue still holds ${drained} events after a successful flush.`);

// 3. A SECOND PLAYER, who loses. The counts have to tell people apart, and a
//    loss has to pull the success rate down rather than go unrecorded.
const context2 = await b.createBrowserContext();
const page2 = await context2.newPage();
await page2.setViewport({ width: 430, height: 880 });
await bootFresh(page2, "playtest-loser-0002");
await loseLevelOne(page2);
const lost = /Out of guesses|out of guesses/.test(await bodyText(page2));
log("second player lost the board:", lost);
if (!lost) note("The second player did not reach the loss card.");
await sleep(1800);

const both = await star();
log("after two players:", JSON.stringify(both));
if (both.plays !== after.plays + 1) note(`The loss was not counted as an attempt (${after.plays} → ${both.plays}).`);
if (both.wins !== after.wins) note("A loss was counted as a win.");
if (both.solvers !== after.solvers) note("A player who never won was counted as a solver.");
if (both.players < 2) note(`Two installs played level 1 but only ${both.players} were counted.`);

// 4. The dashboard reads all of it back.
await p.reload({ waitUntil: "networkidle0" });
await sleep(1500);
if (!(await clickAria(p, "Settings"))) note("No Settings button on the home screen.");
await sleep(400);
if (!(await clickText(p, "button", "Level tracking"))) note("Settings has no Level tracking entry.");
await sleep(1200);
if (process.env.VERBOSE) {
  console.log("  [cache]", await p.evaluate(() => localStorage.getItem("wordgrid:stats-cache")));
  console.log("  [live]", await p.evaluate(async (u) => {
    try { const r = await fetch(u + "/levels", { cache: "no-cache" }); return await r.text(); } catch (e) { return "ERR " + e.message; }
  }, STATS_URL));
}
const dash = await bodyText(p);
if (process.env.VERBOSE) console.log("  [dash]", dash.replace(/\n+/g, " | "));
log("dashboard says collecting:", /Collecting/.test(dash), "| shows endpoint:", dash.includes(STATS_URL));
if (!/Collecting/.test(dash)) note("The tracking dashboard does not report that collection is on.");
if (!dash.includes(STATS_URL)) note("The tracking dashboard does not show the configured endpoint.");
// innerText applies text-transform, so the tiles read ATTEMPTS on screen.
if (!/attempts/i.test(dash)) note("The tracking dashboard shows no totals.");
if (!/1 solved/.test(dash)) note("The tracking dashboard does not name level 1's solver count.");

if (errors.length) note(`Console errors: ${errors.slice(0, 3).join(" | ")}`);

await b.close();
stop();
console.log(issues.length ? `\n${issues.length} issue(s)\n` : "\nstats playtest: no issues ✓\n");
process.exit(issues.length ? 1 : 0);
