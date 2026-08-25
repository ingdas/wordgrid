// Localization.
//
// One catalogue per locale, keyed by dotted ids; `en` is the source of truth
// and every other locale is checked against it (see scripts/i18n.test.mts).
// t() falls back to English, then to the key, so a partial translation is
// always safe to ship.
//
// SCOPE: everything. The interface, and — since the CrazyGames rollout — the
// puzzles themselves: each language has its own boards, slot for slot (see
// src/i18n/content/types.ts), its own chapter keys and decoy tiles, and its
// own idea of what a letter is (src/i18n/script.ts). English needs no overlay.
//
// Catalogues and content are loaded on demand, one chunk per language, so the
// game doesn't ship twenty-five copies of itself. `initLocale()` runs before
// the first render (src/main.tsx) and `setLocale()` before the tree re-keys,
// so t() can stay synchronous everywhere it is called.
import { readItem, writeItem } from "../storage.ts";
import { en } from "./en.ts";
import { LOCALE_INFO, isLocale, localeInfo, matchLocale, type Locale } from "./locales.ts";
import { setScriptLocale } from "./script.ts";
import { setActiveContent } from "./content/active.ts";
import type { LocaleContent } from "./content/types.ts";

export type { Locale } from "./locales.ts";
export type Catalogue = Record<string, string>;

/** Every language the game ships, for the picker. */
export const LOCALES: { id: Locale; label: string }[] = LOCALE_INFO.map(({ id, label }) => ({ id, label }));

// One dynamic import per language — a static list, so Vite can split a chunk
// per locale and bare node can resolve the same paths for the tests.
const CATALOGUES: Record<Locale, () => Promise<Catalogue>> = {
  en: async () => en,
  es: () => import("./es.ts").then((m) => m.es),
  id: () => import("./id.ts").then((m) => m.id),
  it: () => import("./it.ts").then((m) => m.it),
  nl: () => import("./nl.ts").then((m) => m.nl),
  fr: () => import("./fr.ts").then((m) => m.fr),
  pt: () => import("./pt.ts").then((m) => m.pt),
  ru: () => import("./ru.ts").then((m) => m.ru),
  pl: () => import("./pl.ts").then((m) => m.pl),
  ro: () => import("./ro.ts").then((m) => m.ro),
  de: () => import("./de.ts").then((m) => m.de),
  nb: () => import("./nb.ts").then((m) => m.nb),
  sv: () => import("./sv.ts").then((m) => m.sv),
  fi: () => import("./fi.ts").then((m) => m.fi),
  uk: () => import("./uk.ts").then((m) => m.uk),
  el: () => import("./el.ts").then((m) => m.el),
  da: () => import("./da.ts").then((m) => m.da),
  cs: () => import("./cs.ts").then((m) => m.cs),
  hu: () => import("./hu.ts").then((m) => m.hu),
  tr: () => import("./tr.ts").then((m) => m.tr),
  ar: () => import("./ar.ts").then((m) => m.ar),
  vi: () => import("./vi.ts").then((m) => m.vi),
  th: () => import("./th.ts").then((m) => m.th),
  ko: () => import("./ko.ts").then((m) => m.ko),
  ja: () => import("./ja.ts").then((m) => m.ja),
};

const CONTENT: Record<Locale, () => Promise<LocaleContent | null>> = {
  en: async () => null,
  es: () => import("./content/es.ts").then((m) => m.content),
  id: () => import("./content/id.ts").then((m) => m.content),
  it: () => import("./content/it.ts").then((m) => m.content),
  nl: () => import("./content/nl.ts").then((m) => m.content),
  fr: () => import("./content/fr.ts").then((m) => m.content),
  pt: () => import("./content/pt.ts").then((m) => m.content),
  ru: () => import("./content/ru.ts").then((m) => m.content),
  pl: () => import("./content/pl.ts").then((m) => m.content),
  ro: () => import("./content/ro.ts").then((m) => m.content),
  de: () => import("./content/de.ts").then((m) => m.content),
  nb: () => import("./content/nb.ts").then((m) => m.content),
  sv: () => import("./content/sv.ts").then((m) => m.content),
  fi: () => import("./content/fi.ts").then((m) => m.content),
  uk: () => import("./content/uk.ts").then((m) => m.content),
  el: () => import("./content/el.ts").then((m) => m.content),
  da: () => import("./content/da.ts").then((m) => m.content),
  cs: () => import("./content/cs.ts").then((m) => m.content),
  hu: () => import("./content/hu.ts").then((m) => m.content),
  tr: () => import("./content/tr.ts").then((m) => m.content),
  ar: () => import("./content/ar.ts").then((m) => m.content),
  vi: () => import("./content/vi.ts").then((m) => m.content),
  th: () => import("./content/th.ts").then((m) => m.content),
  ko: () => import("./content/ko.ts").then((m) => m.content),
  ja: () => import("./content/ja.ts").then((m) => m.content),
};

/** The catalogue for a locale (tests and tooling; the game uses loadLocale). */
export function loadCatalogue(id: Locale): Promise<Catalogue> {
  return CATALOGUES[id]();
}

/** The puzzle content for a locale, or null for English. */
export function loadContent(id: Locale): Promise<LocaleContent | null> {
  return CONTENT[id]();
}

const KEY = "wordgrid:locale";

/** `?lang=xx` on the URL: for QA and for embeds that pass a language along. Session-only, never stored. */
function urlLocale(): Locale | null {
  try {
    return matchLocale(new URLSearchParams(window.location.search).get("lang"));
  } catch {
    return null;
  }
}

function storedLocale(): Locale | null {
  try {
    const stored = readItem(KEY);
    return isLocale(stored) ? stored : null;
  } catch {
    return null;
  }
}

function detect(): Locale {
  const fromUrl = urlLocale();
  if (fromUrl) return fromUrl;
  const stored = storedLocale();
  if (stored) return stored;
  try {
    const tags = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const tag of tags) {
      const m = matchLocale(tag);
      if (m) return m;
    }
  } catch {
    /* no navigator (tests) */
  }
  return "en";
}

let locale: Locale = "en";
let table: Catalogue = en;

function applyDocument(id: Locale) {
  try {
    // Keep the document in step for screen readers, the browser's own
    // hyphenation/quotation/uppercasing rules (Turkish İ), and direction.
    document.documentElement.lang = localeInfo(id).tag;
    document.documentElement.dir = localeInfo(id).dir;
  } catch {
    /* no document (tests) */
  }
}

/**
 * Make `id` the language being played: its strings, its boards, its letters.
 * Falls back to English if the chunk can't be fetched, so a flaky network
 * never leaves the game without copy.
 */
export async function loadLocale(id: Locale): Promise<Locale> {
  if (!isLocale(id)) id = "en";
  let catalogue: Catalogue = en;
  let content: LocaleContent | null = null;
  if (id !== "en") {
    try {
      [catalogue, content] = await Promise.all([loadCatalogue(id), loadContent(id)]);
    } catch {
      id = "en";
    }
  }
  locale = id;
  table = catalogue;
  setScriptLocale(id);
  setActiveContent(content);
  applyDocument(id);
  return id;
}

/** Pick the starting language and load it. Call once, before the first render. */
export function initLocale(): Promise<Locale> {
  return loadLocale(detect());
}

export function getLocale(): Locale {
  return locale;
}

/** The player chose a language in Settings: load it and remember it. */
export async function setLocale(next: Locale): Promise<void> {
  if (!isLocale(next)) return;
  await loadLocale(next);
  writeItem(KEY, next);
}

/**
 * The platform told us the site's language (CrazyGames: `SDK.user.systemInfo
 * .locale`, "de-DE"). Adopted only when the player hasn't chosen one and the
 * URL didn't set one — their own pick always wins. Returns whether it changed.
 */
export async function adoptPlatformLocale(tag: string | null | undefined): Promise<boolean> {
  if (urlLocale() || storedLocale()) return false;
  const m = matchLocale(tag);
  if (!m || m === locale) return false;
  await loadLocale(m);
  return true;
}

/**
 * Look up a string. `{name}` placeholders are filled from `params`, so a
 * translation can move them around — never build a sentence by concatenation.
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const raw = table[key] ?? en[key] ?? key;
  if (!params) return raw;
  return raw.replace(/\{(\w+)\}/g, (whole, name: string) =>
    params[name] === undefined ? whole : String(params[name])
  );
}

const pluralRules = new Map<Locale, Intl.PluralRules>();

/**
 * `key.one` / `key.other` in English; a locale may add `key.few`, `key.many`,
 * `key.two` or `key.zero` where its grammar needs them (Russian, Polish,
 * Czech, Arabic…) and they're picked by the language's own plural rules. A
 * form a locale doesn't provide falls back to `.other`.
 */
export function plural(key: string, n: number, params?: Record<string, string | number>): string {
  let rules = pluralRules.get(locale);
  if (!rules) {
    try {
      rules = new Intl.PluralRules(localeInfo(locale).tag);
    } catch {
      rules = new Intl.PluralRules("en");
    }
    pluralRules.set(locale, rules);
  }
  const form = rules.select(n);
  const exact = `${key}.${form}`;
  return t(exact in table || exact in en ? exact : `${key}.other`, { n, ...params });
}
