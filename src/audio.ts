// The whole soundtrack, synthesized at runtime. Every tap, solve and sting is
// built out of Web Audio nodes, so the build stays a few hundred KB and the
// first sound is ready the instant the player touches the screen (no fetch
// inside the CrazyGames iframe, no decode stall). The background music is
// synthesized too — until an mp3 is dropped into `public/music/`, which takes
// that scene over; see "recorded music" further down.
//
// The shape of it:
//
//   voices ─┬─► sfxBus   ─┐
//           ├─► musicDuck ─► musicBus ─┐
//           └─► verbBus ─► convolver ──┴─► master ─► limiter ─► destination
//   mp3 ──────► musicDuck
//
//   • Two buses so "sound effects" and "music" are genuinely independent —
//     each has its own switch *and* its own volume, and both ramp rather than
//     jump, because a gain that steps from 0 to 1 in one sample is a click.
//   • One shared reverb (a generated impulse: noise under a decay curve) is
//     what makes synthesized bells read as instruments rather than beeps. It's
//     a send, so each sound decides how wet it is.
//   • A limiter on the end of the chain. Solving a group mid-arpeggio while
//     the music is playing used to stack a dozen oscillators straight onto
//     `destination` and clip; now the peaks are caught.
//   • Stings duck the music (`musicDuck`) instead of fighting it.
//   • A recorded track, where one exists, hangs off that same `musicDuck`, so
//     it inherits the switch, the volume and the ducking for free.
//
// Everything a caller schedules is placed on the audio clock in one go, from a
// single `now()` read — a chain of `setTimeout`s drifts, an arpeggio written
// against `currentTime` does not.

import { readItem, writeItem } from "./storage.ts";

// ------------------------------------------------------------- the graph ---

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfxBus: GainNode | null = null;
let musicBus: GainNode | null = null;
/** Sits under musicBus; stings dip it so the win fanfare stays on top. */
let musicDuck: GainNode | null = null;
let verbBus: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
/** True while the tab/iframe is hidden — see `ready()`. */
let backgrounded = false;

const SFX_VOL_KEY = "wordgrid:sfxvol";
const MUSIC_VOL_KEY = "wordgrid:musicvol";

let muted = readItem("wordgrid:muted") === "1";
let musicOn = readItem("wordgrid:music") === "1";
let sfxVolume = readVolume(SFX_VOL_KEY, 0.8);
let musicVolume = readVolume(MUSIC_VOL_KEY, 0.55);

function readVolume(key: string, fallback: number) {
  const raw = readItem(key);
  if (raw == null) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? clamp01(n) : fallback;
}

function clamp01(n: number) {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

/** Create/resume the AudioContext and its mixer. Must run from a user gesture. */
export function initAudio() {
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      buildGraph(ctx);
    }
    if (ctx.state === "suspended" && !backgrounded) ctx.resume().catch(() => {});
  } catch {
    ctx = null;
  }
}

function buildGraph(c: AudioContext) {
  // A limiter, not a compressor doing anything musical: a high ratio and a
  // short attack so a pile-up of voices bends instead of clipping.
  const limiter = c.createDynamicsCompressor();
  limiter.threshold.value = -8;
  limiter.knee.value = 6;
  limiter.ratio.value = 12;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.25;
  limiter.connect(c.destination);

  master = c.createGain();
  // Make-up gain. Every voice is written quiet enough to be stacked; this is
  // where the mix is brought up to a normal listening level, with the limiter
  // immediately after it to catch the loudest pile-ups.
  master.gain.value = 1.7;
  master.connect(limiter);

  sfxBus = c.createGain();
  sfxBus.gain.value = muted ? 0 : sfxVolume;
  sfxBus.connect(master);

  musicBus = c.createGain();
  musicBus.gain.value = 0; // faded up by startMusic()
  musicBus.connect(master);

  musicDuck = c.createGain();
  musicDuck.gain.value = 1;
  musicDuck.connect(musicBus);

  // The shared tail. Its own gain is modest — the send amounts do the work.
  const verb = c.createConvolver();
  verb.buffer = impulse(c, 1.6, 2.4);
  const wet = c.createGain();
  wet.gain.value = 0.9;
  verb.connect(wet);
  wet.connect(master);
  verbBus = c.createGain();
  verbBus.gain.value = 1;
  verbBus.connect(verb);

  noiseBuf = whiteNoise(c, 1);
}

/** A plausible small-room impulse: stereo noise under an exponential decay. */
function impulse(c: AudioContext, seconds: number, decay: number) {
  const len = Math.max(1, Math.floor(c.sampleRate * seconds));
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      // A few ms of near-silence at the head reads as distance rather than
      // as a second copy of the sound.
      const pre = i < c.sampleRate * 0.012 ? 0.15 : 1;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay) * pre;
    }
  }
  return buf;
}

function whiteNoise(c: AudioContext, seconds: number) {
  const len = Math.max(1, Math.floor(c.sampleRate * seconds));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

/** Pause all audio output (tab hidden / game backgrounded). */
export function suspendAudio() {
  backgrounded = true;
  // Whatever was still ringing is gone as far as the budget is concerned: a
  // node stopped inside a suspended context may not fire `onended` until the
  // context runs again, and a budget that never came back down would leave the
  // game silent after a few trips away.
  voices = 0;
  try {
    if (ctx && ctx.state === "running") ctx.suspend().catch(() => {});
  } catch {
    /* ignore */
  }
}

/** Resume audio after a suspend (tab visible again). */
export function resumeAudio() {
  backgrounded = false;
  try {
    if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
    // The clock froze while we were away; don't let the scheduler try to
    // catch up by firing a bar's worth of notes at once.
    nextNoteTime = 0;
  } catch {
    /* ignore */
  }
}

// ------------------------------------------------------- switches & dials --

export function isMuted() {
  return muted;
}

export function setMuted(m: boolean) {
  muted = m;
  writeItem("wordgrid:muted", m ? "1" : "0");
  rampBus(sfxBus, m ? 0 : sfxVolume, 0.08);
}

export function getSfxVolume() {
  return sfxVolume;
}

export function setSfxVolume(v: number) {
  sfxVolume = clamp01(v);
  writeItem(SFX_VOL_KEY, String(sfxVolume));
  if (!muted) rampBus(sfxBus, sfxVolume, 0.05);
}

export function isMusicOn() {
  return musicOn;
}

export function getMusicVolume() {
  return musicVolume;
}

export function setMusicVolume(v: number) {
  musicVolume = clamp01(v);
  writeItem(MUSIC_VOL_KEY, String(musicVolume));
  if (musicOn) rampBus(musicBus, musicVolume, 0.05);
}

function rampBus(bus: GainNode | null, to: number, seconds: number) {
  if (!ctx || !bus) return;
  const t = ctx.currentTime;
  try {
    bus.gain.cancelScheduledValues(t);
    bus.gain.setValueAtTime(bus.gain.value, t);
    bus.gain.linearRampToValueAtTime(to, t + seconds);
  } catch {
    bus.gain.value = to;
  }
}

/**
 * Can we make a sound right now? Anything scheduled while the context is
 * suspended lands on a frozen clock and all of it fires at once on resume —
 * which is exactly what a win sting hitting a backgrounded tab used to do.
 */
function ready() {
  initAudio();
  if (!ctx || muted || backgrounded) return false;
  return true;
}

function now() {
  return ctx ? ctx.currentTime : 0;
}

// A voice budget. Dragging across the logic grid or spamming tiles can ask for
// dozens of overlapping oscillators; past a couple of dozen nobody can hear the
// difference and every one of them costs CPU on a phone.
let voices = 0;
const MAX_VOICES = 28;

/** Per-sound rate limit, so a held key can't machine-gun one blip. */
const lastPlayed = new Map<string, number>();
function gate(key: string, minGap: number) {
  const t = now();
  const prev = lastPlayed.get(key);
  if (prev != null && t - prev < minGap) return false;
  lastPlayed.set(key, t);
  return true;
}

// ------------------------------------------------------------- primitives --

type Out = {
  /** -1 hard left … 1 hard right. */
  pan?: number;
  /** How much of this voice goes to the shared reverb, 0…1. */
  send?: number;
  bus?: GainNode | null;
};

/** Wire a finished voice into its bus (and the reverb send). */
function output(src: AudioNode, o: Out) {
  const c = ctx;
  if (!c) return;
  const bus = o.bus ?? sfxBus;
  if (!bus) return;
  let node = src;
  if (o.pan && c.createStereoPanner) {
    const p = c.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, o.pan));
    node.connect(p);
    node = p;
  }
  node.connect(bus);
  if (o.send && verbBus) {
    const s = c.createGain();
    s.gain.value = o.send;
    node.connect(s);
    s.connect(verbBus);
  }
}

/** Attack/decay envelope on a fresh gain node. */
function env(t: number, attack: number, dur: number, peak: number) {
  const c = ctx!;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  return g;
}

type VoiceOpts = Out & {
  type?: OscillatorType;
  dur?: number;
  attack?: number;
  peak?: number;
  /** Cents of detune — two voices a few cents apart beat, and beating is warmth. */
  detune?: number;
  /** Glide to this frequency across the note. */
  glide?: number;
  /** Lowpass cutoff. Rounding the top off a saw is the difference between a
   *  thud and a klaxon. */
  cutoff?: number;
  q?: number;
};

function voice(freq: number, t: number, o: VoiceOpts = {}) {
  const c = ctx;
  if (!c || voices >= MAX_VOICES) return;
  const dur = o.dur ?? 0.2;
  const osc = c.createOscillator();
  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(Math.max(20, freq), t);
  if (o.glide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.glide), t + dur);
  if (o.detune) osc.detune.setValueAtTime(o.detune, t);

  let node: AudioNode = osc;
  if (o.cutoff) {
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(o.cutoff, t);
    f.Q.value = o.q ?? 0.7;
    node.connect(f);
    node = f;
  }
  const g = env(t, o.attack ?? 0.008, dur, o.peak ?? 0.14);
  node.connect(g);
  output(g, o);
  start(osc, t, dur + 0.06, g);
}

type NoiseOpts = Out & {
  dur?: number;
  peak?: number;
  attack?: number;
  filter?: BiquadFilterType;
  freq?: number;
  /** Sweep the filter here across the note — the whole trick behind a whoosh. */
  sweepTo?: number;
  q?: number;
};

function noise(t: number, o: NoiseOpts = {}) {
  const c = ctx;
  if (!c || !noiseBuf || voices >= MAX_VOICES) return;
  const dur = o.dur ?? 0.15;
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const f = c.createBiquadFilter();
  f.type = o.filter ?? "bandpass";
  f.frequency.setValueAtTime(o.freq ?? 1200, t);
  if (o.sweepTo) f.frequency.exponentialRampToValueAtTime(Math.max(40, o.sweepTo), t + dur);
  f.Q.value = o.q ?? 0.8;
  const g = env(t, o.attack ?? 0.004, dur, o.peak ?? 0.05);
  src.connect(f);
  f.connect(g);
  output(g, o);
  start(src, t, dur + 0.04, g);
}

type BellOpts = Out & {
  dur?: number;
  peak?: number;
  /** Modulator:carrier ratio. Inharmonic ratios (3.01, 5.4) ring like metal. */
  ratio?: number;
  index?: number;
};

/**
 * Two-operator FM: a sine carrier whose frequency is wobbled by a second sine
 * that dies away fast. That decaying wobble is the strike; what's left is the
 * tone. It's the cheapest thing that sounds like a struck object rather than
 * a test tone, and it's what every "correct!" in this game is made of.
 */
function bell(freq: number, t: number, o: BellOpts = {}) {
  const c = ctx;
  if (!c || voices >= MAX_VOICES) return;
  const dur = o.dur ?? 0.6;
  const carrier = c.createOscillator();
  carrier.type = "sine";
  carrier.frequency.setValueAtTime(freq, t);

  const mod = c.createOscillator();
  mod.type = "sine";
  mod.frequency.setValueAtTime(freq * (o.ratio ?? 3.01), t);
  const modGain = c.createGain();
  modGain.gain.setValueAtTime(freq * (o.index ?? 2), t);
  modGain.gain.exponentialRampToValueAtTime(1, t + Math.min(0.25, dur));
  mod.connect(modGain);
  modGain.connect(carrier.frequency);

  const g = env(t, 0.004, dur, o.peak ?? 0.12);
  carrier.connect(g);
  output(g, o);
  start(mod, t, dur + 0.06, null);
  start(carrier, t, dur + 0.06, g);
}

/** Start a source, stop it, and let go of its nodes when it's done. */
function start(src: OscillatorNode | AudioBufferSourceNode, t: number, life: number, g: GainNode | null) {
  voices++;
  src.onended = () => {
    voices = Math.max(0, voices - 1);
    try {
      src.disconnect();
      g?.disconnect();
    } catch {
      /* already gone */
    }
  };
  src.start(t);
  src.stop(t + life);
}

/** Dip the music under a sting, then bring it back. */
function duck(depth: number, hold: number) {
  if (!ctx || !musicDuck || !musicOn) return;
  const t = ctx.currentTime;
  const g = musicDuck.gain;
  try {
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(depth, t + 0.08);
    g.setValueAtTime(depth, t + hold);
    g.linearRampToValueAtTime(1, t + hold + 0.6);
  } catch {
    /* ignore */
  }
}

/** Equal temperament from a MIDI note number (69 = A440). */
function hz(midi: number) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// ------------------------------------------------------------------- SFX ---

/**
 * Tile tap. `step` walks the pitch up as a selection grows, so picking four
 * words is a little rising figure instead of the same blip four times.
 */
export function playSelect(step = 0) {
  if (!ready() || !gate("select", 0.03)) return;
  const t = now();
  const f = 523.25 * Math.pow(2, Math.min(step, 7) / 12);
  voice(f, t, { type: "triangle", dur: 0.16, attack: 0.003, peak: 0.17, cutoff: 2800, send: 0.12 });
  voice(f * 2, t, { type: "sine", dur: 0.06, attack: 0.002, peak: 0.05 });
  noise(t, { dur: 0.03, peak: 0.08, filter: "highpass", freq: 2400 });
}

/** Putting a tile back: the tap, an octave down and without the sparkle. */
export function playDeselect() {
  if (!ready() || !gate("deselect", 0.03)) return;
  const t = now();
  voice(311.13, t, { type: "triangle", dur: 0.15, peak: 0.14, glide: 233, cutoff: 1300 });
  noise(t, { dur: 0.03, peak: 0.055, filter: "bandpass", freq: 900, q: 1.2 });
}

/** Clearing a selection — a short brushed-off sweep. */
export function playClear() {
  if (!ready()) return;
  const t = now();
  noise(t, { dur: 0.26, peak: 0.13, filter: "bandpass", freq: 1900, sweepTo: 420, q: 0.7, send: 0.15 });
  voice(392, t, { type: "triangle", dur: 0.16, peak: 0.1, glide: 261.63, cutoff: 1600 });
}

/** Wrong. A dull thud in the low end — a "no", not a buzzer in your ear. */
export function playWrong() {
  if (!ready()) return;
  const t = now();
  voice(150, t, { type: "sawtooth", dur: 0.28, peak: 0.1, glide: 96, cutoff: 520, q: 2 });
  voice(150, t, { type: "sawtooth", dur: 0.26, peak: 0.07, glide: 97, cutoff: 520, q: 2, detune: -11 });
  noise(t, { dur: 0.07, peak: 0.05, filter: "lowpass", freq: 900 });
}

/**
 * Three of the four. The board already says "one away" — this says it in the
 * ear: two bells a whole step apart, left hanging, over the same low thud.
 */
export function playNearMiss() {
  if (!ready()) return;
  const t = now();
  voice(155.56, t, { type: "sawtooth", dur: 0.22, peak: 0.07, glide: 130, cutoff: 600, q: 1.6 });
  bell(587.33, t, { dur: 0.55, peak: 0.075, ratio: 2.0, index: 1.4, send: 0.28 });
  bell(659.25, t + 0.02, { dur: 0.5, peak: 0.06, ratio: 2.0, index: 1.4, send: 0.28, pan: 0.25 });
}

/** A group falls. The arpeggio climbs a semitone per combo — four in a row
 *  ends noticeably brighter than four scattered ones. */
export function playCorrect(combo = 0) {
  if (!ready()) return;
  const t = now();
  const shift = Math.pow(2, Math.min(combo, 6) / 12);
  noise(t, { dur: 0.05, peak: 0.05, filter: "highpass", freq: 1600 });
  voice(130.81 * shift, t, { type: "sine", dur: 0.34, peak: 0.09, cutoff: 400 });
  [0, 4, 7, 12].forEach((s, i) =>
    bell(523.25 * shift * Math.pow(2, s / 12), t + i * 0.062, {
      dur: 0.5 + i * 0.12,
      peak: 0.11 - i * 0.014,
      send: 0.3,
      pan: (i - 1.5) * 0.12,
    })
  );
}

/** The win. Bass, a major-seventh pad, a bell run and a rising shimmer —
 *  with the music ducked underneath so the sting has the room. */
export function playWin() {
  if (!ready()) return;
  const t = now();
  duck(0.35, 2);
  voice(130.81, t, { type: "sine", dur: 0.9, attack: 0.012, peak: 0.14 });
  voice(196, t + 0.42, { type: "sine", dur: 0.9, peak: 0.11 });
  [0, 4, 7, 11].forEach((s, i) =>
    voice(261.63 * Math.pow(2, s / 12), t, {
      type: "triangle",
      dur: 1.7,
      attack: 0.07,
      peak: 0.05,
      cutoff: 2400,
      send: 0.35,
      pan: (i - 1.5) * 0.16,
    })
  );
  [0, 4, 7, 12, 16, 19].forEach((s, i) =>
    bell(523.25 * Math.pow(2, s / 12), t + 0.075 * i, { dur: 1.3, peak: 0.1, send: 0.4 })
  );
  noise(t, { dur: 0.85, peak: 0.035, filter: "bandpass", freq: 800, sweepTo: 5200, q: 0.8, send: 0.5 });
}

/** Out of tries. A minor fall that lands soft — losing is already the punishment. */
export function playLose() {
  if (!ready()) return;
  const t = now();
  duck(0.45, 1.4);
  [0, -3, -8].forEach((s, i) =>
    voice(392 * Math.pow(2, s / 12), t + i * 0.16, {
      type: "triangle",
      dur: 0.5 + i * 0.2,
      attack: 0.02,
      peak: 0.09,
      cutoff: 1400,
      send: 0.3,
    })
  );
  voice(98, t + 0.32, { type: "sine", dur: 1.1, attack: 0.05, peak: 0.1 });
}

/** A star landing on the win card. */
export function playStar(index = 0) {
  if (!ready()) return;
  const t = now();
  const f = 880 * Math.pow(2, index / 12);
  bell(f, t, { dur: 0.95, peak: 0.2, ratio: 3.01, index: 2.2, send: 0.45 });
  voice(f * 2, t + 0.01, { type: "sine", dur: 0.22, peak: 0.05 });
  noise(t, { dur: 0.22, peak: 0.05, filter: "highpass", freq: 4200, send: 0.3 });
}

/** Spending a hint token: a small ascending sparkle, all reverb tail. */
export function playHint() {
  if (!ready()) return;
  const t = now();
  [0, 5, 9, 12].forEach((s, i) =>
    bell(1046.5 * Math.pow(2, s / 12), t + i * 0.045, {
      dur: 0.7,
      peak: 0.07,
      ratio: 5.4,
      index: 1.2,
      send: 0.55,
      pan: (i - 1.5) * 0.2,
    })
  );
}

/** A level tile opening, a door unlatching: a mechanical click, then a chime. */
export function playUnlock() {
  if (!ready()) return;
  const t = now();
  noise(t, { dur: 0.045, peak: 0.075, filter: "bandpass", freq: 1500, q: 1.6 });
  voice(196, t, { type: "square", dur: 0.06, peak: 0.045, cutoff: 900 });
  bell(659.25, t + 0.055, { dur: 0.55, peak: 0.1, send: 0.32 });
  bell(987.77, t + 0.13, { dur: 0.65, peak: 0.08, send: 0.32, pan: 0.2 });
}

/** Picking something up — a key letter landing in the rail. */
export function playCollect(index = 0) {
  if (!ready()) return;
  const t = now();
  const f = 783.99 * Math.pow(2, (index % 5) / 12);
  voice(f, t, { type: "triangle", dur: 0.07, peak: 0.07, cutoff: 3200 });
  bell(f * 1.5, t + 0.06, { dur: 0.4, peak: 0.08, ratio: 2.0, index: 1.5, send: 0.3 });
}

/** Board shuffles, cards flipping, panels arriving. */
export function playWhoosh(down = false) {
  if (!ready() || !gate("whoosh", 0.05)) return;
  const t = now();
  noise(t, {
    dur: 0.34,
    peak: 0.3,
    filter: down ? "lowpass" : "highpass",
    freq: down ? 3000 : 300,
    sweepTo: down ? 400 : 3000,
    q: 0.6,
    send: 0.25,
  });
}

/** A primary button: Play, Next, a mode tile. A step up, then the landing. */
export function playConfirm() {
  if (!ready() || !gate("confirm", 0.06)) return;
  const t = now();
  voice(392, t, { type: "triangle", dur: 0.1, attack: 0.004, peak: 0.075, cutoff: 2600 });
  bell(587.33, t + 0.06, { dur: 0.45, peak: 0.09, ratio: 2.0, index: 1.6, send: 0.28 });
  noise(t, { dur: 0.03, peak: 0.035, filter: "highpass", freq: 2600 });
}

/** Menu buttons and toggles. Deliberately almost nothing. */
export function playUi() {
  if (!ready() || !gate("ui", 0.04)) return;
  const t = now();
  voice(880, t, { type: "sine", dur: 0.06, peak: 0.075, cutoff: 3000 });
  noise(t, { dur: 0.02, peak: 0.05, filter: "highpass", freq: 3200 });
}

/**
 * One try left: two low pulses, the only sound in the game that nags. Takes a
 * delay because it always follows the wrong-guess thud that caused it.
 */
export function playWarn(after = 0) {
  if (!ready()) return;
  const t = now() + after;
  [0, 0.19].forEach((o) =>
    voice(146.83, t + o, { type: "triangle", dur: 0.17, peak: 0.095, cutoff: 700 })
  );
}

// ----------------------------------------------------------------- music ---
//
// A four-bar loop per scene, scheduled a fraction of a second ahead of the
// clock rather than fired from `setInterval` (which drifts, and drifts audibly
// once notes are meant to line up). The timer only *decides*; the audio clock
// plays. Three scenes share one key, so switching between menus and a board
// doesn't sound like changing the record — the boss set turns it minor.

type Scene = "menu" | "play" | "boss";
type Bar = { root: number; pad: number[]; arp: number[] };
type SceneDef = {
  bpm: number;
  bars: Bar[];
  /** Chance an eighth-note gets a melody note. */
  arp: number;
  /** Quiet noise tick on the offbeat — motion without a drum kit. */
  brush: boolean;
  /** Sustained low note under the whole bar. */
  drone: boolean;
  level: number;
};

const SCENES: Record<Scene, SceneDef> = {
  // Home, level select, results: warm, slow, mostly air.
  menu: {
    bpm: 62,
    bars: [
      { root: 36, pad: [60, 64, 67, 71], arp: [72, 76, 79, 83, 84] },
      { root: 33, pad: [57, 60, 64, 67], arp: [72, 76, 79, 81, 84] },
      { root: 29, pad: [53, 57, 60, 64], arp: [69, 72, 76, 77, 81] },
      { root: 31, pad: [55, 59, 62, 67], arp: [71, 74, 79, 81, 86] },
    ],
    arp: 0.3,
    brush: false,
    drone: false,
    level: 1,
  },
  // On a board: same key, a pulse in the bass, a little more melody. It has to
  // survive being heard for twenty minutes while someone is thinking.
  play: {
    bpm: 74,
    bars: [
      { root: 38, pad: [57, 62, 65, 69], arp: [69, 72, 74, 77, 81] },
      { root: 34, pad: [58, 62, 65, 69], arp: [70, 74, 77, 81, 82] },
      { root: 36, pad: [55, 60, 64, 67], arp: [72, 76, 79, 84] },
      { root: 29, pad: [53, 57, 60, 65], arp: [69, 72, 77, 81] },
    ],
    arp: 0.34,
    brush: true,
    drone: false,
    level: 0.95,
  },
  // Boss doors: minor, slower, a drone under it.
  boss: {
    bpm: 58,
    bars: [
      { root: 33, pad: [57, 60, 64], arp: [69, 72, 76, 79] },
      { root: 29, pad: [53, 57, 60], arp: [65, 68, 72, 77] },
      { root: 31, pad: [55, 58, 62], arp: [67, 70, 74, 79] },
      { root: 28, pad: [52, 56, 59], arp: [64, 68, 71, 76] },
    ],
    arp: 0.26,
    brush: true,
    drone: true,
    level: 1,
  },
};

let synthTimer: ReturnType<typeof setInterval> | null = null;
/** The transport: true between startMusic() and stopMusic(), whatever is
 *  actually making the sound — a file or the synth loop. */
let musicPlaying = false;
let scene: Scene = "menu";
let pendingScene: Scene | null = null;
let step = 0; // sixteenths, 0…63 (four bars)
let nextNoteTime = 0;

const LOOKAHEAD = 0.15; // seconds of audio scheduled in advance
const TICK_MS = 25;

// --------------------------------------------------------- recorded music ---
//
// Placeholders, wired end to end. Drop an mp3 into `public/music/` under one of
// the names below and that scene plays the file instead of the synth loop — no
// code change, no import, no build step:
//
//   public/music/menu.mp3   home, level select, results
//   public/music/play.mp3   any board
//   public/music/boss.mp3   boss doors
//
// Until a file is there — and if it ever 404s, or a browser can't decode it —
// the synth loop keeps playing, so the game is never silent and shipping a
// track is a one-file commit. Tracks can also land one at a time: a scene with
// a file uses it, a scene without one falls back, in the same session.
//
// Files are decoded into a buffer rather than streamed through an <audio>
// element: a buffer loops sample-accurately (an <audio> loop has an audible
// seam at the wrap) and it feeds the same musicDuck → musicBus chain as the
// synth, so the music switch, the music volume and the sting ducking keep
// working untouched. Keep tracks short and loopable — a two-minute 128 kbps mp3
// is ~2 MB on the wire but ~20 MB decoded, and the decoded size is the one that
// matters on a phone.
//
// Nothing is fetched until the player turns music on, so a player who never
// does downloads none of it.

type TrackDef = {
  /** Path under `public/`, resolved against the app's base URL. */
  file: string;
  /** Trim, 0…1. Recorded stems arrive at wildly different levels; this is where
   *  a track is matched to the rest of the mix instead of being re-exported. */
  gain: number;
  /** Optional loop window, in seconds into the file. Leave both out to loop the
   *  whole thing; set them to skip a one-shot intro or trim a decay tail. */
  loopStart?: number;
  loopEnd?: number;
};

const TRACKS: Record<Scene, TrackDef> = {
  menu: { file: "music/menu.mp3", gain: 0.9 },
  play: { file: "music/play.mp3", gain: 0.9 },
  boss: { file: "music/boss.mp3", gain: 0.9 },
};

/** Crossfade between two tracks, or between a track and the synth loop. */
const TRACK_FADE = 1.2;

/** Cover a scene that has no file with the synth loop. Turn this off once every
 *  scene has a track and the loop is just weight in the bundle. */
const SYNTH_FALLBACK = true;

type TrackState = "idle" | "loading" | "ready" | "missing";
const trackState: Record<Scene, TrackState> = { menu: "idle", play: "idle", boss: "idle" };
const trackBuffers = new Map<Scene, AudioBuffer>();

let trackSource: AudioBufferSourceNode | null = null;
let trackGain: GainNode | null = null;
/** Which scene's file is currently playing, if any. */
let trackScene: Scene | null = null;

/** What the loader found for each scene — for the debug panel and the tests. */
export function musicTrackStates(): Record<Scene, TrackState> {
  return { ...trackState };
}

/** What is making the music right now. `synth` means the scene has no file. */
export function musicSource(): "track" | "synth" | "off" {
  if (!musicPlaying) return "off";
  if (trackScene) return "track";
  return synthTimer ? "synth" : "off";
}

function trackUrl(file: string) {
  const base =
    (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.BASE_URL ?? "./";
  return `${base.endsWith("/") ? base : `${base}/`}${file}`;
}

/** Promise or callback form — Safari only grew the promise late. */
function decode(c: AudioContext, bytes: ArrayBuffer) {
  return new Promise<AudioBuffer>((resolve, reject) => {
    const p = c.decodeAudioData(bytes, resolve, reject);
    if (p && typeof p.then === "function") p.then(resolve, reject);
  });
}

/**
 * Fetch and decode one scene's file. Runs at most once per scene per session:
 * a missing file is remembered as missing, so an empty `public/music/` costs
 * one 404 rather than one per screen change.
 */
async function loadTrack(s: Scene) {
  const c = ctx;
  if (!c || trackState[s] !== "idle") return;
  trackState[s] = "loading";
  try {
    const res = await fetch(trackUrl(TRACKS[s].file));
    // A dev server that answers every path with index.html is the usual way a
    // missing file arrives as a 200 — the decode rejects on it either way.
    if (!res.ok) throw new Error(String(res.status));
    trackBuffers.set(s, await decode(c, await res.arrayBuffer()));
    trackState[s] = "ready";
  } catch {
    trackState[s] = "missing";
    return;
  }
  // The decode may have taken long enough that the player moved on, or turned
  // the music off. If they didn't, this is the hand-over from the synth loop.
  if (musicPlaying && s === scene) applyScene(s);
}

function startTrack(s: Scene, fade: number) {
  const c = ctx;
  const buf = trackBuffers.get(s);
  if (!c || !buf || !musicDuck) return false;
  stopTrack(fade); // the outgoing one fades down while this one comes up
  const t = c.currentTime;

  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(TRACKS[s].gain, t + fade);
  g.connect(musicDuck);

  const src = c.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const { loopStart, loopEnd } = TRACKS[s];
  if (loopStart != null) src.loopStart = loopStart;
  if (loopEnd != null) src.loopEnd = loopEnd;
  src.connect(g);
  src.start(t);

  trackSource = src;
  trackGain = g;
  trackScene = s;
  return true;
}

function stopTrack(fade: number) {
  const c = ctx;
  const src = trackSource;
  const g = trackGain;
  trackSource = null;
  trackGain = null;
  trackScene = null;
  if (!c || !src) return;
  const t = c.currentTime;
  src.onended = () => {
    try {
      src.disconnect();
      g?.disconnect();
    } catch {
      /* already gone */
    }
  };
  try {
    if (g) {
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.linearRampToValueAtTime(0.0001, t + fade);
    }
    src.stop(t + fade + 0.05);
  } catch {
    try {
      src.stop();
    } catch {
      /* already stopped */
    }
  }
}

/**
 * Point the music at a scene: its file if there is one, the synth loop while
 * there isn't. Safe to call repeatedly — already playing the right thing is a
 * no-op, which is what lets the loader call it back.
 */
function applyScene(s: Scene, fade = TRACK_FADE) {
  if (!ctx || !musicPlaying) return;
  if (trackState[s] === "idle") void loadTrack(s);
  // `startTrack` can still say no — the buffer is gone, or the graph isn't
  // built — and stopping the loop for a track that never started would be a
  // silence, so the hand-over only happens once it has actually begun.
  if (trackState[s] === "ready" && (trackScene === s || startTrack(s, fade))) {
    stopSynth();
    return;
  }
  stopTrack(fade);
  if (SYNTH_FALLBACK) startSynth();
}

// --------------------------------------------------------- the transport ---

export function setMusicOn(on: boolean) {
  musicOn = on;
  writeItem("wordgrid:music", on ? "1" : "0");
  if (on) startMusic();
  else stopMusic();
}

/**
 * Which scene the music follows. Called on every screen change; a repeat is
 * free. A file swap crossfades straight away; the synth loop instead waits for
 * the next bar line, so a change lands as a modulation and not as a cut.
 */
export function setMusicScene(next: Scene) {
  if (next === scene && !pendingScene) return;
  if (!musicPlaying) {
    scene = next;
    pendingScene = null;
    return;
  }
  if (trackState[next] === "idle") void loadTrack(next);
  if (trackState[next] === "ready" || trackScene !== null) {
    scene = next;
    pendingScene = null;
    applyScene(next);
    return;
  }
  pendingScene = next;
}

export function startMusic() {
  initAudio();
  if (!ctx || !musicOn || musicPlaying) return;
  musicPlaying = true;
  rampBus(musicBus, musicVolume, 1.6); // fade in — never punch in at full level
  applyScene(scene, 0.8);
}

export function stopMusic() {
  if (!musicPlaying) return;
  musicPlaying = false;
  pendingScene = null;
  stopSynth();
  stopTrack(0.7);
  // What is already on the clock isn't cancelled — it fades out with the bus,
  // which is what makes stopping sound like an ending and not a cut.
  rampBus(musicBus, 0, 0.7);
}

function startSynth() {
  if (!ctx || synthTimer) return;
  step = 0;
  nextNoteTime = 0;
  synthTimer = setInterval(schedule, TICK_MS);
  schedule();
}

function stopSynth() {
  if (!synthTimer) return;
  clearInterval(synthTimer);
  synthTimer = null;
}

function schedule() {
  const c = ctx;
  if (!c || !musicOn || backgrounded) return;
  const spStep = 60 / SCENES[scene].bpm / 4; // one sixteenth
  // First tick, or the clock froze under us while the tab was hidden.
  if (nextNoteTime < c.currentTime) nextNoteTime = c.currentTime + 0.06;
  let switched = false;
  while (nextNoteTime < c.currentTime + LOOKAHEAD) {
    emit(step, nextNoteTime);
    step = (step + 1) % 64;
    if (step === 0 && pendingScene) {
      scene = pendingScene;
      pendingScene = null;
      switched = true;
    }
    nextNoteTime += spStep;
  }
  // The bar line came round. If the new scene has a file — or one finished
  // loading while we played the old scene out — this is where it takes over.
  if (switched) applyScene(scene);
}

/** One sixteenth of the loop. */
function emit(s: number, t: number) {
  const def = SCENES[scene];
  const bar = def.bars[Math.floor(s / 16) % def.bars.length];
  const beat = s % 16;
  const spb = 60 / def.bpm;
  const level = def.level;

  if (beat === 0) {
    // The pad: the chord, spread across the stereo field, slow in and long out.
    bar.pad.forEach((n, i) =>
      voice(hz(n), t, {
        type: "triangle",
        dur: spb * 4.4,
        attack: spb * 0.9,
        peak: 0.045 * level,
        cutoff: 1500,
        detune: i % 2 ? 5 : -5,
        pan: (i - (bar.pad.length - 1) / 2) * 0.3,
        send: 0.45,
        bus: musicDuck,
      })
    );
    voice(hz(bar.root), t, {
      type: "sine",
      dur: spb * 1.4,
      attack: 0.02,
      peak: 0.08 * level,
      cutoff: 400,
      bus: musicDuck,
    });
    if (def.drone) {
      voice(hz(bar.root - 12), t, {
        type: "sine",
        dur: spb * 4.2,
        attack: spb,
        peak: 0.05,
        bus: musicDuck,
      });
    }
  }

  // A second bass note off the downbeat keeps a slow tempo moving.
  if (beat === 10 && scene !== "menu") {
    voice(hz(bar.root + 7), t, {
      type: "sine",
      dur: spb * 0.8,
      attack: 0.02,
      peak: 0.055 * level,
      cutoff: 400,
      bus: musicDuck,
    });
  }

  if (def.brush && beat % 4 === 2) {
    noise(t, {
      dur: 0.05,
      peak: 0.012,
      filter: "highpass",
      freq: 6000,
      pan: beat % 8 === 2 ? -0.25 : 0.25,
      send: 0.3,
      bus: musicDuck,
    });
  }

  // Melody: sparse, never on the downbeat (that belongs to the chord), and
  // random enough that a long session doesn't learn the tune.
  if (beat % 2 === 0 && beat !== 0 && Math.random() < def.arp) {
    const n = bar.arp[Math.floor(Math.random() * bar.arp.length)];
    bell(hz(n), t, {
      dur: 1.1,
      peak: 0.05 * level,
      ratio: 2.0,
      index: 1.4,
      send: 0.6,
      pan: (Math.random() - 0.5) * 0.7,
      bus: musicDuck,
    });
  }
}
