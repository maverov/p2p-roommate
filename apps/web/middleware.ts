import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['bg', 'en'] as const;
const defaultLocale = 'bg';
const cookieName = 'NEXT_LOCALE';

function getLocaleFromAcceptLanguage(acceptLanguage: string | null): string {
  if (!acceptLanguage) return defaultLocale;

  const languages = acceptLanguage
    .split(',')
    .map((item) => item.split(';')[0].trim().toLowerCase());

  for (const lang of languages) {
    if (lang.startsWith('bg')) return 'bg';
    if (lang.startsWith('en')) return 'en';
  }

  return defaultLocale;
}

function isLocalePath(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  return segments.length > 0 && locales.includes(segments[0] as typeof locales[number]);
}

export function middleware(request: NextRequest) {
  const { nextUrl, headers, cookies } = request;
  const { pathname, search } = nextUrl;

  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.startsWith('/static')) {
    return NextResponse.next();
  }

  if (isLocalePath(pathname)) {
    return NextResponse.next();
  }

  const savedLocale = cookies.get(cookieName)?.value;
  const locale =
    savedLocale && locales.includes(savedLocale as typeof locales[number])
      ? savedLocale
      : getLocaleFromAcceptLanguage(headers.get('accept-language'));

  const redirectUrl = new URL(`/${locale}${pathname}${search}`, request.url);
  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set(cookieName, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};
