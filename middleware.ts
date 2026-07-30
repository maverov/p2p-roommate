import createMiddleware from 'next-intl/middleware';
import { defaultLocale, locales } from '@/lib/i18n';

export default createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always',
});

export const config = {
  // Skip all paths that should not be internationalized: the API, the shared
  // auth pages, Next internals, and any file with an extension (e.g.
  // /images/*.png) so the image optimizer can fetch public assets without being
  // redirected. `/listings/*` is deliberately NOT excluded — those pages live
  // under `app/[locale]` and legacy unprefixed URLs should redirect into it.
  matcher: ['/((?!api|login|signup|_next|_vercel|.*\\..*).*)'],
};
