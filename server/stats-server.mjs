#!/usr/bin/env node
// The other half of src/stats.ts: a dependency-free stats endpoint.
//
// The game is a static bundle (GitHub Pages, or an iframe on CrazyGames), so
// "how many people have solved level 14" has to be counted somewhere else.
// This is that somewhere: two endpoints, one SQLite file, no npm install.
//
//   POST /events    {"v":1,"events":[{uid,player,id,level,kind,mode,at,…}]}
//                   → {"ok":true,"stored":n}
//   GET  /levels    → {"levels":{"<id>":{players,solvers,plays,wins}}}
//   GET  /levels.csv → the same table as CSV, for a spreadsheet
//   GET  /health    → {"ok":true,"events":n}
//
// Run it:
//
//   node server/stats-server.mjs                  # :8787, ./stats.db
//   PORT=9000 DB=/var/lib/wordgrid.db \
//     ORIGIN=https://ingdas.github.io node server/stats-server.mjs
//
// Then point the game at it, either at build time
//
//   VITE_STATS_URL=https://stats.example.com npm run build
//
// or, without rebuilding, by editing the `<meta name="wordgrid:stats">` tag in
// index.html / docs/index.html.
//
// Design notes, since the client's guarantees depend on them:
//   • `uid` is the primary key, so a client that retries a batch whose response
//     it never saw stores it once. Retries are the normal case offline.
//   • Nothing identifying is stored — no IP, no user agent, no account. The
//     `player` column is a random id the install generated for itself, and it
//     exists so that "12 people solved this" isn't "12 plays by one person".
//   • Every field is clamped and whitelisted on the way in: this is an open
//     endpoint on the internet, and the game trusts what it reads back.
//   • Aggregation is one GROUP BY over the events, cached briefly. At this
//     scale that is far simpler than maintaining counters, and it means a
//     schema change is a query change, not a migration.
import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";

const PORT = Number(process.env.PORT ?? 8787);
const DB_PATH = process.env.DB ?? "./stats.db";
// Comma-separated allowlist, or "*" (the default) — the data is anonymous
// counters, and the game may be embedded on a portal's own domain.
const ORIGIN = process.env.ORIGIN ?? "*";
/** Refuse absurd bodies before parsing them. */
const MAX_BODY = 256 * 1024;
const MAX_EVENTS = 100;
/** How long an aggregate is served from memory before it's recomputed. */
const CACHE_MS = 30_000;

const KINDS = new Set(["start", "win", "loss"]);
const MODES = new Set(["campaign", "daily"]);

const db = new DatabaseSync(DB_PATH);
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS plays (
    uid       TEXT PRIMARY KEY,
    player    TEXT NOT NULL,
    level_id  TEXT NOT NULL,
    level     INTEGER NOT NULL DEFAULT 0,
    kind      TEXT NOT NULL,
    mode      TEXT NOT NULL,
    at        INTEGER NOT NULL,
    received  INTEGER NOT NULL,
    mistakes  INTEGER,
    time_ms   INTEGER,
    stars     INTEGER
  );
  CREATE INDEX IF NOT EXISTS plays_level ON plays(level_id);
`);

const insert = db.prepare(`
  INSERT OR IGNORE INTO plays
    (uid, player, level_id, level, kind, mode, at, received, mistakes, time_ms, stars)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const aggregate = db.prepare(`
  SELECT level_id,
         MAX(level)                                              AS level,
         COUNT(DISTINCT CASE WHEN kind = 'start' THEN player END) AS players,
         COUNT(DISTINCT CASE WHEN kind = 'win'   THEN player END) AS solvers,
         SUM(CASE WHEN kind IN ('win', 'loss') THEN 1 ELSE 0 END) AS plays,
         SUM(CASE WHEN kind = 'win'            THEN 1 ELSE 0 END) AS wins
  FROM plays
  GROUP BY level_id
`);

const countAll = db.prepare(`SELECT COUNT(*) AS n FROM plays`);

const str = (v, max) => (typeof v === "string" ? v.slice(0, max) : "");
const int = (v, lo, hi) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? Math.min(Math.max(n, lo), hi) : 0;
};

/** One event, or null if it isn't one. Nothing half-valid gets stored. */
function clean(e, now) {
  if (!e || typeof e !== "object") return null;
  const uid = str(e.uid, 64);
  const player = str(e.player, 64);
  const id = str(e.id, 64);
  const kind = str(e.kind, 16);
  const mode = str(e.mode, 16);
  if (uid.length < 8 || player.length < 8 || !id || !KINDS.has(kind) || !MODES.has(mode)) return null;
  // A client clock can be anything at all; keep it, but never let it drive
  // anything but its own column.
  const at = int(e.at, 0, 4_102_444_800_000) || now;
  return [
    uid,
    player,
    id,
    int(e.level, 0, 10_000),
    kind,
    mode,
    at,
    now,
    int(e.mistakes, 0, 99),
    int(e.timeMs, 0, 24 * 3600 * 1000),
    int(e.stars, 0, 3),
  ];
}

let cache = null;

function levels() {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.rows;
  const rows = aggregate.all();
  cache = { at: Date.now(), rows };
  return rows;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error("body too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", ORIGIN);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");
}

function json(res, code, body) {
  const text = JSON.stringify(body);
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
  res.end(text);
}

const server = createServer(async (req, res) => {
  cors(res);
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "POST" && url.pathname === "/events") {
    let payload;
    try {
      payload = JSON.parse(await readBody(req));
    } catch {
      return json(res, 400, { ok: false, error: "bad body" });
    }
    const list = Array.isArray(payload?.events) ? payload.events.slice(0, MAX_EVENTS) : null;
    if (!list) return json(res, 400, { ok: false, error: "no events" });
    const now = Date.now();
    let stored = 0;
    // One transaction: a batch is accepted whole or not at all, which is what
    // lets the client drop it from its queue on a 200.
    db.exec("BEGIN");
    try {
      for (const e of list) {
        const row = clean(e, now);
        // `changes` is 0 for a uid we already hold, so a replayed batch
        // reports what it actually added: nothing.
        if (row) stored += insert.run(...row).changes;
      }
      db.exec("COMMIT");
    } catch (err) {
      db.exec("ROLLBACK");
      return json(res, 500, { ok: false, error: String(err?.message ?? err) });
    }
    cache = null;
    return json(res, 200, { ok: true, stored });
  }

  if (req.method === "GET" && url.pathname === "/levels") {
    const out = {};
    for (const r of levels()) {
      out[r.level_id] = {
        level: r.level,
        players: r.players,
        solvers: r.solvers,
        plays: r.plays,
        wins: r.wins,
      };
    }
    // Short cache: the game keeps its own copy for hours, this is for proxies.
    res.setHeader("Cache-Control", "public, max-age=60");
    return json(res, 200, { levels: out });
  }

  if (req.method === "GET" && url.pathname === "/levels.csv") {
    const lines = ["level,level_id,players,solvers,plays,wins,win_rate"];
    for (const r of [...levels()].sort((a, b) => a.level - b.level)) {
      const rate = r.plays ? (r.wins / r.plays).toFixed(3) : "";
      lines.push([r.level, r.level_id, r.players, r.solvers, r.plays, r.wins, rate].join(","));
    }
    res.writeHead(200, { "Content-Type": "text/csv; charset=utf-8" });
    return res.end(lines.join("\n"));
  }

  if (req.method === "GET" && (url.pathname === "/health" || url.pathname === "/")) {
    return json(res, 200, { ok: true, events: countAll.get().n });
  }

  return json(res, 404, { ok: false, error: "not found" });
});

server.listen(PORT, () => {
  console.log(`wordgrid stats on :${PORT} → ${DB_PATH} (origin ${ORIGIN})`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(() => {
      db.close();
      process.exit(0);
    });
  });
}
