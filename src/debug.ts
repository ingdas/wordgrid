// Debug mode — the owner's/QA's switch, deliberately not a player feature.
//
// Turning it on, any of three ways:
//   • append `?debug` to the URL (remembered afterwards; `?debug=0` clears it)
//   • flip "Debug mode" in Settings → Developer
//   • set localStorage["wordgrid:debug"] = "1" (what the headless tests do)
//
// What it buys, wherever it's read:
//   • every level and every boss door open (progress.ts)
//   • hints cost nothing and the bank can be topped up on demand
//   • an in-game tool panel: solve one group, auto-solve the board, reveal
//     every theme, peek at the secret link, force a loss (Game.tsx)
//   • the Logic Grid can paint its own solution (Deduction.tsx)
//   • the index can clear the next level outright (LevelSelect.tsx)
//
// The flag is cached in module scope so the URL is parsed once per load; the
// Settings toggle goes through setDebug(), which keeps that cache honest.
const KEY = "wordgrid:debug";

let cache: boolean | null = null;

export function isDebug(): boolean {
  if (cache !== null) return cache;
  try {
    const q = new URLSearchParams(window.location.search);
    if (q.has("debug")) localStorage.setItem(KEY, q.get("debug") === "0" ? "0" : "1");
    cache = localStorage.getItem(KEY) === "1";
  } catch {
    cache = false;
  }
  return cache;
}

/** Turn debug mode on or off for the rest of this session, and remember it. */
export function setDebug(on: boolean): void {
  cache = on;
  try {
    localStorage.setItem(KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

/** Test seam: forget the cached read so the next isDebug() re-reads storage. */
export function resetDebugCache(): void {
  cache = null;
}
