// Ambiguity audit helper. It can't judge meaning, but it surfaces the spokes
// most likely to be ambiguous so they can be human-reviewed:
//   1. words that show up as spokes in several different puzzles (generic), and
//   2. very short words (<= 3 letters), which tend to carry many senses.
// Run with:  npm run audit
import { PUZZLES } from "../src/puzzles.ts";

const owners = new Map<string, string[]>();
for (const p of PUZZLES) {
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

const shortWords = [...owners.keys()].filter((w) => w.length <= 3).sort();
console.log(`\nShort spokes (<=3 letters) to double-check (${shortWords.length}):`);
console.log("  " + shortWords.join(", "));

console.log("\nReminder: within-puzzle semantic ambiguity still needs a human read.");
