// The catalogues have to stay in step. English is the source of truth; any
// other locale that drops a key, invents one, or loses a {placeholder} fails
// here rather than showing an English string (or a raw key) to a player.
//
//   node --experimental-strip-types scripts/i18n.test.mts            every shipped locale
//   node --experimental-strip-types scripts/i18n.test.mts --locale nl one locale, shipped or not
import assert from "node:assert/strict";
import { LOCALE_IDS, SHIPPED_LOCALES, matchLocale, type Locale } from "../src/i18n/locales.ts";
import { loadCatalogue, loadLocale, plural, t } from "../src/i18n/index.ts";
import { rulesFor, graphemes } from "../src/i18n/script.ts";
import { en } from "../src/i18n/en.ts";

const args = process.argv.slice(2);
const only = args.includes("--locale") ? args[args.indexOf("--locale") + 1] : null;

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const placeholders = (s: string) => (s.match(/\{(\w+)\}/g) ?? []).sort();
// A locale may add plural forms English doesn't have (`.few`, `.many`, …)
// next to any English `.other`.
const PLURAL_EXTRA = /\.(zero|one|two|few|many)$/;
const isPluralExtra = (k: string) => !(k in en) && PLURAL_EXTRA.test(k) && `${k.replace(PLURAL_EXTRA, "")}.other` in en;

test("English is non-empty and every key has a value", () => {
  assert.ok(Object.keys(en).length > 200, "the catalogue looks too small");
  for (const [k, v] of Object.entries(en)) assert.ok(v.trim().length, `${k} is empty`);
});

test("no key is left pointing at itself (t() would show the key)", () => {
  for (const k of Object.keys(en)) assert.notEqual(en[k], k, `${k} has no translation`);
});

test("language tags from the platform and the browser resolve to shipped locales", () => {
  assert.equal(matchLocale("en-US"), "en");
  assert.equal(matchLocale("pt_BR"), "pt");
  assert.equal(matchLocale("nb-NO", false), "nb");
  assert.equal(matchLocale("no", false), "nb");
  assert.equal(matchLocale("in", false), "id");
  assert.equal(matchLocale("zh-Hant"), null);
  assert.equal(matchLocale(""), null);
  // A known language whose boards aren't in yet is not offered.
  assert.equal(matchLocale("nl"), SHIPPED_LOCALES.includes("nl") ? "nl" : null);
});

test("script rules: letters, ciphers and folding per writing system", () => {
  const en_ = rulesFor("en");
  assert.equal(en_.cipher("CRASH"), "CRSH");
  assert.equal(en_.cipher("YELLOW"), "YLLW");
  assert.equal(en_.normalize("café!"), "CAFE");
  assert.equal(rulesFor("fr").cipher("ÉTÉ"), "T");
  assert.equal(rulesFor("fi").cipher("KYLÄ"), "KL", "Y is a vowel in Finnish");
  assert.equal(rulesFor("tr").cipher("IŞIK"), "ŞK");
  assert.equal(rulesFor("tr").upper("iğne"), "İĞNE");
  assert.equal(rulesFor("ru").cipher("ЙОГУРТ"), "ЙГРТ", "Й is a consonant");
  assert.equal(rulesFor("ru").cipher("ЁЛКА"), "ЛК");
  assert.equal(rulesFor("el").cipher("ΆΝΘΟΣ"), "ΝΘΣ");
  assert.equal(rulesFor("ko").cipher("사과"), "ㅅㄱ");
  assert.equal(rulesFor("ja").cipher("さくら"), "さ〇ら");
  assert.equal(rulesFor("ja").normalize("サクラ"), "さくら");
  assert.equal(rulesFor("th").cipher("เสือ"), "สอ");
  assert.equal(rulesFor("ar").cipher("كتاب"), "كتب");
  assert.equal(rulesFor("ar").normalize("مَدْرَسَة"), "مدرسه");
  assert.deepEqual(graphemes("เสือ"), ["เ", "สื", "อ"]);
  assert.deepEqual(graphemes("한글"), ["한", "글"]);
});

test("plural() follows the language's own rules and falls back to .other", async () => {
  await loadLocale("en");
  assert.equal(plural("common.moves", 1), "1 move");
  assert.equal(plural("common.moves", 5), "5 moves");
  assert.equal(t("missing.key"), "missing.key");
});

const locales = (only ? [only] : [...SHIPPED_LOCALES]).filter((l): l is Locale => (LOCALE_IDS as readonly string[]).includes(l) && l !== "en");
if (only && !locales.length && only !== "en") throw new Error(`unknown locale "${only}"`);

for (const id of locales) {
  const catalogue = await loadCatalogue(id);
  test(`${id}: covers every English key, with no strays`, () => {
    const missing = Object.keys(en).filter((k) => !(k in catalogue));
    const extra = Object.keys(catalogue).filter((k) => !(k in en) && !isPluralExtra(k));
    assert.deepEqual(missing, [], `${id} is missing ${missing.length} keys`);
    assert.deepEqual(extra, [], `${id} has keys English doesn't`);
  });

  test(`${id}: keeps every placeholder the English string uses`, () => {
    for (const [k, v] of Object.entries(en)) {
      assert.deepEqual(placeholders(catalogue[k]), placeholders(v), `${id} "${k}" changed its placeholders`);
    }
    for (const k of Object.keys(catalogue).filter(isPluralExtra)) {
      const base = `${k.replace(PLURAL_EXTRA, "")}.other`;
      assert.deepEqual(placeholders(catalogue[k]), placeholders(en[base]), `${id} "${k}" changed its placeholders`);
    }
  });

  test(`${id}: is actually translated, not a copy of English`, () => {
    // What this guards against is a catalogue that was copied from en.ts and
    // renamed — which shares nearly every string. Some overlap is honest:
    // proper nouns ("WordGrid"), pure-format strings ("{value} / {target}"),
    // and loanwords a language really does spell the English way (German
    // "Level {n}", "Boss", "Bronze", "Gold"). German legitimately shares a
    // dozen, so the test is a proportion rather than a count — a copy would
    // be at 100%, and no honest translation comes near a sixth.
    const shared = Object.keys(en).filter((k) => catalogue[k] === en[k] && /\p{L}{4}/u.test(en[k]));
    const ratio = shared.length / Object.keys(en).length;
    assert.ok(
      ratio < 0.15,
      `${id} shares ${shared.length}/${Object.keys(en).length} English strings: ${shared.slice(0, 12)}`
    );
  });

  test(`${id}: every string has a value`, () => {
    for (const [k, v] of Object.entries(catalogue)) assert.ok(typeof v === "string" && v.trim().length, `${k} is empty`);
  });
}

console.log(`\n${passed} i18n tests passed ✓\n`);
