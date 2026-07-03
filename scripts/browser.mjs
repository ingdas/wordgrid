// Shared headless-Chrome launcher for the asset/playtest scripts. Prefers a
// full `puppeteer` install if present; otherwise falls back to
// `puppeteer-core` with a system Chromium (set PUPPETEER_EXECUTABLE_PATH or
// CHROME_PATH if yours lives somewhere unusual).
import { existsSync } from "node:fs";

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
