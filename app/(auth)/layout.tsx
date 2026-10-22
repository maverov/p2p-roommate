import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { unstable_setRequestLocale } from 'next-intl/server';
import Link from 'next/link';

import { APP_TIME_ZONE } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import { getCookieLocale } from '@/lib/server/locale';
import { getMessages } from '@/locales';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const locale = getCookieLocale();
  // These pages sit outside the locale middleware, and next-intl's server provider
  // resolves the request locale even when one is passed in — without this it throws.
  unstable_setRequestLocale(locale);
  // The auth forms only ever read the `auth` namespace; the rest stays on the server.
  const { auth } = getMessages(locale);

  return (
    <NextIntlClientProvider locale={locale} messages={{ auth }} timeZone={APP_TIME_ZONE}>
      <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-brand-cream px-6 py-12">
        <Link href={routes.home(locale)}>
          <span className="text-[1.75rem] font-bold tracking-tight text-brand-terracotta">
            Rent<span className="text-brand-ink">Bee</span>
          </span>
        </Link>

        {children}
      </main>
    </NextIntlClientProvider>
  );
}
