"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Locale, DEFAULT_LOCALE, Dictionary } from "./types";
import { tr } from "./dictionaries/tr";
import { en } from "./dictionaries/en";

const dictionaries: Record<Locale, Dictionary> = {
  tr,
  en,
};

interface I18nContextType {
  locale: Locale;
  setLocale: (newLocale: Locale) => void;
  dict: Dictionary;
  t: (path: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

function getNestedValue(obj: any, path: string): string | undefined {
  const parts = path.split(".");
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null || typeof current !== "object") {
      return undefined;
    }
    current = current[part];
  }
  return typeof current === "string" ? current : undefined;
}

export function I18nProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const router = useRouter();

  // Sync client cookie on mount if available
  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
    if (match && (match[1] === "tr" || match[1] === "en") && match[1] !== locale) {
      setLocaleState(match[1] as Locale);
    }
  }, [locale]);

  const setLocale = useCallback(
    (newLocale: Locale) => {
      setLocaleState(newLocale);
      // Persist to cookie (1 year)
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("cinelists_locale", newLocale);
        } catch {
          // Ignore localStorage errors
        }
      }
      document.documentElement.lang = newLocale;
      router.refresh();
    },
    [router]
  );

  const dict = dictionaries[locale] || dictionaries[DEFAULT_LOCALE];

  const t = useCallback(
    (path: string, fallback?: string): string => {
      const val = getNestedValue(dict, path);
      if (val !== undefined) return val;
      // Fallback to default dictionary (tr) if missing in current
      const fallbackVal = getNestedValue(dictionaries[DEFAULT_LOCALE], path);
      if (fallbackVal !== undefined) return fallbackVal;
      return fallback || path;
    },
    [dict]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, dict, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    // Fallback if used outside provider
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      dict: dictionaries[DEFAULT_LOCALE],
      t: (path: string, fallback?: string) => {
        const val = getNestedValue(dictionaries[DEFAULT_LOCALE], path);
        return val !== undefined ? val : fallback || path;
      },
    };
  }
  return context;
}
