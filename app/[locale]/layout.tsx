import { NextIntlClientProvider } from 'next-intl';
import { unstable_setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { Footer } from '@/components/shared/Footer';
import { Navbar } from '@/components/shared/navbar/Navbar';
import { isLocale, locales } from '@/lib/i18n';
import { getMessages } from '@/locales';

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

  // The whole catalogue for the active locale crosses to the client. That is ~20 KB
  // of JSON per locale today; if it grows materially, narrow this to the namespaces
  // client components actually use rather than making every page pay for all of it.
  const messages = getMessages(locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Navbar locale={locale} />
      {children}
      <Footer locale={locale} />
    </NextIntlClientProvider>
  );
}
