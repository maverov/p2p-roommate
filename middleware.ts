import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';

import { TEMPLATE_SLUGS } from '@/features/templates/documents';
import { AREA_KIND_SEGMENTS, isCityId, isNeighborhoodInCity } from '@/lib/areas';
import { defaultLocale, isLocale, locales } from '@/lib/i18n';

const intlMiddleware = createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always',
});

const KIND_SEGMENTS: ReadonlySet<string> = new Set(Object.values(AREA_KIND_SEGMENTS));
const TEMPLATE_SLUG_SET: ReadonlySet<string> = new Set(Object.values(TEMPLATE_SLUGS));

/**
 * Whether a public page's address names a city, neighbourhood or template that does not
 * exist. The pages call `notFound()` themselves, but under the locale's `loading.tsx` the
 * response has already started with a 200 by then. These addresses are checked against
 * static data, so they can be answered here, before rendering, with a real 404. Longer
 * paths match no route, and Next already answers those with a 404.
 */
function isUnknownPublicPath(pathname: string) {
  const [locale, section, first, second, ...rest] = pathname.split('/').filter(Boolean);

  if (!locale || !isLocale(locale) || !first || rest.length > 0) return false;

  if (section === 'rooms') {
    return !isCityId(first) || (second !== undefined && !isNeighborhoodInCity(first, second));
  }

  if (second !== undefined) return false;

  if (KIND_SEGMENTS.has(section)) return !isCityId(first);

  if (section === 'templates') return !TEMPLATE_SLUG_SET.has(first);

  return false;
}

export default function middleware(request: NextRequest) {
  if (isUnknownPublicPath(request.nextUrl.pathname)) {
    // `/404` is not a locale, so the locale layout answers `notFound()` before anything
    // streams: the root not-found page, with a 404 status.
    return NextResponse.rewrite(new URL('/404', request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  // Skip all paths that should not be internationalized: the API, the shared
  // auth pages, the admin panel, Next internals, and any file with an extension (e.g.
  // /images/*.png) so the image optimizer can fetch public assets without being
  // redirected. `/listings/*` is deliberately NOT excluded — those pages live
  // under `app/[locale]` and legacy unprefixed URLs should redirect into it.
  matcher: [
    '/((?!api|login|signup|forgot-password|reset-password|verify-email|admin|_next|_vercel|.*\\..*).*)',
  ],
};
