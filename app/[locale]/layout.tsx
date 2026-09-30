import { NextIntlClientProvider } from 'next-intl';
import { unstable_setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { Footer } from '@/components/shared/Footer';
import { Navbar } from '@/components/shared/navbar/Navbar';
import { APP_TIME_ZONE, isLocale, locales } from '@/lib/i18n';
import { getClientMessages } from '@/locales';

export const dynamicParams = false;
export const generateStaticParams = () => locales.map((locale) => ({ locale }));

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  if (!isLocale(params.locale)) {
    return notFound();
  }

  const locale = params.locale;

  // Lets the next-intl server APIs resolve the locale without reading headers, so
  // pages under this layout stay statically renderable.
  unstable_setRequestLocale(locale);

  // Only the namespaces client components read cross to the browser; server-only copy
  // (emails, legal pages, metadata) would otherwise ship with every page.
  const messages = getClientMessages(locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone={APP_TIME_ZONE}>
      {/* `contents` keeps the wrappers out of layout (and the navbar sticky); they only drop the chrome from printouts. */}
      <div className="contents print:hidden">
        <Navbar locale={locale} />
      </div>
      {children}
      <div className="contents print:hidden">
        <Footer locale={locale} />
      </div>
    </NextIntlClientProvider>
  );
}
