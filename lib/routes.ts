import type { Route } from 'next';

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
 * Locale-prefixed pages live under `app/[locale]/*`; auth pages are
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
  viewingRequests: (locale: Locale) => route(`/${locale}/viewing-requests`),
  findRoommate: (locale: Locale) => route(`/${locale}/find-roommate`),
  login: (next?: string) => withNext('/login', next),
  signup: (next?: string) => withNext('/signup', next),
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
