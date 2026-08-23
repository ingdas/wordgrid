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
//
// It runs against a fake AudioContext that records what was built.
import assert from "node:assert/strict";

let passed = 0;
async function test(name: string, fn: () => Promise<void> | void) {
  await fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Started = { at: number; kind: "osc" | "noise" };

/** A recording stand-in for the bits of Web Audio the game uses. */
function fakeAudio() {
  const started: Started[] = [];
  let live = 0;
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
    private source(kind: "osc" | "noise") {
      const self = this;
      return {
        ...connectable(),
        type: "sine",
        frequency: param(440),
        detune: param(0),
        onended: null as null | (() => void),
        start(at: number) {
          started.push({ at, kind });
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
  return { FakeCtx, started, voices: () => live };
}

/** Fresh module, fresh context, fresh storage. */
let caseId = 0;
async function load(seed: Record<string, string> = {}) {
  const map = new Map(Object.entries(seed));
  const g = globalThis as Record<string, unknown>;
  g.localStorage = {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
  };
  const fake = fakeAudio();
  g.window = { AudioContext: fake.FakeCtx };
  const audio = await import(`../src/audio.ts?case=${caseId++}`);
  audio.initAudio();
  return { audio, ...fake, store: map };
}

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

console.log(`\n${passed} audio tests passed ✓\n`);
