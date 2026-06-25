// Minimal i18n scaffold. Today everything is English and most copy still lives
// inline in the components; this module is the migration target. To localize:
//   1. add a locale to STRINGS,
//   2. call setLocale() (e.g. from navigator.language) at startup,
//   3. replace inline literals with t("key") incrementally.
// t() falls back to English, then to the key itself, so partial coverage is safe.

export type Locale = "en";

const STRINGS: Record<Locale, Record<string, string>> = {
  en: {
    "btn.play": "Play",
    "btn.continue": "Continue",
    "btn.daily": "Daily Challenge",
    "btn.howToPlay": "How to play",
    "btn.submit": "Submit group",
    "btn.clear": "Clear",
    "btn.levels": "Levels",
    "btn.share": "Share",
    "btn.tryAgain": "Try again",
    "btn.next": "Next level →",
    "level.choose": "Choose a level",
    "level.subtitle": "Levels ramp up in difficulty. Fewer mistakes earn more stars.",
  },
};

let locale: Locale = "en";

export function setLocale(l: Locale) {
  if (STRINGS[l]) locale = l;
}

export function t(key: string): string {
  return STRINGS[locale][key] ?? STRINGS.en[key] ?? key;
}
