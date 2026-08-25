// Generator for the social/share image and PWA icons, in the "Puzzle Press"
// identity (cream paper, ink type, stamp-red accents — matching src/index.css).
// Renders branded HTML with headless Chrome and writes PNGs into public/
// (which Vite copies to docs/ on build). Run with: node scripts/gen-assets.mjs
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { launchBrowser } from "./browser.mjs";

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

// Theme tokens, kept in sync with src/index.css — including the one ink
// every offset shadow there uses (--shadow-stamp*: rgba(38,34,26,.5)).
const T = {
  paper: "#faf5ea",
  cream: "#efe7d3",
  ink: "#26221a",
  inkSoft: "#6f6757",
  press: "#d9482b",
  gold: "#eda820",
  serif: "Georgia,'Times New Roman',serif",
  sans: "system-ui,-apple-system,sans-serif",
};

// The faintest paper vignette, same recipe as the app's backdrop.
const PAPER_BG = `radial-gradient(90% 70% at 50% 0%,rgba(217,72,43,.05),transparent 60%),radial-gradient(100% 80% at 50% 110%,rgba(38,34,26,.07),transparent 55%),${T.paper}`;

const logo = (size) =>
  `<div style="width:${size}px;height:${size}px;border-radius:${Math.round(size * 0.24)}px;display:grid;place-items:center;background:${T.press};box-shadow:${Math.round(size * 0.05)}px ${Math.round(size * 0.05)}px 0 rgba(38,34,26,.5);color:${T.paper};font-size:${Math.round(size * 0.5)}px;line-height:1;">◆</div>`;

const tile = (t, fs = 30) =>
  `<div style="padding:${fs * 0.45}px ${fs * 0.7}px;border-radius:${fs * 0.55}px;background:#fff;border:2.5px solid ${T.ink};box-shadow:3px 3px 0 rgba(38,34,26,.5);font-weight:800;letter-spacing:.06em;color:${T.ink};font-size:${fs}px;font-family:${T.sans};">${t}</div>`;

const secretTile = (fs = 30) =>
  `<div style="padding:${fs * 0.45}px ${fs * 0.75}px;border-radius:${fs * 0.55}px;background:${T.press};border:2.5px solid ${T.ink};box-shadow:3px 3px 0 rgba(38,34,26,.5);font-weight:800;font-size:${fs}px;color:${T.paper};font-family:${T.sans};">◆ ? ? ?</div>`;

const ogHtml = `<!doctype html><html><body style="margin:0">
<div style="width:1200px;height:630px;background:${PAPER_BG};color:${T.ink};font-family:${T.serif};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;">
  ${logo(110)}
  <div style="font-size:100px;font-weight:700;letter-spacing:-.02em;">WordGrid</div>
  <div style="font-family:${T.sans};font-size:33px;color:${T.inkSoft};max-width:840px;text-align:center;line-height:1.35;">Four hidden groups. One <b style="color:${T.press}">secret word</b> links them all. Can you find it?</div>
  <div style="display:flex;gap:16px;margin-top:12px;align-items:center;">
    ${tile("ICON")}${tile("MOON")}
    ${secretTile()}
    ${tile("MEDAL")}${tile("APPEAR")}
  </div>
</div></body></html>`;

const iconHtml = (size) => `<!doctype html><html><body style="margin:0">
<div style="width:${size}px;height:${size}px;display:grid;place-items:center;background:${PAPER_BG};">
  ${logo(size * 0.62)}
</div></body></html>`;

const browser = await launchBrowser();
const page = await browser.newPage();

async function render(html, w, h, out) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 200));
  await page.screenshot({ path: join(PUBLIC, out) });
  console.log("wrote", out);
}

await render(ogHtml, 1200, 630, "og-image.png");
await render(iconHtml(512), 512, 512, "icon-512.png");
await render(iconHtml(192), 192, 192, "icon-192.png");
await render(iconHtml(180), 180, 180, "apple-touch-icon.png");

await browser.close();
