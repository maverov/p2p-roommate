import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { StateMessage } from '@/components/shared/StateMessage';
import { MyListingCard } from '@/features/listings/components/MyListingCard';
import { listOwnListings } from '@/features/listings/server/repository';
import { isLocale, type Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import { safeQuery } from '@/lib/server/safe';
import { requireServerUser } from '@/lib/server/session';

type MyListingsPageProps = {
  params: { locale: string };
};

export async function generateMetadata({ params }: MyListingsPageProps): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : 'bg';
  const t = await getTranslations({ locale, namespace: 'listings.myListings' });

  return {
    title: t('heading'),
    robots: { index: false },
  };
}

export default async function MyListingsPage({ params }: MyListingsPageProps) {
  if (!isLocale(params.locale)) notFound();

  const locale: Locale = params.locale;
  const t = await getTranslations({ locale, namespace: 'listings.myListings' });
  const user = await requireServerUser(routes.myListings(locale));

  const listings = await safeQuery(listOwnListings(user.id), `own-listings ${user.id}`);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 lg:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[24px] font-bold leading-8 text-brand-ink">{t('heading')}</h1>
        <Link
          href={routes.listProperty(locale)}
          className="rounded-xl bg-brand-terracotta px-4 py-2 text-[14px] font-medium text-white hover:bg-brand-terracotta/90"
        >
          + {t('createFirst')}
        </Link>
      </div>

      <div className="mt-8">
        {listings === null ? (
          <StateMessage tone="error" title={t('errorTitle')} body={t('errorBody')} />
        ) : listings.length === 0 ? (
          <StateMessage
            title={t('empty')}
            body={t('emptyBody')}
            action={
              <Link
                href={routes.listProperty(locale)}
                className="rounded-[10px] bg-brand-terracotta px-5 py-2.5 text-[14px] font-bold text-white hover:bg-brand-terracotta/90"
              >
                {t('createFirst')}
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((listing) => (
              <MyListingCard key={listing.id} listing={listing} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
