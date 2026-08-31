// The CrazyGames upload: the built game, zipped the way the portal's upload
// form wants it — `index.html` at the root of the archive, every path
// relative, nothing in it that isn't the game.
//
// Runs as a Vite plugin at the end of every `npm run build`, so the zip in
// docs/art/ can never be older than the site it sits beside, and the art page
// (public/art/index.html) links to it and reads `dist.json` for the listing.
//
// The archive is written by hand rather than with the `zip` CLI so that a
// rebuild of unchanged sources gives a byte-identical file: entries in sorted
// order, one fixed timestamp, no filesystem attributes. Otherwise every build
// would churn a ~500 kB binary in the committed docs/ for nothing.
import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, posix, relative, resolve, sep } from "node:path";
import { deflateRawSync } from "node:zlib";
import type { Plugin } from "vite";

export const ZIP_NAME = "wordgrid-crazygames.zip";
export const MANIFEST_NAME = "dist.json";

/**
 * What the build output contains that the upload must not: paths are relative
 * to the build root, `dir/` matches a whole directory, a leading `.` matches
 * any dot-file or dot-directory anywhere.
 */
export const EXCLUDE = [
  // The submission pack itself: this page, the covers, the clip — and this zip.
  "art/",
  // GitHub Pages plumbing.
  ".",
  // Only ever referenced by absolute URL from the og:/twitter: meta tags; a
  // share preview for the standalone site, not part of the game.
  "og-image.png",
  // The offline-shell worker is for the standalone site. Inside a portal's
  // iframe there is nothing to install and the portal needs the network
  // anyway; and games.crazygames.com is one origin shared by every game, where
  // a worker's cache housekeeping is everyone's business. main.tsx only
  // registers it when the game is the top-level page, so leaving the file out
  // costs nothing.
  "sw.js",
];

export function isExcluded(relPath: string, exclude: readonly string[] = EXCLUDE): boolean {
  const parts = relPath.split("/");
  return exclude.some((rule) => {
    if (rule === ".") return parts.some((p) => p.startsWith("."));
    if (rule.endsWith("/")) return relPath.startsWith(rule);
    return relPath === rule;
  });
}

function walk(root: string, dir = root, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(root, full, out);
    else if (entry.isFile()) out.push(relative(root, full).split(sep).join(posix.sep));
  }
  return out;
}

// --- a minimal, deterministic ZIP writer (APPNOTE 6.3.x, no ZIP64) ----------

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

export function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// Every entry carries the same stamp so a rebuild of the same sources is the
// same bytes. MS-DOS format: 2026-01-01 00:00:00.
const DOS_DATE = ((2026 - 1980) << 9) | (1 << 5) | 1;
const DOS_TIME = 0;

interface Entry {
  path: string;
  data: Buffer;
}

export function buildZip(entries: readonly Entry[]): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;

  for (const { path, data } of [...entries].sort((a, b) => (a.path < b.path ? -1 : 1))) {
    const name = Buffer.from(path, "utf8");
    const crc = crc32(data);
    const deflated = deflateRawSync(data, { level: 9 });
    // Fonts and PNGs are already compressed; store those rather than grow them.
    const store = deflated.length >= data.length;
    const method = store ? 0 : 8;
    const body = store ? data : deflated;

    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed: 2.0 (deflate)
    local.writeUInt16LE(0x0800, 6); // flags: names are UTF-8
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28); // no extra field
    name.copy(local, 30);

    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(0x0314, 4); // made by: Unix host, spec 2.0
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt16LE(DOS_TIME, 12);
    central.writeUInt16LE(DOS_DATE, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(body.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30); // extra
    central.writeUInt16LE(0, 32); // comment
    central.writeUInt16LE(0, 34); // disk number start
    central.writeUInt16LE(0, 36); // internal attributes
    central.writeUInt32LE((0o100644 << 16) >>> 0, 38); // external: a plain -rw-r--r-- file
    central.writeUInt32LE(offset, 42);
    name.copy(central, 46);

    locals.push(local, body);
    centrals.push(central);
    offset += local.length + body.length;
  }

  const directory = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4); // this disk
  end.writeUInt16LE(0, 6); // disk with the directory
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20); // no comment

  return Buffer.concat([...locals, directory, end]);
}

// --- the distribution --------------------------------------------------------

export interface DistManifest {
  /** The zip's file name, next to this manifest. */
  file: string;
  /** Size of the zip. */
  bytes: number;
  /** Size of everything inside it, unpacked. */
  unpacked: number;
  /** package.json version of the game that was built. */
  version: string;
  /** SHA-256 of the zip — the build id to quote when a version is uploaded. */
  sha256: string;
  entries: { path: string; bytes: number }[];
}

export interface PackOptions {
  /** The build output (Vite's outDir), which is also where art/ lives. */
  outDir: string;
  /** Where the zip and manifest go; defaults to `<outDir>/art`. */
  into?: string;
  version?: string;
  exclude?: readonly string[];
}

/** Zip the built game and write the manifest beside it. Returns the manifest. */
export function packDistribution(opts: PackOptions): DistManifest {
  const outDir = resolve(opts.outDir);
  const into = opts.into ? resolve(opts.into) : join(outDir, "art");
  const exclude = opts.exclude ?? EXCLUDE;

  const paths = walk(outDir).filter((p) => !isExcluded(p, exclude)).sort();
  if (!paths.includes("index.html")) {
    throw new Error(`packDistribution: no index.html at the root of ${outDir}`);
  }
  const entries = paths.map((path) => ({ path, data: readFileSync(join(outDir, path)) }));
  const zip = buildZip(entries);

  mkdirSync(into, { recursive: true });
  writeFileSync(join(into, ZIP_NAME), zip);

  const manifest: DistManifest = {
    file: ZIP_NAME,
    bytes: zip.length,
    unpacked: entries.reduce((n, e) => n + e.data.length, 0),
    version: opts.version ?? readVersion(process.cwd()),
    sha256: createHash("sha256").update(zip).digest("hex"),
    entries: entries.map((e) => ({ path: e.path, bytes: e.data.length })),
  };
  writeFileSync(join(into, MANIFEST_NAME), JSON.stringify(manifest, null, 2) + "\n");
  return manifest;
}

function readVersion(root: string): string {
  try {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as { version?: string };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export function fmtBytes(n: number): string {
  return n < 1_000_000 ? `${(n / 1000).toFixed(1)} kB` : `${(n / 1_000_000).toFixed(2)} MB`;
}

/**
 * Vite plugin: after the bundle and the public/ copy have landed in outDir,
 * write `<outDir>/art/wordgrid-crazygames.zip` and its `dist.json`.
 */
export function crazyGamesZip(): Plugin {
  let outDir = "dist";
  let root = process.cwd();
  let info: (msg: string) => void = console.log;
  return {
    name: "wordgrid:crazygames-zip",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir;
      root = config.root;
      info = (msg) => config.logger.info(msg);
    },
    closeBundle() {
      const m = packDistribution({ outDir: resolve(root, outDir), version: readVersion(root) });
      info(
        `${relative(root, join(outDir, "art", m.file))}  ${m.entries.length} files · ${fmtBytes(
          m.bytes,
        )} zipped (${fmtBytes(m.unpacked)} unpacked) · sha256 ${m.sha256.slice(0, 12)}…`,
      );
    },
  };
}

// `node --experimental-strip-types scripts/dist-zip.mts [outDir]` re-packs an
// existing build without running Vite — handy while working on this file.
if (process.argv[1] && /dist-zip\.mts$/.test(process.argv[1])) {
  const m = packDistribution({ outDir: process.argv[2] ?? "docs" });
  console.log(`${m.file}: ${m.entries.length} files, ${fmtBytes(m.bytes)}, sha256 ${m.sha256}`);
  for (const e of m.entries) console.log(`  ${fmtBytes(e.bytes).padStart(9)}  ${e.path}`);
}
