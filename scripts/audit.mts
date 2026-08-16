// Ambiguity audit helper. It can't judge meaning, but it surfaces the spokes
// most likely to be ambiguous so they can be human-reviewed:
//   1. words that show up as spokes in several different puzzles (generic), and
//   2. very short words (<= 3 letters), which tend to carry many senses.
// Run with:  npm run audit
import { PUZZLES } from "../src/puzzles.ts";
import { DAILY_PUZZLES } from "../src/dailyPuzzles.ts";

const owners = new Map<string, string[]>();
for (const p of [...PUZZLES, ...DAILY_PUZZLES]) {
  for (const c of p.categories) {
    for (const w of c.words) {
      const list = owners.get(w) ?? [];
      list.push(p.id);
      owners.set(w, list);
    }
  }
}

const shared = [...owners.entries()].filter(([, ids]) => ids.length >= 3).sort((a, b) => b[1].length - a[1].length);
console.log(`Spokes reused across 3+ puzzles (${shared.length}):`);
for (const [w, ids] of shared) console.log(`  ${w.padEnd(12)} ${ids.length}×  (${ids.join(", ")})`);

// Two groups on different boards that share 2 of their 3 words are effectively
// the same puzzle beat twice — fine occasionally (a SEASONS group has to list
// the other three seasons whatever the pivot is), dull when it's a habit.
const groups: { id: string; name: string; set: Set<string> }[] = [];
for (const p of [...PUZZLES, ...DAILY_PUZZLES]) {
  for (const c of p.categories) groups.push({ id: p.id, name: c.name, set: new Set(c.words) });
}
const twins: string[] = [];
for (let i = 0; i < groups.length; i++) {
  for (let j = i + 1; j < groups.length; j++) {
    const [A, B] = [groups[i], groups[j]];
    if (A.id === B.id) continue;
    const shared = [...A.set].filter((w) => B.set.has(w));
    if (shared.length >= 2) twins.push(`  ${A.id}:"${A.name}" ~ ${B.id}:"${B.name}"  (shares ${shared.join(", ")})`);
  }
}
console.log(`\nNear-duplicate categories across boards (${twins.length}):`);
console.log(twins.join("\n") || "  none");

// Stem clashes: two tiles on one board sharing a long prefix (CRACK next to
// CRACKER, POINT next to POINTER). Not ambiguity exactly — the reader's eye
// pairs them anyway, and one of them is usually in the wrong group.
const stems: string[] = [];
for (const p of [...PUZZLES, ...DAILY_PUZZLES]) {
  const tiles = p.categories.flatMap((c) => c.words.map((w) => ({ w, group: c.name })));
  for (let i = 0; i < tiles.length; i++) {
    for (let j = i + 1; j < tiles.length; j++) {
      const [a, b] = [tiles[i], tiles[j]];
      if (a.group === b.group) continue;
      const n = Math.min(a.w.length, b.w.length);
      let shared = 0;
      while (shared < n && a.w[shared] === b.w[shared]) shared++;
      if (shared >= 5) stems.push(`  ${p.id.padEnd(10)} ${a.w} / ${b.w}  ("${a.group}" vs "${b.group}")`);
    }
  }
}
console.log(`\nTiles on one board sharing a stem (${stems.length}):`);
console.log(stems.join("\n") || "  none");

const shortWords = [...owners.keys()].filter((w) => w.length <= 3).sort();
console.log(`\nShort spokes (<=3 letters) to double-check (${shortWords.length}):`);
console.log("  " + shortWords.join(", "));

console.log("\nReminder: within-puzzle semantic ambiguity still needs a human read.");
