import 'server-only';

import type { Locale } from '@/lib/i18n';

import { CLIENT_NAMESPACES, type ClientNamespace } from './client-namespaces';

import bgAreas from './bg/areas.json';
import bgAuth from './bg/auth.json';
import bgCommon from './bg/common.json';
import bgCompany from './bg/company.json';
import bgEmails from './bg/emails.json';
import bgEnums from './bg/enums.json';
import bgHome from './bg/home.json';
import bgLegal from './bg/legal.json';
import bgListings from './bg/listings.json';
import bgMessages from './bg/messages.json';
import bgMetadata from './bg/metadata.json';
import bgProfiles from './bg/profiles.json';
import bgReviews from './bg/reviews.json';
import bgSafety from './bg/safety.json';
import bgSaved from './bg/saved.json';
import bgSettings from './bg/settings.json';
import bgTemplates from './bg/templates.json';
import enAreas from './en/areas.json';
import enAuth from './en/auth.json';
import enCommon from './en/common.json';
import enCompany from './en/company.json';
import enEmails from './en/emails.json';
import enEnums from './en/enums.json';
import enHome from './en/home.json';
import enLegal from './en/legal.json';
import enListings from './en/listings.json';
import enMessages from './en/messages.json';
import enMetadata from './en/metadata.json';
import enProfiles from './en/profiles.json';
import enReviews from './en/reviews.json';
import enSafety from './en/safety.json';
import enSaved from './en/saved.json';
import enSettings from './en/settings.json';
import enTemplates from './en/templates.json';

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
  areas: bgAreas,
  auth: bgAuth,
  common: bgCommon,
  company: bgCompany,
  emails: bgEmails,
  enums: bgEnums,
  home: bgHome,
  legal: bgLegal,
  listings: bgListings,
  messages: bgMessages,
  metadata: bgMetadata,
  profiles: bgProfiles,
  reviews: bgReviews,
  safety: bgSafety,
  saved: bgSaved,
  settings: bgSettings,
  templates: bgTemplates,
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
    areas: enAreas,
    auth: enAuth,
    common: enCommon,
    company: enCompany,
    emails: enEmails,
    enums: enEnums,
    home: enHome,
    legal: enLegal,
    listings: enListings,
    messages: enMessages,
    metadata: enMetadata,
    profiles: enProfiles,
    reviews: enReviews,
    safety: enSafety,
    saved: enSaved,
    settings: enSettings,
    templates: enTemplates,
  },
};

export function getMessages(locale: Locale): Messages {
  return catalogue[locale];
}

export type ClientMessages = Pick<Messages, ClientNamespace>;

/** The subset of the catalogue client components need — see `CLIENT_NAMESPACES`. */
export function getClientMessages(locale: Locale): ClientMessages {
  const messages = catalogue[locale];

  return Object.fromEntries(
    CLIENT_NAMESPACES.map((namespace) => [namespace, messages[namespace]]),
  ) as ClientMessages;
}
