import createMiddleware from 'next-intl/middleware';
import { defaultLocale, locales } from '@/lib/i18n';

export default createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always',
});

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};
