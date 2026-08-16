// The catalogues have to stay in step. English is the source of truth; any
// other locale that drops a key, invents one, or loses a {placeholder} fails
// here rather than showing an English string (or a raw key) to a player.
import assert from "node:assert/strict";
import { LOCALES } from "../src/i18n/index.ts";
import { en } from "../src/i18n/en.ts";

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const placeholders = (s: string) => (s.match(/\{(\w+)\}/g) ?? []).sort();

test("English is non-empty and every key has a value", () => {
  assert.ok(Object.keys(en).length > 200, "the catalogue looks too small");
  for (const [k, v] of Object.entries(en)) assert.ok(v.trim().length, `${k} is empty`);
});

for (const { id, catalogue } of LOCALES.filter((l) => l.id !== "en")) {
  test(`${id}: covers every English key, with no strays`, () => {
    const missing = Object.keys(en).filter((k) => !(k in catalogue));
    const extra = Object.keys(catalogue).filter((k) => !(k in en));
    assert.deepEqual(missing, [], `${id} is missing keys`);
    assert.deepEqual(extra, [], `${id} has keys English doesn't`);
  });

  test(`${id}: keeps every placeholder the English string uses`, () => {
    for (const [k, v] of Object.entries(en)) {
      assert.deepEqual(
        placeholders(catalogue[k]),
        placeholders(v),
        `${id} "${k}" changed its placeholders`
      );
    }
  });

  test(`${id}: is actually translated, not a copy of English`, () => {
    // Proper nouns, symbols and pure-number strings legitimately match.
    const shared = Object.keys(en).filter((k) => catalogue[k] === en[k] && /\p{L}{4}/u.test(en[k]));
    assert.ok(shared.length < 12, `${id} still shares ${shared.length} English strings: ${shared.slice(0, 12)}`);
  });
}

test("no key is left pointing at itself (t() would show the key)", () => {
  for (const k of Object.keys(en)) assert.notEqual(en[k], k, `${k} has no translation`);
});

console.log(`\n${passed} i18n tests passed ✓\n`);
