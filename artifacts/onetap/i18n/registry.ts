/**
 * Locale Registry
 *
 * ════════════════════════════════════════════════════════════════
 *  HOW TO ADD A NEW LANGUAGE — only 2 lines needed:
 *
 *    import es from './locales/es.json';
 *    registerLocale(
 *      { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', rtl: false },
 *      es,
 *    );
 *
 *  That's it. No screen, component, hook, or context file needs
 *  to be touched. The new language will appear automatically in
 *  the Settings language selector.
 * ════════════════════════════════════════════════════════════════
 */

import type { LocaleMeta, TranslationSchema } from './types';

// Locale data must satisfy the full TranslationSchema (derived from pt-BR).
// TypeScript will error at compile-time if a locale file is missing any key.
type LocaleData = TranslationSchema;

// ─── Internal store ───────────────────────────────────────────────────────────

const _translations: Record<string, LocaleData> = {};
const _metadata: Record<string, LocaleMeta> = {};
let _order: string[] = []; // insertion order = display order in Settings

function registerLocale(meta: LocaleMeta, data: LocaleData): void {
  _translations[meta.code] = data;
  _metadata[meta.code] = meta;
  if (!_order.includes(meta.code)) _order.push(meta.code);
}

// ─── Registered locales ───────────────────────────────────────────────────────

import ptBR from './locales/pt-BR.json';
import en from './locales/en.json';
import es from './locales/es.json';

registerLocale(
  { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)', flag: '🇧🇷', rtl: false },
  ptBR,
);

registerLocale(
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', rtl: false },
  en,
);

registerLocale(
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', rtl: false },
  es,
);

// ─── Public API ───────────────────────────────────────────────────────────────

export function getTranslations(code: string): LocaleData {
  return _translations[code] ?? _translations['en']!;
}

export function getSupportedLocales(): LocaleMeta[] {
  return _order.map((code) => _metadata[code]!);
}

export function isSupported(code: string): boolean {
  return code in _translations;
}

/** Best-effort match: tries exact code, then language prefix, then 'en'. */
export function resolveLocale(deviceCode: string): string {
  if (isSupported(deviceCode)) return deviceCode;
  // Try language prefix: 'pt-BR' → 'pt', match 'pt-PT' etc.
  const prefix = deviceCode.split('-')[0]!;
  const match = _order.find((c) => c === prefix || c.startsWith(`${prefix}-`));
  return match ?? 'en';
}
