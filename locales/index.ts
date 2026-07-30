import 'server-only';

import type { Locale } from '@/lib/i18n';

import bgCommon from './bg/common.json';
import bgEnums from './bg/enums.json';
import bgHome from './bg/home.json';
import bgListings from './bg/listings.json';
import bgMessages from './bg/messages.json';
import bgMetadata from './bg/metadata.json';
import bgProfiles from './bg/profiles.json';
import bgSaved from './bg/saved.json';
import enCommon from './en/common.json';
import enEnums from './en/enums.json';
import enHome from './en/home.json';
import enListings from './en/listings.json';
import enMessages from './en/messages.json';
import enMetadata from './en/metadata.json';
import enProfiles from './en/profiles.json';
import enSaved from './en/saved.json';

/**
 * Namespaced message catalogue. One file per namespace per locale so translators
 * (and, later, a TMS) can work on a feature without touching the rest of the app,
 * and so merge conflicts stay scoped to the feature being changed.
 *
 * The imports are static rather than `import()`-by-locale: the catalogue is only
 * ever read on the server (`server-only`), the bundler can tree-shake nothing here
 * anyway, and static imports are what makes `Messages` below a real compile-time
 * type instead of `any`.
 */
const bg = {
  common: bgCommon,
  enums: bgEnums,
  home: bgHome,
  listings: bgListings,
  messages: bgMessages,
  metadata: bgMetadata,
  profiles: bgProfiles,
  saved: bgSaved,
};

/**
 * `bg` is the source of truth for the key space — it is the default locale and the
 * one product copy is written in first. Typing every other locale against it makes a
 * missing or misspelled key a compile error; `pnpm i18n:check` catches the cases the
 * compiler structurally cannot (ICU placeholder drift, unused keys).
 */
export type Messages = typeof bg;

const catalogue: Record<Locale, Messages> = {
  bg,
  en: {
    common: enCommon,
    enums: enEnums,
    home: enHome,
    listings: enListings,
    messages: enMessages,
    metadata: enMetadata,
    profiles: enProfiles,
    saved: enSaved,
  },
};

export function getMessages(locale: Locale): Messages {
  return catalogue[locale];
}
