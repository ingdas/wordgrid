// Checks the CrazyGames upload the build writes to docs/art/wordgrid-crazygames.zip
// (scripts/dist-zip.mts) the way the portal's reviewers would meet it:
//
//   shape    index.html at the root; no submission pack, service worker, dot-files
//            or __MACOSX in it; under the portal's 50 MB / 1,500-file limits
//   paths    every src/href in index.html is relative and resolves to a file in
//            the zip; the only remote script is the SDK on its CDN
//   in situ  unpacked and served from a nested path (like a CDN folder), loaded
//            inside an iframe on a *different* origin (like the portal page):
//            the game boots, both fonts come from the zip, no request to the
//            game's origin fails, nothing is fetched from any host that isn't
//            *.crazygames.com (or the Umami host the analytics meta tag names,
//            when the build is configured), no service worker is registered,
//            no page error
//
//   npm run build                      # writes the zip
//   node scripts/dist.playtest.mjs     # ZIP=path/to/other.zip to check another
//                                      # SHOT=dir for a screenshot of the embed
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, normalize, posix, resolve } from "node:path";
import { launchBrowser } from "./browser.mjs";

const ZIP = resolve(process.env.ZIP || "docs/art/wordgrid-crazygames.zip");
const SHOT = process.env.SHOT;
const SDK = "https://sdk.crazygames.com/crazygames-sdk-v3.js";
// The portal's published limits (docs.crazygames.com/requirements/technical).
const MAX_INITIAL_BYTES = 50 * 1024 * 1024;
const MAX_FILES = 1500;
// Where a CDN would put it: a folder, not the origin's root, so an absolute
// path that happens to work on GitHub Pages' root fails here as it would there.
const PREFIX = "/en_US/wordgrid/";

const log = (...a) => console.log("•", ...a);
const issues = [];
const note = (s) => {
  issues.push(s);
  log("ISSUE:", s);
};

if (!existsSync(ZIP)) {
  console.error(`no zip at ${ZIP} — run \`npm run build\` first`);
  process.exit(2);
}
log(`zip: ${ZIP} (${(statSync(ZIP).size / 1000).toFixed(1)} kB)`);

// --- shape --------------------------------------------------------------------
const entries = execFileSync("unzip", ["-Z1", ZIP], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);
log(`${entries.length} entries`);

if (!entries.includes("index.html")) note("index.html is not at the root of the zip");
if (entries.length > MAX_FILES) note(`${entries.length} files, over the ${MAX_FILES} limit`);
if (statSync(ZIP).size > MAX_INITIAL_BYTES) note("zip is over the 50 MB initial-download limit");
for (const e of entries) {
  if (e.startsWith("/") || e.includes("..")) note(`unsafe path in zip: ${e}`);
  if (e.startsWith("__MACOSX/") || e.split("/").some((p) => p.startsWith(".")))
    note(`stray file in zip: ${e}`);
  if (e === "sw.js") note("sw.js is in the zip — the worker is for the standalone site");
  if (e.startsWith("art/")) note(`submission pack leaked into the zip: ${e}`);
  if (e.endsWith("/")) note(`directory entry in zip (not needed, but harmless): ${e}`);
}

// --- unpack ---------------------------------------------------------------------
const dir = mkdtempSync(join(tmpdir(), "wordgrid-dist-"));
execFileSync("unzip", ["-q", "-o", ZIP, "-d", dir]);
const files = new Set(entries);

// --- paths in index.html ----------------------------------------------------------
const html = readFileSync(join(dir, "index.html"), "utf8");
// Analytics (src/analytics.ts) is the one other host the game may talk to, and
// only when the build carries a tracker URL in its meta tag: allow that origin,
// and nothing else. Unconfigured (the default), there is no such origin.
const umamiOrigin = (() => {
  const m = html.match(/<meta\s+name=["']wordgrid:umami-script["']\s+content=["']([^"']+)["']/);
  try {
    return m ? new URL(m[1]).origin : null;
  } catch {
    return null;
  }
})();
const refs = [...html.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)].map((m) => m[1]);
const remoteScripts = [...html.matchAll(/<script[^>]+src=["'](https?:[^"']+)["']/g)].map(
  (m) => m[1],
);
for (const url of refs) {
  if (/^(data:|#|https?:|mailto:)/.test(url)) continue;
  if (url.startsWith("/")) {
    note(`absolute path in index.html: ${url}`);
    continue;
  }
  const target = posix.normalize(url.replace(/^\.\//, "").split(/[?#]/)[0]);
  if (!files.has(target)) note(`index.html refers to ${url}, which is not in the zip`);
}
for (const url of remoteScripts) {
  if (url !== SDK) note(`remote script other than the SDK: ${url}`);
}
if (!remoteScripts.includes(SDK)) note("the SDK script tag is missing from index.html");
for (const url of refs) {
  if (/^https?:/.test(url) && url !== SDK && !/^<meta/.test(url))
    log(`  (remote reference, not a script: ${url})`);
}

// --- serve it like a CDN folder, embed it like a portal -------------------------------
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json",
  ".json": "application/json",
};
const requested = [];
const cdn = createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  requested.push(url.pathname);
  if (!url.pathname.startsWith(PREFIX)) {
    res.writeHead(404).end();
    return;
  }
  const rel = normalize(decodeURIComponent(url.pathname.slice(PREFIX.length))) || "index.html";
  const file = join(dir, rel === "." ? "index.html" : rel);
  if (!file.startsWith(dir) || !existsSync(file) || statSync(file).isDirectory()) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
});
await new Promise((r) => cdn.listen(0, "127.0.0.1", r));
const gameOrigin = `http://127.0.0.1:${cdn.address().port}`;
const gameUrl = `${gameOrigin}${PREFIX}index.html`;

// A different origin (localhost vs 127.0.0.1) so the embed is genuinely
// cross-origin: window.top !== window, storage partitioned, the lot.
const portal = createServer((_req, res) => {
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(
    `<!doctype html><title>portal</title><body style="margin:0;background:#111">` +
      `<iframe id="game" src="${gameUrl}" allow="autoplay; fullscreen" ` +
      `style="border:0;width:1280px;height:720px;display:block"></iframe>`,
  );
});
await new Promise((r) => portal.listen(0, "localhost", r));
const portalUrl = `http://localhost:${portal.address().port}/`;
log(`serving the zip at ${gameUrl}, embedded from ${portalUrl}`);

const browser = await launchBrowser();
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 760, deviceScaleFactor: 1 });

const failed = [];
const foreign = new Set();
page.on("requestfailed", (r) => {
  const u = new URL(r.url());
  if (u.origin === gameOrigin) failed.push(`${u.pathname} (${r.failure()?.errorText})`);
});
page.on("response", (r) => {
  const u = new URL(r.url());
  if (u.origin === gameOrigin && r.status() >= 400) failed.push(`${u.pathname} → ${r.status()}`);
});
page.on("request", (r) => {
  const u = new URL(r.url());
  if (!/^https?:$/.test(u.protocol)) return; // data: favicon, about:blank
  if (u.origin === gameOrigin || u.origin === portalUrl.slice(0, -1)) return;
  if (u.hostname === "crazygames.com" || u.hostname.endsWith(".crazygames.com")) return;
  if (umamiOrigin && u.origin === umamiOrigin) return;
  foreign.add(u.origin);
});
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(e.message));

await page.goto(portalUrl, { waitUntil: "networkidle0", timeout: 60_000 });
const frame = page.frames().find((f) => f.url().startsWith(gameOrigin));
if (!frame) {
  note("the game frame never loaded");
} else {
  await frame.waitForSelector("#root button", { timeout: 20_000 }).catch(() => {
    note("the game did not render a single button inside the embed");
  });
  const state = await frame.evaluate(async () => {
    await document.fonts.ready;
    const loaded = [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family);
    const regs = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistrations() : [];
    return {
      buttons: document.querySelectorAll("#root button").length,
      text: (document.body.innerText || "").slice(0, 80).replace(/\s+/g, " "),
      fonts: [...new Set(loaded)],
      workers: regs.length,
      top: window.top === window,
    };
  });
  log(`embed rendered ${state.buttons} buttons; first words: "${state.text}"`);
  log(`fonts loaded: ${state.fonts.join(", ") || "none"}`);
  if (state.top) note("the game thinks it is the top-level page inside the iframe");
  for (const fam of ["Fraunces", "Inter"]) {
    if (!state.fonts.some((f) => f.replace(/["']/g, "").startsWith(fam)))
      note(`${fam} did not load from the zip`);
  }
  if (state.workers > 0) note(`${state.workers} service worker(s) registered inside the embed`);
  if (SHOT) {
    await page.screenshot({ path: join(SHOT, "dist-embed.png") });
    log(`screenshot → ${join(SHOT, "dist-embed.png")}`);
  }
}

if (requested.some((p) => p.endsWith("/sw.js"))) note("the embed asked for sw.js");
for (const f of failed) note(`request to the game's origin failed: ${f}`);
for (const o of foreign) note(`request to a host that is neither the game nor CrazyGames: ${o}`);
for (const e of pageErrors) note(`page error: ${e}`);
log(`${requested.length} requests to the game's origin, ${failed.length} failed`);

await browser.close();
cdn.close();
portal.close();
rmSync(dir, { recursive: true, force: true });

if (issues.length) {
  console.log(`\n${issues.length} issue(s):\n- ${issues.join("\n- ")}`);
  process.exit(1);
}
console.log("\nOK — the zip unpacks, boots in a foreign iframe from a nested path, and asks for nothing it doesn't carry.");
