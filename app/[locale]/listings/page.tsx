import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ChevronLeft, ChevronRight, List, Map as MapIcon } from 'lucide-react';

import { StateMessage } from '@/components/shared/StateMessage';
import { scoreListing } from '@/features/compatibility/score';
import { getCompatibilityProfile } from '@/features/compatibility/server/repository';
import { ListingCard } from '@/features/listings/components/ListingCard';
import { ListingFilters } from '@/features/listings/components/ListingFilters';
import { ListingSortSelect } from '@/features/listings/components/ListingSortSelect';
import { listListingsQuerySchema } from '@/features/listings/schemas';
import {
  MAP_MARKER_LIMIT,
  getSavedListingIds,
  listPublishedListings,
  listPublishedListingsForMap,
} from '@/features/listings/server/repository';
import { ListingsMap, type MapListing } from '@/features/maps/components/ListingsMap';
import { getCityLabel, getNeighborhoodLabel, isCityId } from '@/lib/areas';
import { formatMoneyFromCents } from '@/lib/format';
import { isLocale, type Locale } from '@/lib/i18n';
import { BreadcrumbJsonLd } from '@/lib/jsonld';
import { CITY_CENTERS } from '@/lib/map';
import { routes } from '@/lib/routes';
import { pageContactMasker } from '@/lib/server/contact-visibility';
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
  const title = citySlug ? t('headingIn', { city: getCityLabel(citySlug, locale) }) : t('heading');

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

  // An unparseable query (hand-edited URL, stale bookmark) falls back to the
  // default listing feed instead of erroring out.
  const parsed = listListingsQuerySchema.safeParse({ perPage: PER_PAGE, ...searchParams });
  const query = parsed.success ? parsed.data : listListingsQuerySchema.parse({ perPage: PER_PAGE });

  // The map is a second view of the same search, so it shares every filter and the sort.
  const isMapView = searchParams.view === 'map';
  const viewer = await getServerUser();
  const [found, mapFound, mask] = await Promise.all([
    isMapView ? null : safeQuery(listPublishedListings(query), 'listings search'),
    isMapView ? safeQuery(listPublishedListingsForMap(query), 'listings map') : null,
    pageContactMasker(locale, Boolean(viewer)),
  ]);
  const results = found && { ...found, items: found.items.map(mask.listing) };
  const mapListings: MapListing[] =
    mapFound?.items.map((item) => ({
      id: item.id,
      title: mask.text(item.title),
      href: routes.listing(locale, item.id),
      priceLabel: formatMoneyFromCents(item.monthlyRentCents, item.currency, locale),
      areaLabel:
        getNeighborhoodLabel(item.citySlug, item.neighborhoodSlug, locale) ??
        getCityLabel(item.citySlug, locale),
      latitude: item.latitude,
      longitude: item.longitude,
    })) ?? [];
  const loaded = isMapView ? mapFound !== null : results !== null;
  const total = (isMapView ? mapFound?.total : results?.total) ?? 0;
  const [savedIds, seeker] =
    viewer && results?.items.length
      ? await Promise.all([
          safeQuery(
            getSavedListingIds(
              viewer.id,
              results.items.map((item) => item.id),
            ),
            'saved listings',
          ),
          safeQuery(getCompatibilityProfile(viewer.id), 'compatibility profile'),
        ])
      : [null, null];

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

      <main className="min-h-screen bg-brand-cream text-brand-ink">
        <div className="mx-auto w-full max-w-[2000px] px-6 pb-16 pt-8 lg:px-10">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-[34px] font-medium leading-none tracking-[-0.03em] text-brand-ink">
                {heading}
              </h1>

              <p className="mt-2 text-[14px] text-brand-muted">
                {loaded ? t('search.resultCount', { count: total }) : t('common.loadFailed')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <ViewToggle isMapView={isMapView} locale={locale} searchParams={searchParams} />
              <ListingSortSelect locale={locale} value={query.sort} />
            </div>
          </header>

          <div className="mt-6 grid gap-6 lg:grid-cols-[286px_minmax(0,1fr)] lg:gap-8">
            <aside className="lg:sticky lg:top-6 lg:h-fit">
              <ListingFilters locale={locale} />
            </aside>

            <section aria-live="polite" className="min-w-0">
              {!loaded ? (
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
              ) : total === 0 ? (
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
              ) : isMapView ? (
                <>
                  {mapListings.length < total && (
                    <p className="mb-3 text-[13px] text-brand-muted">
                      {mapListings.length === MAP_MARKER_LIMIT
                        ? t('search.mapCapped', { shown: mapListings.length, total })
                        : t('search.mapPartial', { shown: mapListings.length, total })}
                    </p>
                  )}
                  <ListingsMap
                    center={
                      query.citySlug && isCityId(query.citySlug)
                        ? CITY_CENTERS[query.citySlug]
                        : CITY_CENTERS.sofia
                    }
                    labels={{ region: t('search.mapLabel'), view: t('search.mapViewListing') }}
                    listings={mapListings}
                  />
                </>
              ) : (
                results && (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                      {results.items.map((listing, index) => (
                        <ListingCard
                          isAuthenticated={Boolean(viewer)}
                          isSaved={savedIds?.has(listing.id)}
                          key={listing.id}
                          listing={listing}
                          locale={locale}
                          matchScore={
                            seeker && listing.ownerId !== viewer?.id
                              ? scoreListing(seeker, listing)
                              : null
                          }
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
                )
              )}
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

const VIEW_LINK =
  'flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[13px] font-bold transition';

/** List and map are links, not client state: the view is part of a shareable search URL. */
async function ViewToggle({
  isMapView,
  locale,
  searchParams,
}: {
  isMapView: boolean;
  locale: Locale;
  searchParams: SearchPageProps['searchParams'];
}) {
  const t = await getTranslations({ locale, namespace: 'listings.search' });

  const hrefForView = (map: boolean) => {
    const next = new URLSearchParams();

    for (const [key, value] of Object.entries(searchParams)) {
      // The page number belongs to the list; the map has no pages.
      if (typeof value === 'string' && key !== 'page' && key !== 'view') {
        next.set(key, value);
      }
    }

    if (map) next.set('view', 'map');

    return routes.listings(locale, next.toString());
  };

  const views = [
    { map: false, label: t('viewList'), icon: List },
    { map: true, label: t('viewMap'), icon: MapIcon },
  ];

  return (
    <nav
      aria-label={t('viewLabel')}
      className="flex rounded-[10px] border border-brand-border bg-white p-0.5"
    >
      {views.map(({ icon: Icon, label, map }) => {
        const active = map === isMapView;

        return (
          <Link
            aria-current={active ? 'page' : undefined}
            className={cn(
              VIEW_LINK,
              active ? 'bg-brand-chip text-brand-ink' : 'text-brand-muted hover:text-brand-ink',
            )}
            href={hrefForView(map)}
            key={label}
            scroll={false}
          >
            <Icon aria-hidden="true" size={14} strokeWidth={2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
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
