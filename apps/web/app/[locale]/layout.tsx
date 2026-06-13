import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { Navbar } from '@/components/shared/navbar/Navbar';
import { isLocale, locales } from '@/lib/i18n';

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

  return (
    <>
      <Navbar locale={params.locale} />
      {children}
    </>
  );
}
