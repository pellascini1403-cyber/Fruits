import { getLanguage, LanguageCode, setLanguage } from "./storage.js";

/**
 * Fruvo's own translation dictionary. Note on scope: almost every piece of
 * text in this app (SETTINGS, SOUND, MUSIC, RESET, LANGUAGE, REMOVE ADS, its
 * bullets, the price button, NEXT) is drawn INSIDE the provided panel/HUD
 * PNGs, not as HTML text — and per the "use the original assets, don't
 * redraw them" instruction, this code never overlays replacement text on
 * top of that art. Retranslating those specific words would need localized
 * versions of those PNGs from the same design. What this dictionary and
 * `t()` actually drive today is the one piece of UI with no source PNG:
 * Fruvo's own language picker. It's wired so any future text that isn't
 * baked into an asset (new HUD copy, new panels, etc.) just adds a key here
 * and calls `t()` — the persisted-language plumbing already works end to end.
 */
const DICTIONARY: Record<LanguageCode, Record<string, string>> = {
  es: { "language.title": "Idioma", "language.close": "Cerrar" },
  en: { "language.title": "Language", "language.close": "Close" },
  fr: { "language.title": "Langue", "language.close": "Fermer" },
  pt: { "language.title": "Idioma", "language.close": "Fechar" },
  zh: { "language.title": "语言", "language.close": "关闭" },
  ja: { "language.title": "言語", "language.close": "閉じる" },
  ko: { "language.title": "언어", "language.close": "닫기" },
  ru: { "language.title": "Язык", "language.close": "Закрыть" },
};

type Listener = (language: LanguageCode) => void;
const listeners = new Set<Listener>();
let current: LanguageCode = getLanguage();

document.documentElement.lang = current;

export function t(key: string): string {
  return DICTIONARY[current][key] ?? DICTIONARY.en[key] ?? key;
}

export function getCurrentLanguage(): LanguageCode {
  return current;
}

export function setCurrentLanguage(language: LanguageCode): void {
  if (language === current) {
    return;
  }
  current = language;
  setLanguage(language);
  document.documentElement.lang = language;
  for (const listener of listeners) {
    listener(language);
  }
}

/** Called whenever the language changes, so any on-screen text can re-render. */
export function onLanguageChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
