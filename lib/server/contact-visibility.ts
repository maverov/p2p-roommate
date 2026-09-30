import 'server-only';

import { getTranslations } from 'next-intl/server';

import {
  API_CONTACT_PLACEHOLDER,
  LISTING_TEXT_FIELDS,
  PROFILE_TEXT_FIELDS,
  redactContactDetails,
  redactFields,
} from '@/lib/contact-redaction';
import type { Locale } from '@/lib/i18n';

type ListingText = Record<(typeof LISTING_TEXT_FIELDS)[number], string | string[]>;
type ProfileText = Record<(typeof PROFILE_TEXT_FIELDS)[number], string | null>;

/**
 * Applies the "contact details only for signed-in users" rule (`lib/contact-redaction.ts`)
 * to whatever a page or API route is about to send. Signed-in viewers get the identity.
 */
export type ContactMasker = {
  listing: <T extends ListingText>(listing: T) => T;
  profile: <T extends ProfileText>(profile: T) => T;
  /** A single owner-written string, such as a title on a map marker. */
  text: (value: string) => string;
};

const identity: ContactMasker = {
  listing: (listing) => listing,
  profile: (profile) => profile,
  text: (value) => value,
};

function maskerWith(replacement: string): ContactMasker {
  return {
    listing: (listing) => redactFields(listing, LISTING_TEXT_FIELDS, replacement),
    profile: (profile) => redactFields(profile, PROFILE_TEXT_FIELDS, replacement),
    text: (value) => redactContactDetails(value, replacement),
  };
}

/**
 * For pages, with a localized placeholder. Metadata and structured data are read by
 * crawlers, which are never signed in, so they pass `signedIn: false`.
 */
export async function pageContactMasker(locale: Locale, signedIn: boolean) {
  if (signedIn) return identity;

  const t = await getTranslations({ locale, namespace: 'common' });

  return maskerWith(t('contactHidden'));
}

/** For public API responses. */
export function apiContactMasker(signedIn: boolean): ContactMasker {
  return signedIn ? identity : maskerWith(API_CONTACT_PLACEHOLDER);
}
