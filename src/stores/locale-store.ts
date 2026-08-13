import { create } from "zustand";
import { translations, type Locale, type TranslationKey } from "@/i18n/translations";

const STORAGE_KEY = "council-locale";

interface LocaleState {
  locale: Locale;
  isHydrated: boolean;
  hydrate: () => void;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

function readStored(): Locale {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "id" || v === "en") return v;
  } catch {
    /* ignore */
  }
  return "en";
}

export const useLocaleStore = create<LocaleState>((set, get) => ({
  locale: "en",
  isHydrated: false,
  hydrate: () => {
    const locale = readStored();
    set({ locale, isHydrated: true });
    try {
      document.documentElement.lang = locale === "id" ? "id" : "en";
    } catch {
      /* ignore */
    }
  },
  setLocale: (locale) => {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* ignore */
    }
    set({ locale });
    try {
      document.documentElement.lang = locale === "id" ? "id" : "en";
    } catch {
      /* ignore */
    }
  },
  t: (key) => {
    try {
      const { locale } = get();
      const table = translations[locale] || translations.en;
      return (table as Record<string, string>)[key] || translations.en[key] || String(key);
    } catch {
      return String(key);
    }
  },
}));
