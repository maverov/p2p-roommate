import createMiddleware from 'next-intl/middleware';
import { defaultLocale, locales } from '@/lib/i18n';

export default createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always',
});

export const config = {
  // Skip all paths that should not be internationalized:
  // Next internals, and any file with an extension (e.g. /images/*.png) so the
  // image optimizer can fetch public assets without being redirected.
  matcher: ['/((?!api|login|signup|listings|_next|_vercel|.*\\..*).*)'],
};
