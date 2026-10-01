import type { Route } from 'next';

import { AREA_KIND_SEGMENTS, type AreaKind } from '@/lib/areas/kinds';
import { defaultLocale, isLocale, type Locale } from '@/lib/i18n';

/**
 * `experimental.typedRoutes` can only verify string *literals*, and every URL
 * here is assembled at runtime from a locale and an id. This is the single
 * place in the app where a built path crosses into the typed-route world —
 * call sites stay type-safe about which helper they use.
 */
const route = (path: string) => path as Route;

/**
 * Single source of truth for every internal URL.
 *
 * Locale-prefixed pages live under `app/[locale]/*`; auth and admin pages are
 * intentionally locale-free because they are `noindex` and shared.
 */
export const routes = {
  home: (locale: Locale) => route(`/${locale}`),
  listings: (locale: Locale, search?: string) =>
    route(search ? `/${locale}/listings?${search}` : `/${locale}/listings`),
  listing: (locale: Locale, id: string) => route(`/${locale}/listings/${id}`),
  editListing: (locale: Locale, id: string) => route(`/${locale}/listings/${id}/edit`),
  profile: (locale: Locale, id: string, search?: string) =>
    route(search ? `/${locale}/profiles/${id}?${search}` : `/${locale}/profiles/${id}`),
  messages: (locale: Locale) => route(`/${locale}/messages`),
  conversation: (locale: Locale, id: string) => route(`/${locale}/messages/${id}`),
  saved: (locale: Locale, search?: string) =>
    route(search ? `/${locale}/saved?${search}` : `/${locale}/saved`),
  myListings: (locale: Locale) => route(`/${locale}/my-listings`),
  listProperty: (locale: Locale) => route(`/${locale}/list-property`),
  appliedListings: (locale: Locale) => route(`/${locale}/applied-listings`),
  findRoommate: (locale: Locale, search?: string) =>
    route(search ? `/${locale}/find-roommate?${search}` : `/${locale}/find-roommate`),
  /** SEO landing pages: every city, then each city and neighbourhood. */
  areas: (locale: Locale) => route(`/${locale}/rooms`),
  area: (locale: Locale, citySlug: string, neighborhoodSlug?: string) =>
    route(
      neighborhoodSlug
        ? `/${locale}/rooms/${citySlug}/${neighborhoodSlug}`
        : `/${locale}/rooms/${citySlug}`,
    ),
  /** A city's page for one kind of home, e.g. `/bg/apartments/sofia`. */
  areaKind: (locale: Locale, kind: AreaKind, citySlug: string) =>
    route(`/${locale}/${AREA_KIND_SEGMENTS[kind]}/${citySlug}`),
  settings: (locale: Locale) => route(`/${locale}/settings`),
  privacy: (locale: Locale) => route(`/${locale}/privacy`),
  terms: (locale: Locale) => route(`/${locale}/terms`),
  safety: (locale: Locale) => route(`/${locale}/safety`),
  templates: (locale: Locale) => route(`/${locale}/templates`),
  about: (locale: Locale) => route(`/${locale}/about`),
  whyUs: (locale: Locale) => route(`/${locale}/why-stay`),
  howItWorks: (locale: Locale) => route(`/${locale}/how-it-works`),
  faq: (locale: Locale) => route(`/${locale}/faq`),
  contact: (locale: Locale) => route(`/${locale}/contact`),
  press: (locale: Locale) => route(`/${locale}/press`),
  template: (locale: Locale, slug: string) => route(`/${locale}/templates/${slug}`),
  login: (next?: string) => withNext('/login', next),
  signup: (next?: string) => withNext('/signup', next),
  forgotPassword: () => route('/forgot-password'),
  /** Better Auth appends `?token=` (or `?error=INVALID_TOKEN`) when redirecting here. */
  resetPassword: () => route('/reset-password'),
  /** Better Auth appends `error=` here when a verification link is bad or expired. */
  verifyEmail: (next?: string) => withNext('/verify-email', next),
  admin: () => route('/admin'),
  adminReports: (search?: string) => route(search ? `/admin/reports?${search}` : '/admin/reports'),
  adminReport: (id: string) => route(`/admin/reports/${id}`),
} as const;

function withNext(path: string, next?: string) {
  const safeNext = sanitizeNextPath(next);

  return route(safeNext ? `${path}?next=${encodeURIComponent(safeNext)}` : path);
}

/**
 * Guards against open redirects: only same-origin, single-slash paths pass.
 * Anything else (absolute URLs, protocol-relative `//evil.com`) is dropped.
 */
export function sanitizeNextPath(value?: string | null): Route | null {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return null;
  }

  return route(value);
}

/** Reads the locale out of a pathname, falling back to the default. */
export function localeFromPathname(pathname: string): Locale {
  const [first] = pathname.split('/').filter(Boolean);

  return first && isLocale(first) ? first : defaultLocale;
}

/** Swaps the locale segment of a pathname, preserving the rest of the path. */
export function withLocale(pathname: string, locale: Locale): Route {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length > 0 && isLocale(segments[0])) {
    segments[0] = locale;
  } else {
    segments.unshift(locale);
  }

  return route(`/${segments.join('/')}`);
}
