// Shared headless-Chrome launcher for the asset/playtest scripts. Prefers a
// full `puppeteer` install if present; otherwise falls back to
// `puppeteer-core` with a system Chromium (set PUPPETEER_EXECUTABLE_PATH or
// CHROME_PATH if yours lives somewhere unusual).
import { existsSync, readFileSync } from "node:fs";

const CANDIDATES = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  process.env.CHROME_PATH,
  "/opt/pw-browsers/chromium",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);

export async function launchBrowser() {
  const args = ["--no-sandbox", "--disable-setuid-sandbox", "--force-color-profile=srgb"];
  try {
    const { default: puppeteer } = await import("puppeteer");
    return await puppeteer.launch({ headless: "new", args });
  } catch {
    const { default: puppeteer } = await import("puppeteer-core");
    const executablePath = CANDIDATES.find((p) => existsSync(p));
    if (!executablePath) {
      throw new Error(
        "No Chrome/Chromium found. Install puppeteer (npm i -D puppeteer) or set PUPPETEER_EXECUTABLE_PATH.",
      );
    }
    return await puppeteer.launch({ headless: "new", executablePath, args });
  }
}

/**
 * The hosts a playtest must never reach, and why each one is on the list:
 *
 *   • `sdk.crazygames.com` — on localhost the real SDK initialises in its
 *     "local" mode and plays *fake ads* between boards once the 60 s gap has
 *     passed, which turns any multi-board flow flaky. `playtest.mjs` checks the
 *     real handshake separately, on a page of its own.
 *   • the analytics tracker the build is configured with (src/analytics.ts) —
 *     a suite must not depend on that host being up, and must never write test
 *     events into a real dashboard. Read from the `wordgrid:umami-script` meta
 *     tag; with the tag empty (the default) there is no such host.
 */
function offsiteHosts() {
  const hosts = ["sdk.crazygames.com"];
  try {
    const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
    const tag = html.match(/<meta\s+name=["']wordgrid:umami-script["']\s+content=["']([^"']+)["']/);
    if (tag) hosts.push(new URL(tag[1]).hostname);
  } catch {
    /* no tag, or not a URL: the SDK is the only host to keep out */
  }
  return hosts;
}

let cachedHosts;

/**
 * Keep a suite off the network. Enables request interception and *owns* the
 * page's request handler — don't register a second one that also continues or
 * aborts, or Puppeteer will complain the request is already handled.
 *
 * @returns the hosts being blocked, for a suite that wants to log them.
 */
export async function blockOffsite(page) {
  const hosts = (cachedHosts ??= offsiteHosts());
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    let host = "";
    try {
      host = new URL(req.url()).hostname;
    } catch {
      /* data:, about:blank — no host to match */
    }
    const done = hosts.includes(host) ? req.abort() : req.continue();
    // A request that raced a navigation is already handled; that isn't ours to
    // fix, and an unhandled rejection would fail the suite for no reason.
    done?.catch?.(() => {});
  });
  return hosts;
}
