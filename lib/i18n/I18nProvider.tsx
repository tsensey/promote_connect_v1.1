'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
import type { Locale } from './translations';
import { defaultLocale, getTranslation } from './translations';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const i18nContext = createContext<I18nContextValue | undefined>(undefined);

const STORAGE_KEY = 'promote-connect-locale';
const COOKIE_NAME = 'NEXT_LOCALE';

export function I18nProvider({ children, initialLocale }: { children: React.ReactNode; initialLocale?: Locale }) {
  const { user } = useAuth();
  const [locale, setLocaleState] = useState<Locale>(initialLocale || defaultLocale);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'fr' || stored === 'en') {
      setLocaleState(stored);
      document.cookie = `${COOKIE_NAME}=${stored};path=/;max-age=31536000;SameSite=Lax`;
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    let mounted = true;

    supabaseClient
      .from('user_preferences')
      .select('language')
      .eq('profile_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!mounted) return;
        if (data?.language === 'fr' || data?.language === 'en') {
          setLocaleState(data.language);
          localStorage.setItem(STORAGE_KEY, data.language);
          document.cookie = `${COOKIE_NAME}=${data.language};path=/;max-age=31536000;SameSite=Lax`;
        }
      });

    return () => {
      mounted = false;
    };
  }, [user]);

  const setLocale = useCallback(async (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
    document.cookie = `${COOKIE_NAME}=${newLocale};path=/;max-age=31536000;SameSite=Lax`;

    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session?.session?.user?.id;
    if (!userId) return;

    const { data: existing } = await supabaseClient
      .from('user_preferences')
      .select('id')
      .eq('profile_id', userId)
      .maybeSingle();

    if (existing) {
      await supabaseClient
        .from('user_preferences')
        .update({ language: newLocale })
        .eq('profile_id', userId);
    } else {
      await supabaseClient
        .from('user_preferences')
        .insert({ profile_id: userId, language: newLocale });
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => getTranslation(locale, key, params),
    [locale]
  );

  return (
    <i18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </i18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(i18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }
  return context;
}
