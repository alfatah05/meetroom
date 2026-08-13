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
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale === "id" ? "id" : "en";
    }
  },
  setLocale: (locale) => {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* ignore */
    }
    set({ locale });
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale === "id" ? "id" : "en";
    }
  },
  t: (key) => {
    const { locale } = get();
    return translations[locale][key] ?? translations.en[key] ?? key;
  },
}));
