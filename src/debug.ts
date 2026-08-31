// Debug mode — the owner's/QA's switch, deliberately not a player feature.
//
// It is on for exactly as long as `?debug` is in the page's URL (`?debug=0`
// counts as absent), and it is not remembered: drop the query and the next
// load is an ordinary player's, with no trace of it in storage. While the query
// is there, Settings → Developer shows a "Debug mode" toggle that turns it off
// and back on for the rest of the session, so a screen can be checked the way a
// player sees it without editing the URL. The headless tests open `?debug` too.
//
// What it buys, wherever it's read:
//   • every level and every boss door open (progress.ts)
//   • hints cost nothing and the bank can be topped up on demand
//   • an in-game tool panel: solve one group, auto-solve the board, reveal
//     every theme, peek at the secret link, force a loss (Game.tsx)
//   • the index can clear the next level outright (LevelSelect.tsx)
//
// The URL is parsed once per load and the answer cached in module scope; the
// Settings toggle goes through setDebug(), which only ever touches that cache.

let cache: boolean | null = null;

/** Whether this page was opened with `?debug` — the only way debug mode starts. */
export function debugRequested(): boolean {
  try {
    const q = new URLSearchParams(window.location.search);
    return q.has("debug") && q.get("debug") !== "0";
  } catch {
    return false;
  }
}

export function isDebug(): boolean {
  if (cache === null) cache = debugRequested();
  return cache;
}

/** Turn debug mode off or back on for the rest of this session. Nothing is stored. */
export function setDebug(on: boolean): void {
  cache = on;
}

/** Test seam: forget the cached read so the next isDebug() re-reads the URL. */
export function resetDebugCache(): void {
  cache = null;
}
