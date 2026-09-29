import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translate } from '../i18n/index';
import { getSupportedLocales, resolveLocale } from '../i18n/registry';
import type { TranslationKey, TranslateOptions, LocaleMeta } from '../i18n/types';

// ─── Storage key ──────────────────────────────────────────────────────────────
const STORAGE_KEY = 'onetap_language';

// ─── Context shape ────────────────────────────────────────────────────────────
interface I18nContextValue {
  /** Active locale code, e.g. 'pt-BR' | 'en' | 'es' */
  locale: string;
  /** List of all registered locales — use in Settings to build the selector */
  supportedLocales: LocaleMeta[];
  /** True while the initial locale is being loaded from storage */
  isLoadingLocale: boolean;
  /** Change the active language and persist the choice */
  setLocale: (code: string) => Promise<void>;
  /**
   * Translate a key.
   *
   * @example
   * t('auth.login')                          // "Entrar"
   * t('room.players', { count: 3 })          // "3 jogadores"
   * t('season.number', { number: 1 })        // "Temporada 1"
   */
  t: (key: TranslationKey, opts?: TranslateOptions) => string;
}

// ─── Context + default (never rendered, but satisfies the type) ───────────────
const I18nContext = createContext<I18nContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<string>('en');
  const [isLoadingLocale, setIsLoadingLocale] = useState(true);

  // On mount: load persisted choice, fall back to device language
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          setLocaleState(saved);
        } else {
          // Detect device language — try full tag first (e.g. 'pt-BR'), then prefix ('pt')
          const locales = Localization.getLocales();
          const tag = locales[0]?.languageTag ?? 'en';
          setLocaleState(resolveLocale(tag));
        }
      } catch {
        // AsyncStorage unavailable — use device language
        const locales = Localization.getLocales();
        const tag = locales[0]?.languageTag ?? 'en';
        setLocaleState(resolveLocale(tag));
      } finally {
        setIsLoadingLocale(false);
      }
    })();
  }, []);

  const setLocale = useCallback(async (code: string) => {
    setLocaleState(code);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, code);
    } catch {
      // Non-fatal — the in-memory state is already updated
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey, opts?: TranslateOptions): string =>
      translate(locale, key, opts),
    [locale],
  );

  return (
    <I18nContext.Provider
      value={{
        locale,
        supportedLocales: getSupportedLocales(),
        isLoadingLocale,
        setLocale,
        t,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}
