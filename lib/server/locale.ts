import 'server-only';

import { cookies } from 'next/headers';

import { defaultLocale, isLocale, localeCookieName, type Locale } from '@/lib/i18n';

/**
 * Locale for the locale-free pages (`/login`, `/signup`, password reset): the one the
 * next-intl middleware remembered from the visitor's last `/<locale>/...` page.
 */
export function getCookieLocale(): Locale {
  const value = cookies().get(localeCookieName)?.value;

  return value && isLocale(value) ? value : defaultLocale;
}
