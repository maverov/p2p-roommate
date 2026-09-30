import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { StateMessage } from '@/components/shared/StateMessage';
import { MyListingCard } from '@/features/listings/components/MyListingCard';
import { listOwnListings } from '@/features/listings/server/repository';
import { listReviewedTargets } from '@/features/reviews/server/repository';
import { OwnerViewingRequestCard } from '@/features/viewing-requests/components/OwnerViewingRequestCard';
import { isViewingCompleted, OWNER_REQUESTS_ANCHOR } from '@/features/viewing-requests/constants';
import { listViewingRequests } from '@/features/viewing-requests/server/repository';
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

  const [listings, requests, reviewed] = await Promise.all([
    safeQuery(listOwnListings(user.id), `own-listings ${user.id}`),
    safeQuery(listViewingRequests(user.id, { role: 'owner' }), `owner requests ${user.id}`),
    safeQuery(listReviewedTargets(user.id), `reviewed targets ${user.id}`),
  ]);
  const now = new Date();
  // Requests awaiting a decision first; the query already orders each group newest first.
  const sortedRequests =
    requests &&
    [...requests].sort(
      (a, b) => Number(b.status === 'REQUESTED') - Number(a.status === 'REQUESTED'),
    );
  const pendingCount = requests?.filter((request) => request.status === 'REQUESTED').length ?? 0;

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

      <section
        aria-labelledby={`${OWNER_REQUESTS_ANCHOR}-heading`}
        className="mt-12 scroll-mt-24"
        id={OWNER_REQUESTS_ANCHOR}
      >
        <div className="flex items-baseline gap-3">
          <h2
            className="text-[20px] font-bold text-brand-ink"
            id={`${OWNER_REQUESTS_ANCHOR}-heading`}
          >
            {t('requests.heading')}
          </h2>
          {pendingCount > 0 && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[12px] font-medium text-amber-700">
              {t('requests.pending', { count: pendingCount })}
            </span>
          )}
        </div>

        <div className="mt-4">
          {sortedRequests === null ? (
            <StateMessage tone="error" title={t('requests.errorTitle')} body={t('errorBody')} />
          ) : sortedRequests.length === 0 ? (
            <p className="text-[14px] text-brand-muted">{t('requests.empty')}</p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2" role="list">
              {sortedRequests.map((request) => (
                <li key={request.id}>
                  <OwnerViewingRequestCard
                    canReviewTenant={
                      reviewed !== null &&
                      isViewingCompleted(request, now) &&
                      !reviewed.userIds.has(request.requesterId)
                    }
                    locale={locale}
                    request={request}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
