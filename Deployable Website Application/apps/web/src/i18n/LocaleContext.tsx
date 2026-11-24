import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Locale } from '@scamhisn/shared';
import { TRANSLATIONS, type Translations } from './translations';

interface LocaleContextValue {
  locale: Locale;
  isRtl: boolean;
  t: Translations;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

const STORAGE_KEY = 'scamhisn-locale';

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'ar' || saved === 'en') return saved;
    } catch {
      // ignore
    }
    return 'en';
  });

  useEffect(() => {
    const isRtl = locale === 'ar';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = isRtl ? 'ar-AE' : 'en';
    document.title = isRtl ? 'حصن الاحتيال | ScamHisn AI' : 'ScamHisn AI | حصن الاحتيال';
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // ignore
    }
  }, [locale]);

  const setLocale = (next: Locale) => setLocaleState(next);
  const toggleLocale = () => setLocaleState((prev) => (prev === 'en' ? 'ar' : 'en'));

  return (
    <LocaleContext.Provider
      value={{
        locale,
        isRtl: locale === 'ar',
        t: TRANSLATIONS[locale],
        setLocale,
        toggleLocale,
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used inside LocaleProvider');
  return ctx;
}
