// The languages CrazyGames serves, and nothing else: this list is scraped from
// `packages/countries/src/locales.ts` in the CrazyGames monorepo (25 locales,
// `en_US` … `ja_JP`). Ids are the bare language part, which is what a browser's
// `navigator.language`, the SDK's `systemInfo.locale` ("en-US") and a `?lang=`
// query all reduce to. Pure data — no DOM, so node scripts can import it.

export const LOCALE_IDS = [
  "en", "es", "id", "it", "nl", "fr", "pt", "ru", "pl", "ro", "de", "nb", "sv",
  "fi", "uk", "el", "da", "cs", "hu", "tr", "ar", "vi", "th", "ko", "ja",
] as const;
export type Locale = (typeof LOCALE_IDS)[number];

export interface LocaleInfo {
  id: Locale;
  /** BCP 47 tag for Intl (dates, plural rules, case mapping). */
  tag: string;
  /** The platform's own code for this language (`packages/countries`). */
  cg: string;
  /** The language's own name, for the picker. */
  label: string;
  dir: "ltr" | "rtl";
}

export const LOCALE_INFO: LocaleInfo[] = [
  { id: "en", tag: "en-US", cg: "en_US", label: "English", dir: "ltr" },
  { id: "es", tag: "es-ES", cg: "es_ES", label: "Español", dir: "ltr" },
  { id: "id", tag: "id-ID", cg: "id_ID", label: "Bahasa Indonesia", dir: "ltr" },
  { id: "it", tag: "it-IT", cg: "it_IT", label: "Italiano", dir: "ltr" },
  { id: "nl", tag: "nl-NL", cg: "nl_NL", label: "Nederlands", dir: "ltr" },
  { id: "fr", tag: "fr-FR", cg: "fr_FR", label: "Français", dir: "ltr" },
  { id: "pt", tag: "pt-BR", cg: "pt_BR", label: "Português (Brasil)", dir: "ltr" },
  { id: "ru", tag: "ru-RU", cg: "ru_RU", label: "Русский", dir: "ltr" },
  { id: "pl", tag: "pl-PL", cg: "pl_PL", label: "Polski", dir: "ltr" },
  { id: "ro", tag: "ro-RO", cg: "ro_RO", label: "Română", dir: "ltr" },
  { id: "de", tag: "de-DE", cg: "de_DE", label: "Deutsch", dir: "ltr" },
  { id: "nb", tag: "nb-NO", cg: "nb_NO", label: "Norsk", dir: "ltr" },
  { id: "sv", tag: "sv-SE", cg: "sv_SE", label: "Svenska", dir: "ltr" },
  { id: "fi", tag: "fi-FI", cg: "fi_FI", label: "Suomi", dir: "ltr" },
  { id: "uk", tag: "uk-UA", cg: "uk_UA", label: "Українська", dir: "ltr" },
  { id: "el", tag: "el-GR", cg: "el_GR", label: "Ελληνικά", dir: "ltr" },
  { id: "da", tag: "da-DK", cg: "da_DK", label: "Dansk", dir: "ltr" },
  { id: "cs", tag: "cs-CZ", cg: "cs_CZ", label: "Čeština", dir: "ltr" },
  { id: "hu", tag: "hu-HU", cg: "hu_HU", label: "Magyar", dir: "ltr" },
  { id: "tr", tag: "tr-TR", cg: "tr_TR", label: "Türkçe", dir: "ltr" },
  { id: "ar", tag: "ar-SA", cg: "ar_SA", label: "العربية", dir: "rtl" },
  { id: "vi", tag: "vi-VN", cg: "vi_VN", label: "Tiếng Việt", dir: "ltr" },
  { id: "th", tag: "th-TH", cg: "th_TH", label: "ไทย", dir: "ltr" },
  { id: "ko", tag: "ko-KR", cg: "ko_KR", label: "한국어", dir: "ltr" },
  { id: "ja", tag: "ja-JP", cg: "ja_JP", label: "日本語", dir: "ltr" },
];

export function isLocale(x: unknown): x is Locale {
  return typeof x === "string" && (LOCALE_IDS as readonly string[]).includes(x);
}

/**
 * The languages the game actually offers: those whose boards exist and pass
 * `npm run validate`. The rest of LOCALE_IDS have the rails (a stub catalogue
 * and content file, a chunk in the build) but would play English boards under
 * a foreign menu, so the picker, the browser/platform detection and the tests
 * leave them out until their content lands. Add a language here when its
 * `content/<xx>.ts` validates clean — never before, because a language that
 * falls through to the English boards is the exact failure this list exists
 * to prevent.
 */
export const SHIPPED_LOCALES: readonly Locale[] = ["en", "es", "id", "de", "fr", "it", "nl", "pt"];

export function isShipped(x: unknown): x is Locale {
  return isLocale(x) && SHIPPED_LOCALES.includes(x);
}

export function localeInfo(id: Locale): LocaleInfo {
  return LOCALE_INFO.find((l) => l.id === id) ?? LOCALE_INFO[0];
}

/**
 * Reduce any language tag the outside world hands us ("pt-BR", "en_US", "no",
 * "in", "zh-Hant") to a locale we SHIP, or null. Old ISO codes and the other
 * Norwegian tags are folded in; anything unknown — or known but not shipped
 * yet — is left to the caller's fallback rather than guessed.
 */
export function matchLocale(tag: string | null | undefined, shippedOnly = true): Locale | null {
  if (!tag) return null;
  const lang = tag.trim().toLowerCase().split(/[-_]/)[0];
  const alias: Record<string, Locale> = { no: "nb", nn: "nb", in: "id" };
  const id = alias[lang] ?? lang;
  if (!isLocale(id)) return null;
  return shippedOnly && !isShipped(id) ? null : id;
}
