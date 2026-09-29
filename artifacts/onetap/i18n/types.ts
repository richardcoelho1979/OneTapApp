import type ptBR from './locales/pt-BR.json';

// ─── Source of truth ──────────────────────────────────────────────────────────
// pt-BR.json is the master translation file.
// All other locale files must implement every key defined here.
// TypeScript enforces this through the LocaleData type in registry.ts.

export type TranslationSchema = typeof ptBR;

// ─── Dot-notation key extractor (2-level deep) ────────────────────────────────
// Generates the union of all valid key paths: 'common.ok' | 'auth.login' | …
// Only supports 2 levels deep (namespace.key). If deeper nesting is ever needed,
// extend this type accordingly.

type Namespace = keyof TranslationSchema;

type KeysInNamespace<NS extends Namespace> = {
  [K in keyof TranslationSchema[NS]]: TranslationSchema[NS][K] extends string
    ? `${string & NS}.${string & K}`
    : never;
}[keyof TranslationSchema[NS]];

export type TranslationKey = {
  [NS in Namespace]: KeysInNamespace<NS>;
}[Namespace];

// ─── Options for the t() function ────────────────────────────────────────────
// count  → triggers pluralization (key_one / key_other suffix logic)
// other  → interpolation variables, e.g. { name: 'João' } → replaces {name}

export interface TranslateOptions {
  count?: number;
  [variable: string]: string | number | undefined;
}

// ─── Locale metadata ──────────────────────────────────────────────────────────

export type LocaleCode = string; // Open string so registry can extend without touching this file

export interface LocaleMeta {
  /** IETF BCP-47 code: 'pt-BR', 'en', 'es' */
  code: LocaleCode;
  /** English display name: 'Portuguese (Brazil)' */
  name: string;
  /** Native display name: 'Português (Brasil)' */
  nativeName: string;
  /** Flag emoji: '🇧🇷' */
  flag: string;
  /** Right-to-left script? (Arabic, Hebrew, …) */
  rtl: boolean;
}
