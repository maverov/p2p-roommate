import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { StateMessage } from '@/components/shared/StateMessage';
import { ListingCard } from '@/features/listings/components/ListingCard';
import { ListingFilters } from '@/features/listings/components/ListingFilters';
import { ListingSortSelect } from '@/features/listings/components/ListingSortSelect';
import { SaveSearchButton } from '@/features/listings/components/SaveSearchButton';
import { listListingsQuerySchema } from '@/features/listings/schemas';
import {
  getSavedListingIds,
  listPublishedListings,
} from '@/features/listings/server/repository';
import { getCityLabel } from '@/lib/areas';
import { formatMoneyFromCents } from '@/lib/format';
import { isLocale, type Locale } from '@/lib/i18n';
import { BreadcrumbJsonLd } from '@/lib/jsonld';
import { routes } from '@/lib/routes';
import { safeQuery } from '@/lib/server/safe';
import { getServerUser } from '@/lib/server/session';
import { cn } from '@/utils';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const PER_PAGE = 24;

type SearchPageProps = {
  params: { locale: string };
  searchParams: Record<string, string | string[] | undefined>;
};

export async function generateMetadata({
  params,
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : 'bg';
  const t = await getTranslations({ locale, namespace: 'listings.search' });
  const tMeta = await getTranslations({ locale, namespace: 'metadata' });
  const citySlug = typeof searchParams.citySlug === 'string' ? searchParams.citySlug : null;
  const title = citySlug
    ? t('headingIn', { city: getCityLabel(citySlug, locale) })
    : t('heading');

  return {
    title,
    description: tMeta('listings.description'),
    alternates: {
      canonical: `${appUrl}${routes.listings(locale)}`,
      languages: {
        'bg-BG': `${appUrl}${routes.listings('bg')}`,
        'en-US': `${appUrl}${routes.listings('en')}`,
      },
    },
    // Filtered permutations are near-duplicates; only the clean index is indexed.
    robots: Object.keys(searchParams).length > 0 ? { index: false, follow: true } : undefined,
  };
}

export default async function ListingsSearchPage({ params, searchParams }: SearchPageProps) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const locale: Locale = params.locale;
  const t = await getTranslations({ locale, namespace: 'listings' });
  const tEnums = await getTranslations({ locale, namespace: 'enums' });

  // An unparseable query (hand-edited URL, stale bookmark) falls back to the
  // default listing feed instead of erroring out.
  const parsed = listListingsQuerySchema.safeParse({ perPage: PER_PAGE, ...searchParams });
  const query = parsed.success
    ? parsed.data
    : listListingsQuerySchema.parse({ perPage: PER_PAGE });

  const viewer = await getServerUser();
  const results = await safeQuery(listPublishedListings(query), 'listings search');
  const savedIds =
    viewer && results
      ? await safeQuery(
          getSavedListingIds(viewer.id, results.items.map((item) => item.id)),
          'saved listings',
        )
      : null;

  const city = query.citySlug ? getCityLabel(query.citySlug, locale) : null;
  const heading = city ? t('search.headingIn', { city }) : t('search.heading');
  const totalPages = results ? Math.max(1, Math.ceil(results.total / results.perPage)) : 1;

  const breadcrumbItems = [
    { name: 'Stay.bg', url: `${appUrl}${routes.home(locale)}` },
    { name: t('common.listings'), url: `${appUrl}${routes.listings(locale)}` },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbItems} />

      <main className="min-h-screen bg-brand-cream text-brand-ink" id="main-content">
        <div className="mx-auto w-full max-w-[2000px] px-6 pb-16 pt-8 lg:px-10">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-[34px] font-medium leading-none tracking-[-0.03em] text-brand-ink">
                {heading}
              </h1>

              <p className="mt-2 text-[14px] text-brand-muted">
                {results ? t('search.resultCount', { count: results.total }) : t('common.loadFailed')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <SaveSearchButton
                isAuthenticated={Boolean(viewer)}
                locale={locale}
                name={buildSearchName(heading, query, locale, t, tEnums)}
              />

              <ListingSortSelect locale={locale} value={query.sort} />
            </div>
          </header>

          <div className="mt-6 grid gap-6 lg:grid-cols-[286px_minmax(0,1fr)] lg:gap-8">
            <aside className="lg:sticky lg:top-6 lg:h-fit">
              <ListingFilters locale={locale} />
            </aside>

            <section aria-live="polite" className="min-w-0">
              {!results ? (
                <StateMessage
                  action={
                    <Link
                      className="rounded-[10px] bg-brand-terracotta px-4 py-2.5 text-[14px] font-bold text-white transition hover:bg-brand-terracotta-hover"
                      href={routes.listings(locale)}
                    >
                      {t('common.retry')}
                    </Link>
                  }
                  body={t('search.errorBody')}
                  title={t('search.errorTitle')}
                  tone="error"
                />
              ) : results.items.length === 0 ? (
                <StateMessage
                  action={
                    <Link
                      className="rounded-[10px] border border-brand-border bg-white px-4 py-2.5 text-[14px] font-bold text-brand-ink transition hover:border-brand-terracotta hover:text-brand-terracotta"
                      href={routes.listings(locale)}
                    >
                      {t('search.clearAll')}
                    </Link>
                  }
                  body={t('search.emptyBody')}
                  title={t('search.empty')}
                />
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {results.items.map((listing, index) => (
                      <ListingCard
                        isAuthenticated={Boolean(viewer)}
                        isSaved={savedIds?.has(listing.id)}
                        key={listing.id}
                        listing={listing}
                        locale={locale}
                        priority={index < 4}
                        sizes="(min-width: 1536px) 22vw, (min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw"
                      />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <Pagination
                      locale={locale}
                      page={results.page}
                      searchParams={searchParams}
                      totalPages={totalPages}
                    />
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

/**
 * Default name for a saved search, e.g. "Обяви в София · Стая · до 700 лв".
 * The translators are passed in rather than resolved here so this stays a plain
 * function the page can call synchronously.
 */
function buildSearchName(
  heading: string,
  query: ReturnType<typeof listListingsQuerySchema.parse>,
  locale: Locale,
  t: Awaited<ReturnType<typeof getTranslations<'listings'>>>,
  tEnums: Awaited<ReturnType<typeof getTranslations<'enums'>>>,
) {
  const parts = [heading];

  if (query.propertyType?.length) {
    parts.push(
      query.propertyType.map((type) => tEnums(`propertyType.${type}`)).join(' / '),
    );
  }

  if (query.maxRentCents) {
    parts.push(
      `${t('search.upTo')} ${formatMoneyFromCents(query.maxRentCents, 'BGN', locale)}`,
    );
  }

  return parts.join(' · ').slice(0, 120);
}

const PAGINATION_LINK =
  'flex items-center gap-1.5 rounded-[10px] border border-brand-border bg-white px-3.5 py-2 text-[13px] font-bold text-brand-ink transition hover:border-brand-terracotta hover:text-brand-terracotta';

async function Pagination({
  locale,
  page,
  searchParams,
  totalPages,
}: {
  locale: Locale;
  page: number;
  searchParams: SearchPageProps['searchParams'];
  totalPages: number;
}) {
  const t = await getTranslations({ locale, namespace: 'listings.search' });

  // Real anchors, so pages are crawlable and open in a new tab like any link.
  const hrefForPage = (target: number) => {
    const next = new URLSearchParams();

    for (const [key, value] of Object.entries(searchParams)) {
      if (typeof value === 'string' && key !== 'page') {
        next.set(key, value);
      }
    }

    if (target > 1) {
      next.set('page', String(target));
    }

    return routes.listings(locale, next.toString());
  };

  return (
    <nav
      aria-label={t('pageOf', { page, total: totalPages })}
      className="mt-8 flex items-center justify-between gap-4"
    >
      {page > 1 ? (
        <Link className={PAGINATION_LINK} href={hrefForPage(page - 1)} rel="prev">
          <ChevronLeft aria-hidden="true" size={14} strokeWidth={2.2} />
          {t('previous')}
        </Link>
      ) : (
        <span className={cn(PAGINATION_LINK, 'pointer-events-none opacity-45')}>
          <ChevronLeft aria-hidden="true" size={14} strokeWidth={2.2} />
          {t('previous')}
        </span>
      )}

      <p className="text-[13px] text-brand-muted">{t('pageOf', { page, total: totalPages })}</p>

      {page < totalPages ? (
        <Link className={PAGINATION_LINK} href={hrefForPage(page + 1)} rel="next">
          {t('next')}
          <ChevronRight aria-hidden="true" size={14} strokeWidth={2.2} />
        </Link>
      ) : (
        <span className={cn(PAGINATION_LINK, 'pointer-events-none opacity-45')}>
          {t('next')}
          <ChevronRight aria-hidden="true" size={14} strokeWidth={2.2} />
        </span>
      )}
    </nav>
  );
}
