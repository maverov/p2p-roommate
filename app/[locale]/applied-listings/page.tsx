import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { StateMessage } from '@/components/shared/StateMessage';
import { listReviewedTargets } from '@/features/reviews/server/repository';
import { AppliedListingCard } from '@/features/viewing-requests/components/AppliedListingCard';
import { listViewingRequests } from '@/features/viewing-requests/server/repository';
import { isLocale, type Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import { safeQuery } from '@/lib/server/safe';
import { requireServerUser } from '@/lib/server/session';

type AppliedListingsPageProps = {
  params: { locale: string };
};

export async function generateMetadata({ params }: AppliedListingsPageProps): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : 'bg';
  const t = await getTranslations({ locale, namespace: 'listings.appliedListings' });

  return {
    title: t('heading'),
    robots: { index: false },
  };
}

export default async function AppliedListingsPage({ params }: AppliedListingsPageProps) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const locale: Locale = params.locale;
  const t = await getTranslations({ locale, namespace: 'listings.appliedListings' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const user = await requireServerUser(routes.appliedListings(locale));

  const [requests, reviewed] = await Promise.all([
    safeQuery(listViewingRequests(user.id, { role: 'requester' }), `applied listings ${user.id}`),
    safeQuery(listReviewedTargets(user.id), `reviewed targets ${user.id}`),
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 lg:px-6">
      <h1 className="text-[24px] font-bold leading-8 text-brand-ink">{t('heading')}</h1>

      <div className="mt-6">
        {requests === null ? (
          <StateMessage body={t('errorBody')} title={t('errorTitle')} tone="error" />
        ) : requests.length === 0 ? (
          <StateMessage
            action={
              <Link
                className="rounded-[10px] bg-brand-terracotta px-5 py-2.5 text-[14px] font-bold text-white transition hover:bg-brand-terracotta-hover"
                href={routes.listings(locale)}
              >
                {tCommon('actions.browseListings')}
              </Link>
            }
            body={t('emptyBody')}
            title={t('empty')}
          />
        ) : (
          <ul className="space-y-3" role="list">
            {requests.map((request) => (
              <li key={request.id}>
                <AppliedListingCard
                  locale={locale}
                  request={request}
                  // Unknown review state hides the prompts rather than inviting a 409.
                  reviewed={{
                    listing: reviewed?.listingIds.has(request.listingId) ?? true,
                    owner: reviewed?.userIds.has(request.ownerId) ?? true,
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
