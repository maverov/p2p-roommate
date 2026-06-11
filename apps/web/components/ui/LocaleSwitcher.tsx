'use client';

import { memo, useCallback } from 'react';
import type { Locale } from '@/lib/i18n';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { defaultLocale, isLocale, localeCookieName, locales } from '@/lib/i18n';

function setLocaleCookie(locale: string) {
  document.cookie = `${localeCookieName}=${locale}; path=/; max-age=${60 * 60 * 24 * 365};`;
}

export const LocaleSwitcher = memo(function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams() as { locale?: string };
  const currentLocale: Locale = params.locale && isLocale(params.locale) ? params.locale : defaultLocale;

  const onLocaleSelect = useCallback(
    (locale: Locale) => {
      setLocaleCookie(locale);
      const segments = pathname.split('/').filter(Boolean);
      if (segments.length > 0 && isLocale(segments[0])) {
        segments[0] = locale;
      } else {
        segments.unshift(locale);
      }
      const currentSearch = typeof window !== 'undefined' ? window.location.search : '';
      router.push(`/${segments.join('/')}${currentSearch}`);
    },
    [pathname, router]
  );

  return (
    <nav className="flex gap-2" aria-label="Language switcher">
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          aria-pressed={locale === currentLocale}
          className={
            locale === currentLocale
              ? 'rounded px-2 py-1 font-bold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2'
              : 'rounded px-2 py-1 focus-visible:outline-2 focus-visible:outline-offset-2'
          }
          onClick={() => onLocaleSelect(locale)}
        >
          {locale.toUpperCase()}
        </button>
      ))}
    </nav>
  );
});
