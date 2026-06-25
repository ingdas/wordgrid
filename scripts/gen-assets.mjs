// One-off generator for the social/share image and PWA icons. Renders branded
// HTML with headless Chrome and writes PNGs into public/ (which Vite copies to
// docs/ on build). Run once with: node scripts/gen-assets.mjs
import puppeteer from "puppeteer";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

const BG = "radial-gradient(60% 60% at 18% 12%,rgba(99,102,241,.5),transparent 60%),radial-gradient(55% 55% at 85% 25%,rgba(236,72,153,.45),transparent 60%),radial-gradient(60% 60% at 50% 100%,rgba(34,211,238,.35),transparent 60%),linear-gradient(160deg,#0b0a1f,#140f2e 55%,#0b0a1f)";

const logo = (size) =>
  `<div style="width:${size}px;height:${size}px;border-radius:${size * 0.26}px;display:grid;place-items:center;background:linear-gradient(135deg,#818cf8,#e879f9);box-shadow:0 ${size * 0.06}px ${size * 0.18}px rgba(217,70,239,.45);color:#fff;font-size:${size * 0.5}px;line-height:1;">◆</div>`;

const tile = (t) =>
  `<div style="padding:14px 20px;border-radius:16px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);font-weight:800;letter-spacing:.06em;color:#eef;font-size:30px;">${t}</div>`;

const ogHtml = `<!doctype html><html><body style="margin:0">
<div style="width:1200px;height:630px;background:${BG};color:#fff;font-family:Georgia,'Times New Roman',serif;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;">
  ${logo(120)}
  <div style="font-size:104px;font-weight:700;letter-spacing:-.02em;">WordGrid</div>
  <div style="font-family:system-ui,sans-serif;font-size:34px;color:#c7d2fe;max-width:840px;text-align:center;line-height:1.35;">Four hidden groups. One <b style="color:#fff">secret word</b> links them all. Can you find it?</div>
  <div style="display:flex;gap:16px;margin-top:14px;font-family:system-ui,sans-serif;">
    ${tile("ICON")}${tile("MOON")}
    <div style="padding:14px 22px;border-radius:16px;background:linear-gradient(110deg,rgba(129,140,248,.4),rgba(232,121,249,.4));border:1px solid rgba(240,171,252,.7);font-weight:800;font-size:30px;color:#fff;">◆ ? ? ?</div>
    ${tile("JELLY")}${tile("HEART")}
  </div>
</div></body></html>`;

const iconHtml = (size) => `<!doctype html><html><body style="margin:0">
<div style="width:${size}px;height:${size}px;display:grid;place-items:center;background:${BG};">
  ${logo(size * 0.62)}
</div></body></html>`;

const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
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
