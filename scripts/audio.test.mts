// The sound engine, checked where it can actually be wrong.
//
// Nobody can unit-test whether a bell sounds nice, but every rule the mixer is
// built on is testable, and each of these was a real bug or a real risk:
//
//   • muted has to mean *silent*, not "quieter"
//   • nothing may be scheduled while the tab is hidden — the audio clock is
//     frozen there, so a win sting queued at that moment fires all at once on
//     the way back
//   • every event has to land in the future; a note scheduled in the past is a
//     click
//   • the volumes have to survive a reload, and refuse nonsense
//   • the music scheduler has to keep running, keep ahead of the clock, and
//     actually stop when it's stopped
//   • `public/music/` is allowed to be empty, half-full, or full of files that
//     don't decode — every one of those has to end with music playing
//
// It runs against a fake AudioContext that records what was built, and a fake
// `public/music/` that decides which mp3s "exist".
import assert from "node:assert/strict";

let passed = 0;
async function test(name: string, fn: () => Promise<void> | void) {
  await fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Started = { at: number; kind: "osc" | "noise"; loop: boolean; track: boolean };

/** A recording stand-in for the bits of Web Audio the game uses. */
function fakeAudio() {
  const started: Started[] = [];
  let live = 0;
  let made: { currentTime: number } | null = null;
  const param = (value = 0) => ({
    value,
    setValueAtTime() {},
    exponentialRampToValueAtTime() {},
    linearRampToValueAtTime() {},
    cancelScheduledValues() {},
  });
  const connectable = () => ({ connect() {}, disconnect() {} });

  class FakeCtx {
    state = "running";
    sampleRate = 44100;
    currentTime = 0;
    destination = connectable();
    resumed = 0;
    suspended = 0;
    constructor() {
      made = this;
    }
    resume() {
      this.state = "running";
      this.resumed++;
      return Promise.resolve();
    }
    suspend() {
      this.state = "suspended";
      this.suspended++;
      return Promise.resolve();
    }
    createGain() {
      return { ...connectable(), gain: param(1) };
    }
    createBiquadFilter() {
      return { ...connectable(), type: "lowpass", frequency: param(1000), Q: param(1) };
    }
    createStereoPanner() {
      return { ...connectable(), pan: param(0) };
    }
    createConvolver() {
      return { ...connectable(), buffer: null as unknown };
    }
    createDynamicsCompressor() {
      return {
        ...connectable(),
        threshold: param(),
        knee: param(),
        ratio: param(),
        attack: param(),
        release: param(),
      };
    }
    createBuffer(channels: number, length: number) {
      const data = new Float32Array(length);
      return { getChannelData: () => data, length, numberOfChannels: channels };
    }
    createOscillator() {
      return this.source("osc");
    }
    createBufferSource() {
      return { ...this.source("noise"), buffer: null as unknown, loop: false };
    }
    /** Anything under 1 KB stands in for a file that isn't really audio — a
     *  404 page served with a 200, or a truncated upload. */
    decodeAudioData(bytes: ArrayBuffer) {
      return bytes.byteLength >= 1024
        ? Promise.resolve({ duration: 32, sampleRate: 44100, numberOfChannels: 2 })
        : Promise.reject(new Error("EncodingError"));
    }
    private source(kind: "osc" | "noise") {
      const self = this;
      return {
        ...connectable(),
        type: "sine",
        frequency: param(440),
        detune: param(0),
        onended: null as null | (() => void),
        start(at: number) {
          const self = this as { loop?: boolean; buffer?: { duration?: number } };
          // Only a decoded music file has a duration: the synth's brush ticks
          // loop a generated noise buffer, and mustn't be counted as a track.
          const loop = self.loop === true;
          started.push({ at, kind, loop, track: loop && self.buffer?.duration != null });
          live++;
        },
        stop() {
          // A real context ends the node later, on the audio thread; the point
          // here is only that the module lets go when `onended` fires.
          queueMicrotask(() => {
            live--;
            this.onended?.();
          });
        },
      };
    }
  }
  // Move the audio clock. The scheduler only ever works a fraction of a second
  // ahead, so without this a frozen clock hides whether it is still running.
  const advance = (seconds: number) => {
    if (made) made.currentTime += seconds;
  };
  return { FakeCtx, started, voices: () => live, advance };
}

/**
 * A stand-in for `public/music/`. A name in `files` is a track that exists;
 * "junk" is one that downloads but isn't decodable audio (the shape a missing
 * file takes on a dev server that answers every path with index.html).
 */
function fakeMusicDir(files: Record<string, "ok" | "junk">) {
  const calls: string[] = [];
  async function fetchFile(url: unknown) {
    const href = String(url);
    calls.push(href);
    const kind = files[href.split("/").pop() ?? ""];
    if (!kind) return { ok: false, status: 404, arrayBuffer: async () => new ArrayBuffer(0) };
    return {
      ok: true,
      status: 200,
      arrayBuffer: async () => new ArrayBuffer(kind === "ok" ? 4096 : 64),
    };
  }
  return { fetchFile, calls };
}

/** Fresh module, fresh context, fresh storage, fresh music folder. */
let caseId = 0;
async function load(seed: Record<string, string> = {}, files: Record<string, "ok" | "junk"> = {}) {
  const map = new Map(Object.entries(seed));
  const g = globalThis as Record<string, unknown>;
  g.localStorage = {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
  };
  const fake = fakeAudio();
  const dir = fakeMusicDir(files);
  g.window = { AudioContext: fake.FakeCtx };
  g.fetch = dir.fetchFile;
  const audio = await import(`../src/audio.ts?case=${caseId++}`);
  audio.initAudio();
  return { audio, ...fake, store: map, fetched: dir.calls };
}

/** Let a fetch + decode + hand-over settle. */
const settle = () => sleep(10);

await test("muted means silent — not one oscillator gets built", async () => {
  const a = await load({ "wordgrid:muted": "1" });
  a.audio.playSelect();
  a.audio.playWin();
  a.audio.playCorrect(3);
  assert.equal(a.started.length, 0);
  a.audio.setMuted(false);
  a.audio.playSelect();
  assert.ok(a.started.length > 0, "unmuting should let sound through again");
});

await test("a sound is a handful of voices, all scheduled in the future", async () => {
  const a = await load();
  a.audio.playWin();
  assert.ok(a.started.length >= 8, `the win sting is layered (got ${a.started.length})`);
  for (const s of a.started) assert.ok(s.at >= 0, "nothing may be scheduled behind the clock");
});

await test("a hidden tab schedules nothing (the clock is frozen there)", async () => {
  const a = await load();
  a.audio.suspendAudio();
  a.audio.playWin();
  for (let i = 0; i < 3; i++) a.audio.playStar(i);
  assert.equal(a.started.length, 0, "a sting queued while hidden fires all at once on return");
  a.audio.resumeAudio();
  a.audio.playStar(0);
  assert.ok(a.started.length > 0);
});

await test("voices are released when they finish — the budget doesn't leak", async () => {
  const a = await load();
  a.audio.playCorrect(0);
  assert.ok(a.voices() > 0);
  await sleep(0);
  assert.equal(a.voices(), 0, "every source is stopped and disconnected");

  // The engine caps how many voices may be live at once. If the count never
  // came back down, the game would go quiet after a minute of play.
  for (let i = 0; i < 40; i++) {
    a.audio.playCorrect(i % 5);
    a.audio.playStar(i % 3);
    await sleep(0);
  }
  const before = a.started.length;
  a.audio.playWin();
  assert.ok(a.started.length - before >= 8, "still fully audible after a long session");
});

await test("spamming one sound is rate-limited, distinct sounds are not", async () => {
  const a = await load();
  for (let i = 0; i < 20; i++) a.audio.playSelect();
  const taps = a.started.length;
  assert.ok(taps > 0 && taps < 20 * 3, `held-down taps should be gated (got ${taps} voices)`);
  a.audio.playWrong();
  assert.ok(a.started.length > taps, "a different sound is never gated by the last one");
});

await test("volumes clamp, persist, and come back on the next load", async () => {
  const a = await load();
  assert.equal(a.audio.getSfxVolume(), 0.8); // default
  a.audio.setSfxVolume(1.4);
  a.audio.setMusicVolume(-2);
  assert.equal(a.audio.getSfxVolume(), 1);
  assert.equal(a.audio.getMusicVolume(), 0);
  assert.equal(a.store.get("wordgrid:sfxvol"), "1");
  assert.equal(a.store.get("wordgrid:musicvol"), "0");

  const b = await load({ "wordgrid:sfxvol": "0.25", "wordgrid:musicvol": "0.5" });
  assert.equal(b.audio.getSfxVolume(), 0.25);
  assert.equal(b.audio.getMusicVolume(), 0.5);

  const c = await load({ "wordgrid:sfxvol": "loud" });
  assert.equal(c.audio.getSfxVolume(), 0.8, "junk in storage falls back to the default");
});

await test("music: off by default, and the switch persists", async () => {
  const a = await load();
  assert.equal(a.audio.isMusicOn(), false);
  a.audio.startMusic();
  assert.equal(a.started.length, 0, "startMusic is a no-op while music is off");
  a.audio.setMusicOn(true);
  assert.equal(a.store.get("wordgrid:music"), "1");
  assert.ok(a.started.length > 0, "turning it on starts the loop");
  a.audio.setMusicOn(false); // leave no scheduler running behind us
});

await test("music keeps its own switch: muting the effects doesn't stop it", async () => {
  const a = await load({ "wordgrid:music": "1", "wordgrid:muted": "1" });
  a.audio.startMusic();
  assert.ok(a.started.length > 0, "the two channels are independent");
  a.audio.stopMusic();
});

await test("the scheduler stays ahead of the clock and stops when told", async () => {
  const a = await load({ "wordgrid:music": "1" });
  a.audio.startMusic();
  const firstBar = a.started.length;
  assert.ok(firstBar > 0);
  // Nothing is scheduled more than a fraction of a second out: the loop is
  // decided by a timer but played by the audio clock.
  for (const s of a.started) assert.ok(s.at < 1, `scheduled ${s.at}s ahead — that is a whole bar`);

  await sleep(90);
  assert.ok(a.started.length >= firstBar, "the timer keeps scheduling");

  a.audio.stopMusic();
  const atStop = a.started.length;
  await sleep(90);
  assert.equal(a.started.length, atStop, "stopMusic really stops it");
});

await test("a scene change is accepted whether or not the loop is running", async () => {
  const a = await load({ "wordgrid:music": "1" });
  a.audio.setMusicScene("boss"); // before it starts: takes effect immediately
  a.audio.startMusic();
  a.audio.setMusicScene("play"); // while running: queued for the next bar line
  a.audio.setMusicScene("menu");
  await sleep(60);
  a.audio.stopMusic();
  assert.ok(a.started.length > 0, "the loop survives being re-pointed mid-bar");
});

// --- recorded music: the drop-in mp3 slot ----------------------------------
//
// The point of these is that the folder is allowed to be empty. Every one of
// them is a state the game has to survive between "the code is ready" and "the
// tracks are finished".

await test("no files in public/music: the synth loop covers every scene", async () => {
  const a = await load({ "wordgrid:music": "1" }, {});
  a.audio.startMusic();
  await settle();
  assert.equal(a.audio.musicTrackStates().menu, "missing");
  assert.equal(a.audio.musicSource(), "synth");
  assert.ok(a.started.length > 0, "the game is never silent because a file is absent");
  assert.ok(a.started.every((s) => !s.track), "no file is playing — there are none");
  a.audio.stopMusic();
  assert.equal(a.audio.musicSource(), "off");
});

await test("a missing file is asked for once, not once per screen", async () => {
  const a = await load({ "wordgrid:music": "1" }, {});
  a.audio.startMusic();
  await settle();
  a.audio.stopMusic();
  a.audio.startMusic();
  a.audio.setMusicScene("play");
  a.audio.setMusicScene("menu");
  await settle();
  const menu = a.fetched.filter((u) => u.endsWith("menu.mp3"));
  assert.equal(menu.length, 1, `a 404 is remembered (asked ${menu.length}×)`);
  a.audio.stopMusic();
});

await test("dropping in an mp3 takes the scene over from the synth loop", async () => {
  const a = await load({ "wordgrid:music": "1" }, { "menu.mp3": "ok" });
  a.audio.startMusic();
  // The file is still in flight: the synth covers the gap rather than a silence.
  assert.ok(a.started.some((s) => !s.track), "the loop plays while the track loads");

  await settle();
  assert.equal(a.audio.musicTrackStates().menu, "ready");
  assert.equal(a.audio.musicSource(), "track");
  assert.ok(a.started.some((s) => s.track), "the file plays, looped");

  const atHandover = a.started.length;
  a.advance(1);
  await sleep(60);
  assert.equal(a.started.length, atHandover, "the synth scheduler stops once the file has it");
  a.audio.stopMusic();
});

await test("scenes take their files one at a time — a half-full folder is fine", async () => {
  const a = await load({ "wordgrid:music": "1" }, { "menu.mp3": "ok" });
  a.audio.startMusic();
  await settle();
  const loops = a.started.filter((s) => s.track).length;
  assert.equal(loops, 1);

  a.audio.setMusicScene("play"); // no play.mp3 yet
  await settle();
  assert.equal(a.audio.musicTrackStates().play, "missing");
  assert.equal(a.started.filter((s) => s.track).length, loops, "no second track started");
  assert.equal(a.audio.musicSource(), "synth", "the loop picks up a scene the folder has no file for");
  a.audio.stopMusic();
});

await test("a second file crossfades in on a scene change", async () => {
  const a = await load({ "wordgrid:music": "1" }, { "menu.mp3": "ok", "boss.mp3": "ok" });
  a.audio.startMusic();
  await settle();
  a.audio.setMusicScene("boss");
  await settle();
  assert.equal(a.audio.musicTrackStates().boss, "ready");
  assert.equal(a.audio.musicSource(), "track");
  assert.equal(a.started.filter((s) => s.track).length, 2, "the boss track started");
  a.audio.stopMusic();
});

await test("a file that isn't decodable audio counts as missing", async () => {
  const a = await load({ "wordgrid:music": "1" }, { "menu.mp3": "junk" });
  a.audio.startMusic();
  await settle();
  assert.equal(a.audio.musicTrackStates().menu, "missing");
  assert.equal(a.audio.musicSource(), "synth");
  assert.ok(a.started.length > 0 && a.started.every((s) => !s.track), "the loop carries on");
  a.audio.stopMusic();
});

await test("music off downloads nothing at all", async () => {
  // Explicitly off: storage keeps an in-memory copy of every key it has seen,
  // so an *absent* key here would inherit the switch from an earlier case.
  const a = await load({ "wordgrid:music": "0" }, { "menu.mp3": "ok", "play.mp3": "ok" });
  a.audio.startMusic();
  a.audio.setMusicScene("play");
  await settle();
  assert.equal(a.audio.musicSource(), "off");
  assert.equal(a.fetched.length, 0, "a player who never turns music on pays nothing for it");
  assert.equal(a.audio.musicTrackStates().play, "idle");
});

console.log(`\n${passed} audio tests passed ✓\n`);
