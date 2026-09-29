/**
 * OneTap i18n Engine
 *
 * Features
 * ────────
 * • Dot-notation key access:  t('auth.login')
 * • Interpolation:            t('season.number', { number: 1 })  →  "Temporada 1"
 * • Pluralization:            t('room.players', { count: 3 })     →  "3 jogadores"
 *   Keys follow the _one / _other suffix convention:
 *     "players_one":   "{count} jogador"
 *     "players_other": "{count} jogadores"
 * • Fallback chain:   current locale → 'en' → raw key string
 *
 * Adding a new language
 * ─────────────────────
 * 1. Create  i18n/locales/<code>.json   (copy en.json and translate every value)
 * 2. Add 2 lines in i18n/registry.ts:
 *      import es from './locales/es.json';
 *      registerLocale({ code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', rtl: false }, es);
 * 3. Done. No screen, component or context file needs to change.
 */

import { getTranslations } from './registry';
import type { TranslationKey, TranslateOptions } from './types';

// ─── Internal helpers ─────────────────────────────────────────────────────────

type TranslationRecord = Record<string, Record<string, string>>;

/** Resolves a dot-notation path ('auth.login') into the leaf string value. */
function resolve(obj: TranslationRecord, path: string): string | undefined {
  const dot = path.indexOf('.');
  if (dot === -1) return undefined; // must be namespace.key
  const ns = path.slice(0, dot);
  const key = path.slice(dot + 1);
  return typeof obj[ns]?.[key] === 'string' ? obj[ns][key] : undefined;
}

/** Replaces {variable} placeholders with values from opts. */
function interpolate(template: string, opts: TranslateOptions): string {
  return template.replace(/\{(\w+)\}/g, (_, varName: string) => {
    const val = opts[varName];
    return val !== undefined ? String(val) : `{${varName}}`;
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Core translate function. Used internally by the I18nContext hook.
 * Call `const { t } = useI18n()` in components — do not call this directly.
 */
export function translate(
  locale: string,
  key: TranslationKey,
  opts?: TranslateOptions,
): string {
  const primary = getTranslations(locale) as unknown as TranslationRecord;
  const fallback = getTranslations('en') as unknown as TranslationRecord;

  // ── Pluralization: choose key_one or key_other based on count ──────────────
  let resolvedKey: string = key;
  if (opts?.count !== undefined) {
    const pluralSuffix = opts.count === 1 ? '_one' : '_other';
    const pluralKey = `${key}${pluralSuffix}` as TranslationKey;
    const hasPluralPrimary = resolve(primary, pluralKey) !== undefined;
    const hasPluralFallback = resolve(fallback, pluralKey) !== undefined;
    if (hasPluralPrimary || hasPluralFallback) {
      resolvedKey = pluralKey;
    }
  }

  // ── Resolve with fallback chain ───────────────────────────────────────────
  const raw =
    resolve(primary, resolvedKey) ??
    resolve(fallback, resolvedKey) ??
    key; // last resort: return the key path itself (never silently empty)

  // ── Interpolate variables ─────────────────────────────────────────────────
  return opts ? interpolate(raw, opts) : raw;
}
