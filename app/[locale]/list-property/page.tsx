import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { ListingForm } from '@/features/listings/components/ListingForm';
import { isLocale, type Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import { requireServerUser } from '@/lib/server/session';

type ListPropertyPageProps = {
  params: { locale: string };
};

export async function generateMetadata({ params }: ListPropertyPageProps): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : 'bg';
  const t = await getTranslations({ locale, namespace: 'listings.form' });

  return {
    title: t('createHeading'),
    // Not indexable — owner-specific form
    robots: { index: false },
  };
}

export default async function ListPropertyPage({ params }: ListPropertyPageProps) {
  if (!isLocale(params.locale)) notFound();

  const locale: Locale = params.locale;
  const t = await getTranslations({ locale, namespace: 'listings.form' });
  // Gate only — the form posts as the session user, so the id is not needed here.
  await requireServerUser(routes.listProperty(locale));

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 lg:px-6">
      <h1 className="mb-8 text-[24px] font-bold leading-8 text-brand-ink">
        {t('createHeading')}
      </h1>
      <ListingForm locale={locale} />
    </main>
  );
}
