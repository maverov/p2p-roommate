import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { isLocale, locales } from '@/lib/i18n';

export const dynamicParams = false;
export const generateStaticParams = () => locales.map((locale) => ({ locale }));

export default function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  if (!isLocale(params.locale)) {
    return notFound();
  }

  return <>{children}</>;
}
