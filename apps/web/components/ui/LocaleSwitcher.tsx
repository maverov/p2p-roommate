'use client';

import { useRouter, useParams } from 'next/navigation';
import { usePathname, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { locales } from '@/lib/locales';

const cookieName = 'NEXT_LOCALE';

function setLocaleCookie(locale: string) {
  document.cookie = `${cookieName}=${locale}; path=/; max-age=${60 * 60 * 24 * 365};`;
}

export function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams() as { locale?: string };

  const currentLocale = params.locale && locales.includes(params.locale as any) ? params.locale : 'bg';

  return (
    <div className="flex gap-2">
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          className={locale === currentLocale ? 'font-bold underline' : ''}
          onClick={() => {
            setLocaleCookie(locale);
            const segments = pathname.split('/').filter(Boolean);
            if (segments.length > 0 && locales.includes(segments[0] as any)) {
              segments[0] = locale;
            } else {
              segments.unshift(locale);
            }
            router.push(`/${segments.join('/')}${searchParams ? `?${searchParams.toString()}` : ''}`);
          }}
        >
          {locale.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
