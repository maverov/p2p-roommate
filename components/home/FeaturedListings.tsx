import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

import { StateMessage } from '@/components/shared/StateMessage';
import SquiggleUnderline from '@/components/ui/SquiggleUnderline';
import { ListingCard } from '@/features/listings/components/ListingCard';
import {
  getSavedListingIds,
  listPublishedListings,
} from '@/features/listings/server/repository';
import type { Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import { safeQuery } from '@/lib/server/safe';
import { getServerUser } from '@/lib/server/session';

const FEATURED_COUNT = 5;

type FeaturedListingsProps = {
  locale: Locale;
};

/**
 * Newest verified listings. Fetched here rather than passed down so the home
 * page composes independent sections that each fail on their own.
 */
export default async function FeaturedListings({ locale }: FeaturedListingsProps) {
  const t = await getTranslations({ locale, namespace: 'home.featured' });
  const tSearch = await getTranslations({ locale, namespace: 'listings.search' });

  const [viewer, results] = await Promise.all([
    getServerUser(),
    safeQuery(
      listPublishedListings({
        sort: 'newest',
        isVerified: true,
        page: 1,
        perPage: FEATURED_COUNT,
      }),
      'featured listings',
    ),
  ]);

  const savedIds =
    viewer && results?.items.length
      ? await safeQuery(
          getSavedListingIds(viewer.id, results.items.map((item) => item.id)),
          'saved listings',
        )
      : null;

  return (
    <section className="bg-brand-cream px-6 pb-14 pt-6 lg:px-10">
      <div className="mx-auto w-full max-w-[2000px]">
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-[32px] font-medium leading-none tracking-[-0.03em] text-brand-ink">
              {t('heading')}
            </h2>

            <SquiggleUnderline />
          </div>

          <Link
            className="text-md pt-2 font-medium text-brand-ink transition hover:text-brand-terracotta"
            href={routes.listings(locale)}
          >
            {t('viewAll')} →
          </Link>
        </div>

        {!results ? (
          <StateMessage
            body={tSearch('errorBody')}
            title={tSearch('errorTitle')}
            tone="error"
          />
        ) : results.items.length === 0 ? (
          <StateMessage body={tSearch('emptyBody')} title={tSearch('empty')} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {results.items.map((listing, index) => (
              <ListingCard
                isAuthenticated={Boolean(viewer)}
                isSaved={savedIds?.has(listing.id)}
                key={listing.id}
                listing={listing}
                locale={locale}
                priority={index < 2}
                sizes="(min-width: 1024px) 20vw, (min-width: 640px) 50vw, 100vw"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
