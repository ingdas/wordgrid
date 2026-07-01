// Tiny synthesized sound-effects engine. No audio files — everything is
// generated with the Web Audio API, so the build stays self-contained and
// loads instantly inside the CrazyGames iframe.

let ctx: AudioContext | null = null;
let muted = false;
try {
  muted = localStorage.getItem("wordgrid:muted") === "1";
} catch {
  /* ignore */
}

/** Create/resume the AudioContext. Must be called from a user gesture. */
export function initAudio() {
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === "suspended") void ctx.resume();
  } catch {
    ctx = null;
  }
}

/** Pause all audio output (tab hidden / game backgrounded). */
export function suspendAudio() {
  try {
    if (ctx && ctx.state === "running") void ctx.suspend();
  } catch {
    /* ignore */
  }
}

/** Resume audio after a suspend (tab visible again). */
export function resumeAudio() {
  try {
    if (ctx && ctx.state === "suspended") void ctx.resume();
  } catch {
    /* ignore */
  }
}

export function isMuted() {
  return muted;
}

export function setMuted(m: boolean) {
  muted = m;
  try {
    localStorage.setItem("wordgrid:muted", m ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function blip(freq: number, at: number, dur: number, type: OscillatorType = "sine", peak = 0.18) {
  if (!ctx || muted) return;
  const t = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.start(t);
  osc.stop(t + dur + 0.03);
}

export function playSelect() {
  initAudio();
  blip(523.25, 0, 0.08, "triangle", 0.1);
}

export function playDeselect() {
  initAudio();
  blip(392, 0, 0.07, "triangle", 0.08);
}

export function playClear() {
  initAudio();
  blip(330, 0, 0.08, "sine", 0.09);
  blip(247, 0.05, 0.1, "sine", 0.09);
}

export function playWrong() {
  initAudio();
  blip(170, 0, 0.18, "sawtooth", 0.12);
  blip(130, 0.09, 0.2, "sawtooth", 0.1);
}

/** Correct group — an ascending arpeggio that climbs higher per combo. */
export function playCorrect(combo = 0) {
  initAudio();
  const shift = Math.pow(2, combo / 12);
  [523.25, 659.25, 783.99].forEach((f, i) => blip(f * shift, i * 0.075, 0.18, "triangle", 0.16));
}

export function playWin() {
  initAudio();
  [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => blip(f, i * 0.1, 0.45, "triangle", 0.16));
}

export function playStar(index = 0) {
  initAudio();
  blip(880 * Math.pow(2, index / 12), 0, 0.25, "triangle", 0.16);
}

// --- Ambient background music (synthesized, independent of the SFX mute) -----

let musicTimer: ReturnType<typeof setInterval> | null = null;
let musicOn = false;
try {
  musicOn = localStorage.getItem("wordgrid:music") === "1";
} catch {
  /* ignore */
}

const PENTATONIC = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25]; // C D E G A C

export function isMusicOn() {
  return musicOn;
}

export function setMusicOn(on: boolean) {
  musicOn = on;
  try {
    localStorage.setItem("wordgrid:music", on ? "1" : "0");
  } catch {
    /* ignore */
  }
  if (on) startMusic();
  else stopMusic();
}

function pad(freq: number, dur: number, peak: number) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + 0.5);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.start(t);
  osc.stop(t + dur + 0.1);
}

export function startMusic() {
  initAudio();
  if (!ctx || !musicOn || musicTimer) return;
  const tick = () => {
    const note = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)];
    pad(note, 2.8, 0.04);
    if (Math.random() < 0.45) pad(note / 2, 3.4, 0.025); // occasional low drone
  };
  tick();
  musicTimer = setInterval(tick, 2000);
}

export function stopMusic() {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}
