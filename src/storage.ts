// Persistence, written for a game that lives in someone else's iframe.
//
// Everything the player has — 100 levels of stars, the streak, the chapter
// keys, the hint bank — is one JSON blob under `wordgrid:progress`. On
// CrazyGames that blob sits in *third-party* storage: Safari's ITP, Firefox's
// ETP and Chrome's storage partitioning can hand the embed a fresh, empty (or
// short-lived) `localStorage`, and some embeds refuse the API outright. The old
// code caught the exception and moved on, so a wiped save looked exactly like a
// new player. Nobody files that bug; they just stop playing.
//
// So reads and writes go through here instead, over up to three backends:
//
//   1. `localStorage` — the source of truth when it works (everywhere but the
//      awkward embeds). Probed once with a real write, because a partitioned
//      store can hand back an object whose `setItem` throws.
//   2. The **CrazyGames data module** (`sdk.ts`'s `sdkData()`) — the platform's
//      own key/value store, which survives partitioning. It arrives late (the
//      SDK script is `async`), so `startSdkMirror()` polls for it, then copies
//      in both directions: anything only the platform has is adopted back —
//      that is the wiped-save recovery — and anything only we have is pushed up.
//   3. An in-memory map — always written, so a session with no durable storage
//      at all is still *coherent* while it lasts. `isDurable()` says whether
//      that's all we've got, and the UI owes the player a warning when it is.
import { sdkData } from "./sdk.ts";

/** Every key the game persists. The mirror copies exactly these. */
export const KEYS = [
  "wordgrid:progress",
  "wordgrid:tutorial",
  "wordgrid:calm",
  "wordgrid:debug",
  "wordgrid:muted",
  "wordgrid:music",
  "wordgrid:locale",
  // The anonymous telemetry id (src/stats.ts). Mirrored for the same reason
  // the save is: a partitioned localStorage would otherwise turn one returning
  // player into a new "person" on every visit, and the level stats count
  // people.
  "wordgrid:player",
] as const;

const PROBE = "wordgrid:probe";

// Always written, always read as a last resort: the session stays consistent
// even when nothing outlives it.
const memory = new Map<string, string>();

let localOk: boolean | null = null; // null = not probed yet

/**
 * `localStorage`, but only if it genuinely works. A store that exists and
 * throws on write is worse than no store at all, so the probe writes.
 */
function local(): Storage | null {
  if (localOk === false) return null;
  try {
    const store = (globalThis as { localStorage?: Storage }).localStorage;
    if (!store) {
      localOk = false;
      return null;
    }
    if (localOk === null) {
      store.setItem(PROBE, "1");
      store.removeItem(PROBE);
      localOk = true;
    }
    return store;
  } catch {
    localOk = false;
    return null;
  }
}

export function readItem(key: string): string | null {
  const store = local();
  if (store) {
    try {
      const v = store.getItem(key);
      if (v !== null) {
        memory.set(key, v);
        return v;
      }
    } catch {
      localOk = false;
    }
  }
  const data = sdkData();
  if (data?.getItem) {
    try {
      const v = data.getItem(key);
      if (v !== null && v !== undefined) {
        memory.set(key, v);
        return v;
      }
    } catch {
      /* the platform store is optional — fall through */
    }
  }
  return memory.has(key) ? memory.get(key)! : null;
}

/** Write through to every backend that will take it. Never throws. */
export function writeItem(key: string, value: string): void {
  memory.set(key, value);
  const store = local();
  if (store) {
    try {
      store.setItem(key, value);
    } catch {
      // Quota, or a partitioned store that only pretends to work.
      localOk = false;
    }
  }
  const data = sdkData();
  if (data?.setItem) {
    try {
      data.setItem(key, value);
    } catch {
      /* ignore */
    }
  }
}

export function removeItem(key: string): void {
  memory.delete(key);
  const store = local();
  if (store) {
    try {
      store.removeItem(key);
    } catch {
      localOk = false;
    }
  }
  const data = sdkData();
  if (data?.removeItem) {
    try {
      data.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}

/** Will anything written now still be here next visit? */
export function isDurable(): boolean {
  return local() !== null || sdkData() !== null;
}

/**
 * Reconcile with the platform store, once it exists.
 *
 * Both directions matter. Pulling is the recovery case — `localStorage` came
 * back empty because the browser partitioned or cleared it, and the platform
 * still has the real save. Pushing is the insurance — this player's progress
 * has only ever been local, and the next visit may not get that store back.
 *
 * A key is only adopted when we have nothing for it: a live save always beats
 * whatever the platform is holding, so a session in progress is never
 * overwritten by a stale copy.
 *
 * @returns true if anything was adopted (the caller should re-read progress).
 */
export function syncSdkStorage(): boolean {
  const data = sdkData();
  if (!data?.getItem) return false;
  let adopted = false;
  for (const key of KEYS) {
    let mine: string | null = null;
    const store = local();
    if (store) {
      try {
        mine = store.getItem(key);
      } catch {
        localOk = false;
      }
    }
    if (mine === null && memory.has(key)) mine = memory.get(key)!;

    let theirs: string | null = null;
    try {
      theirs = data.getItem(key) ?? null;
    } catch {
      return adopted;
    }

    if (mine === null && theirs !== null) {
      memory.set(key, theirs);
      if (store) {
        try {
          store.setItem(key, theirs);
        } catch {
          localOk = false;
        }
      }
      adopted = true;
    } else if (mine !== null && theirs !== mine && data.setItem) {
      try {
        data.setItem(key, mine);
      } catch {
        /* ignore */
      }
    }
  }
  return adopted;
}

// The SDK script is `async`, so it can turn up several seconds after React
// mounts — or never, off-platform. Poll briefly rather than assuming either.
const MIRROR_TRIES = 12;
const MIRROR_GAP_MS = 700;

/**
 * Wait for the platform store, mirror against it, then report.
 *
 * @param onAdopt called (once) if a save was recovered from the platform.
 * @param onSettled called once the answer is known either way, with whether
 *        anything durable exists — that's the cue to warn the player.
 */
export function startSdkMirror(onAdopt: () => void, onSettled: (durable: boolean) => void): () => void {
  let tries = 0;
  let stopped = false;
  let reported = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const report = (durable: boolean) => {
    if (reported) return;
    reported = true;
    onSettled(durable);
  };

  const attempt = () => {
    if (stopped) return;
    if (sdkData()) {
      // Mirrors both ways: recovers a wiped save, and — the case that matters
      // on a working embed — pushes this player's local save up to the
      // platform *before* the browser gets a chance to partition it away.
      if (syncSdkStorage()) onAdopt();
      report(true);
      stopped = true;
      return;
    }
    // Ordinary storage works, so the player has a durable home either way; say
    // so now, but keep waiting for the platform store to push a copy to.
    if (local() !== null) report(true);
    if (++tries >= MIRROR_TRIES) {
      report(isDurable());
      stopped = true;
      return;
    }
    timer = setTimeout(attempt, MIRROR_GAP_MS);
  };

  attempt();
  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}

/** Test seam: forget the probe result and the in-memory copies. */
export function resetStorageCache(): void {
  localOk = null;
  memory.clear();
}
