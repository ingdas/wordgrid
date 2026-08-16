// Localization.
//
// One catalogue per locale, keyed by dotted ids; `en` is the source of truth
// and every other locale is checked against it (see scripts/i18n.test.mts).
// t() falls back to English, then to the key, so a partial translation is
// always safe to ship.
//
// SCOPE, stated plainly: this localizes the interface, not the puzzles. The
// word modes are English by construction — a board of English words with
// English category names can't be translated, only rewritten per language.
// What a translated UI does unlock today is the **Logic Grid**, which is pure
// deduction with no vocabulary at all, plus every menu, rule and result screen
// around the rest.
import { en } from "./en.ts";
import { es } from "./es.ts";

export type Locale = "en" | "es";
export type Catalogue = Record<string, string>;

export const LOCALES: { id: Locale; label: string; catalogue: Catalogue }[] = [
  { id: "en", label: "English", catalogue: en },
  { id: "es", label: "Español", catalogue: es },
];

const KEY = "wordgrid:locale";

function detect(): Locale {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored && LOCALES.some((l) => l.id === stored)) return stored as Locale;
    const tag = (navigator.language || "en").slice(0, 2).toLowerCase();
    if (LOCALES.some((l) => l.id === tag)) return tag as Locale;
  } catch {
    /* ignore */
  }
  return "en";
}

let locale: Locale = detect();
try {
  // Keep the document in step from the first paint, for screen readers and
  // for the browser's own hyphenation/quotation rules.
  document.documentElement.lang = locale;
} catch {
  /* ignore */
}

export function getLocale(): Locale {
  return locale;
}

export function setLocale(next: Locale) {
  if (!LOCALES.some((l) => l.id === next)) return;
  locale = next;
  try {
    localStorage.setItem(KEY, next);
    document.documentElement.lang = next;
  } catch {
    /* ignore */
  }
}

/**
 * Look up a string. `{name}` placeholders are filled from `params`, so a
 * translation can move them around — never build a sentence by concatenation.
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const table = LOCALES.find((l) => l.id === locale)?.catalogue ?? en;
  const raw = table[key] ?? en[key] ?? key;
  if (!params) return raw;
  return raw.replace(/\{(\w+)\}/g, (whole, name: string) =>
    params[name] === undefined ? whole : String(params[name])
  );
}

/** English has one plural rule and Spanish the same; enough for both. */
export function plural(key: string, n: number, params?: Record<string, string | number>): string {
  return t(`${key}.${n === 1 ? "one" : "other"}`, { n, ...params });
}
