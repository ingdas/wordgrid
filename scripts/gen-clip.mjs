// A short gameplay clip for the CrazyGames submission — the last piece of the
// pack that used to need a manual screen recording.
//
//   npm run build && npm run preview        # serve docs/ on :4173
//   npm run clip                            # → public/art/gameplay.webm
//
// Frames come from the DevTools screencast (the same source Chrome's own
// recorder uses), each one stamped with the moment it was painted. They are
// encoded against those stamps rather than at a nominal frame rate, so the clip
// runs at the speed the game was actually played — a screenshot loop drifts
// into slow motion as soon as a frame takes longer than its slot.
//
// The output is VP8/WebM, which every browser plays. If the portal insists on
// H.264, transcode on a machine with an x264-enabled ffmpeg:
//   ffmpeg -i gameplay.webm -c:v libx264 -pix_fmt yuv420p -crf 20 gameplay.mp4
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { launchBrowser } from "./browser.mjs";
import { LEVELS } from "../src/puzzles.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "public", "art");
const WORK = join(HERE, "..", "node_modules", ".cache", "wordgrid-clip");
mkdirSync(OUT, { recursive: true });
rmSync(WORK, { recursive: true, force: true });
mkdirSync(WORK, { recursive: true });

const BASE = process.env.BASE || "http://localhost:4173/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const FFMPEG = [
  process.env.FFMPEG_PATH,
  "/opt/pw-browsers/ffmpeg-1011/ffmpeg-linux",
  "/usr/bin/ffmpeg",
  "ffmpeg",
].find((p) => p && (p === "ffmpeg" || existsSync(p)));

const browser = await launchBrowser();
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });

// The same ten-levels-in save the screenshots use, so the clip opens on an
// account with a streak and a collection rather than a blank slate.
const CLEARED = LEVELS.slice(0, 10).map((l) => l.id);
await page.goto(BASE, { waitUntil: "networkidle0" });
await page.evaluate((cleared) => {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  localStorage.clear();
  localStorage.setItem("wordgrid:tutorial", "1");
  localStorage.setItem(
    "wordgrid:progress",
    JSON.stringify({
      stars: Object.fromEntries(cleared.map((id, i) => [id, i % 4 === 2 ? 2 : 3])),
      streak: 5,
      bestStreak: 7,
      linksGuessed: 9,
      best: {},
      daily: { lastDate: `${y.getFullYear()}-${y.getMonth() + 1}-${y.getDate()}`, streak: 4 },
      achievements: ["clear:0", "stars:0", "links:0"],
      hints: 4,
      history: [],
      score: 8400,
      endlessBest: 0,
      keys: [0],
    }),
  );
}, CLEARED);
await page.reload({ waitUntil: "networkidle0" });
await sleep(1200);

// --- capture ----------------------------------------------------------------
const frames = [];
const client = await page.createCDPSession();
client.on("Page.screencastFrame", async ({ data, sessionId, metadata }) => {
  const file = join(WORK, `f${String(frames.length).padStart(5, "0")}.jpg`);
  writeFileSync(file, Buffer.from(data, "base64"));
  frames.push({ file, t: metadata.timestamp });
  try {
    await client.send("Page.screencastFrameAck", { sessionId });
  } catch {
    /* the page went away mid-ack */
  }
});
await client.send("Page.startScreencast", {
  format: "jpeg",
  quality: 92,
  maxWidth: 1280,
  maxHeight: 720,
  everyNthFrame: 1,
});

// --- the run ----------------------------------------------------------------
// Paced for watching, not for speed: a beat on each screen, and a pause before
// each submit so the three picked words can be read.
const clickText = async (text, wait = 900) => {
  const [el] = await page.$$(`xpath/. //button[contains(., ${JSON.stringify(text)})]`);
  if (!el) throw new Error(`no button containing ${JSON.stringify(text)}`);
  await el.click();
  await sleep(wait);
};
const clickWord = async (word) => {
  await page.click(`button[aria-label="${word}"]`);
  await sleep(420);
};
const submit = async () => {
  await sleep(500);
  await clickText("Submit group", 1700);
};

await sleep(1800); // hold on the home screen
await clickText("Browse all", 2200);

const level = LEVELS[10];
await clickText("Play →", 1800);

for (const cat of level.categories.slice(0, 3)) {
  for (const w of cat.words) await clickWord(w);
  await submit();
}
await sleep(2200); // the fourth group falls out on its own; the finale opens

for (const ch of level.pivot.split("")) {
  const [el] = await page.$$(`xpath/. //button[@aria-label=${JSON.stringify(`Letter ${ch}`)}]`);
  await el.click();
  await sleep(520);
}
await sleep(4000); // stars, streak, confetti

await client.send("Page.stopScreencast").catch(() => {});
await sleep(300);
await browser.close();

// --- encode -----------------------------------------------------------------
// The frames arrive whenever Chrome painted one, which is not a frame rate. The
// clip is resampled onto a fixed 20fps timeline first — for each slot, whichever
// frame was on screen at that moment — so real pauses stay pauses. (Piping
// JPEGs is the only input this ffmpeg build takes: it ships with image2pipe and
// nothing else, so the concat demuxer isn't an option.)
if (!frames.length) throw new Error("no frames captured");
const FPS = 20;
const t0 = frames[0].t;
const span = frames.at(-1).t - t0 + 1.2; // hold the last frame for a beat
const timeline = [];
for (let k = 0, i = 0; k < Math.round(span * FPS); k++) {
  const t = t0 + k / FPS;
  while (i + 1 < frames.length && frames[i + 1].t <= t) i++;
  timeline.push(frames[i].file);
}

const out = join(OUT, "gameplay.webm");
const args = [
  "-y",
  "-loglevel", "error",
  "-f", "image2pipe",
  "-vcodec", "mjpeg",
  "-framerate", `${FPS}`,
  "-i", "pipe:0",
  "-c:v", "libvpx",
  "-b:v", "2500k",
  "-crf", "28",
  "-pix_fmt", "yuv420p",
  "-an",
  out,
];
await new Promise((resolve, reject) => {
  const proc = spawn(FFMPEG, args, { stdio: ["pipe", "inherit", "inherit"] });
  proc.on("error", reject);
  proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`))));
  (async () => {
    for (const file of timeline) {
      if (!proc.stdin.write(readFileSync(file))) {
        await new Promise((r) => proc.stdin.once("drain", r));
      }
    }
    proc.stdin.end();
  })().catch(reject);
});
rmSync(WORK, { recursive: true, force: true });
console.log(
  `wrote gameplay.webm — ${timeline.length} frames at ${FPS}fps, ${(timeline.length / FPS).toFixed(1)}s`,
);
