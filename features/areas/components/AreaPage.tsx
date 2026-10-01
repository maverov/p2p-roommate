import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

import { StateMessage } from '@/components/shared/StateMessage';
import { ListingCard } from '@/features/listings/components/ListingCard';
import { listListingsQuerySchema } from '@/features/listings/schemas';
import { getSavedListingIds, listPublishedListings } from '@/features/listings/server/repository';
import {
  AREA_KINDS,
  AREA_KIND_FILTERS,
  cityLabels,
  getGroupedNeighborhoods,
  getNeighborhood,
  inPlace,
  type AreaKind,
  type CityId,
} from '@/lib/areas';
import { PLATFORM_CURRENCY } from '@/lib/currency';
import { formatMoneyFromCents } from '@/lib/format';
import type { Locale } from '@/lib/i18n';
import { BreadcrumbJsonLd } from '@/lib/jsonld';
import { routes } from '@/lib/routes';
import { pageContactMasker } from '@/lib/server/contact-visibility';
import { pageMetadata } from '@/lib/seo';
import { safeQuery } from '@/lib/server/safe';
import { getServerUser } from '@/lib/server/session';

import {
  areaKey,
  countRoomSeekers,
  getAreaRentStats,
  getListingCountsByArea,
  getListingCountsByKind,
} from '../server/repository';

import { AreaLinks, AreaPageShell, Breadcrumbs } from './area-ui';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const LATEST_COUNT = 12;

const PRIMARY =
  'rounded-[10px] bg-brand-terracotta px-4 py-2.5 text-[14px] font-bold text-white transition hover:bg-brand-terracotta-hover';
const SECONDARY =
  'rounded-[10px] border border-brand-border bg-white px-4 py-2.5 text-[14px] font-bold text-brand-ink transition hover:border-brand-terracotta hover:text-brand-terracotta';

/**
 * A city page, a neighbourhood page, or a city page for one kind of home. All are
 * validated by the route; kinds exist at city level only.
 */
export type AreaPageProps = { locale: Locale; citySlug: CityId } & (
  { neighborhoodSlug?: string; kind?: never } | { neighborhoodSlug?: never; kind: AreaKind }
);

function areaPath({ citySlug, kind, neighborhoodSlug }: AreaPageProps) {
  return (locale: Locale) =>
    kind
      ? routes.areaKind(locale, kind, citySlug)
      : routes.area(locale, citySlug, neighborhoodSlug);
}

function describeArea({ citySlug, locale, neighborhoodSlug }: AreaPageProps) {
  const city = cityLabels[citySlug][locale];
  const neighborhood = neighborhoodSlug ? getNeighborhood(citySlug, neighborhoodSlug) : undefined;
  const name = neighborhood ? `${neighborhood.label[locale]}, ${city}` : city;

  return { city, neighborhood, place: inPlace(locale, name), inCity: inPlace(locale, city) };
}

export async function areaMetadata(props: AreaPageProps): Promise<Metadata> {
  const { citySlug, kind, locale, neighborhoodSlug } = props;
  const t = await getTranslations({ locale, namespace: 'areas' });
  const { place } = describeArea(props);
  const stats = await safeQuery(getAreaRentStats(citySlug, neighborhoodSlug, kind), 'area stats');
  const title = kind ? t(`kinds.${kind}.metaTitle`, { place }) : t('metaTitle', { place });
  const hasRent = stats && stats.count > 0 && stats.medianRentCents !== null;
  const median = hasRent
    ? formatMoneyFromCents(stats.medianRentCents!, PLATFORM_CURRENCY, locale)
    : '';
  const description = kind
    ? hasRent
      ? t(`kinds.${kind}.metaDescription`, { count: stats.count, place, median })
      : t(`kinds.${kind}.metaDescriptionEmpty`, { place })
    : hasRent
      ? t('metaDescription', { count: stats.count, place, median })
      : t('metaDescriptionEmpty', { place });

  return {
    ...pageMetadata({ title, description, locale, path: areaPath(props) }),
    // An area with nothing listed is thin content: reachable and followed, not indexed.
    // A failed lookup says nothing either way, so it leaves indexing alone.
    robots: stats?.count === 0 ? { index: false, follow: true } : undefined,
  };
}

/**
 * The landing page for "rooms for rent in <area>": its own copy built from live numbers
 * (count, rent spread), the newest listings, the people looking for a room there, and
 * links to neighbouring areas, so each page has content a crawler can tell apart.
 */
export async function AreaPage(props: AreaPageProps) {
  const { citySlug, kind, locale, neighborhoodSlug } = props;
  const area = describeArea(props);
  const kindFilters = kind ? AREA_KIND_FILTERS[kind] : {};
  const [t, tListings, viewer] = await Promise.all([
    getTranslations({ locale, namespace: 'areas' }),
    getTranslations({ locale, namespace: 'listings' }),
    getServerUser(),
  ]);
  const query = listListingsQuerySchema.parse({
    citySlug,
    neighborhoodSlug,
    ...kindFilters,
    perPage: LATEST_COUNT,
  });

  const [stats, found, counts, kindCounts, seekers, mask] = await Promise.all([
    safeQuery(getAreaRentStats(citySlug, neighborhoodSlug, kind), 'area stats'),
    safeQuery(listPublishedListings(query), 'area listings'),
    safeQuery(getListingCountsByArea(), 'area counts'),
    neighborhoodSlug ? null : safeQuery(getListingCountsByKind(), 'area kind counts'),
    safeQuery(countRoomSeekers({ citySlug, neighborhoodSlug }), 'area seekers'),
    pageContactMasker(locale, Boolean(viewer)),
  ]);
  const latest = found?.items.map(mask.listing) ?? null;
  const savedIds =
    viewer && latest?.length
      ? await safeQuery(
          getSavedListingIds(
            viewer.id,
            latest.map((listing) => listing.id),
          ),
          'saved listings',
        )
      : null;

  const money = (cents: number) => formatMoneyFromCents(cents, PLATFORM_CURRENCY, locale);
  const total = stats?.count ?? found?.total ?? 0;
  const intro =
    !stats || stats.count === 0 || stats.medianRentCents === null
      ? null
      : stats.count === 1
        ? t('introSingle', { median: money(stats.medianRentCents) })
        : t('intro', {
            count: stats.count,
            min: money(stats.minRentCents!),
            max: money(stats.maxRentCents!),
            median: money(stats.medianRentCents),
          });

  const searchParams = new URLSearchParams({ citySlug, ...kindFilters });
  if (neighborhoodSlug) searchParams.set('neighborhoodSlug', neighborhoodSlug);

  // The city's other pages by kind, for the "browse by type" links (city level only).
  const kindLinks = neighborhoodSlug
    ? []
    : [
        ...(kind
          ? [
              {
                href: routes.area(locale, citySlug),
                label: t('allKinds'),
                count: counts ? (counts.cities.get(citySlug) ?? 0) : null,
              },
            ]
          : []),
        ...AREA_KINDS.filter((other) => other !== kind).map((other) => ({
          href: routes.areaKind(locale, other, citySlug),
          label: t(`kinds.${other}.label`),
          count: kindCounts ? (kindCounts[other].get(citySlug) ?? 0) : null,
        })),
        // A link to an empty page is a dead end; unknown counts (`null`) still link.
      ].filter((link) => link.count !== 0);

  const countFor = (neighborhoodId: string) =>
    counts?.neighborhoods.get(areaKey(citySlug, neighborhoodId)) ?? 0;
  const groups = getGroupedNeighborhoods(citySlug);
  const nearby = area.neighborhood
    ? (groups
        .find(({ group }) => group.id === area.neighborhood!.groupId)
        ?.neighborhoods.filter((item) => item.id !== area.neighborhood!.id) ?? [])
    : [];
  const linkTo = (neighborhoodId: string, label: string) => ({
    href: routes.area(locale, citySlug, neighborhoodId),
    label,
    count: counts ? countFor(neighborhoodId) : null,
  });

  const crumbs = [
    { name: 'Stay.bg', href: routes.home(locale) },
    { name: t('breadcrumb'), href: routes.areas(locale) },
    { name: area.city, href: routes.area(locale, citySlug) },
    ...(area.neighborhood
      ? [
          {
            name: area.neighborhood.label[locale],
            href: routes.area(locale, citySlug, neighborhoodSlug),
          },
        ]
      : []),
    ...(kind
      ? [{ name: t(`kinds.${kind}.label`), href: routes.areaKind(locale, kind, citySlug) }]
      : []),
  ];

  return (
    <>
      <BreadcrumbJsonLd
        items={crumbs.map((crumb) => ({ name: crumb.name, url: `${appUrl}${crumb.href}` }))}
      />

      <AreaPageShell>
        <Breadcrumbs items={crumbs} />

        <header className="max-w-3xl">
          <h1 className="font-serif text-[34px] font-medium leading-[1.1] tracking-[-0.02em] text-brand-ink sm:text-[42px]">
            {kind
              ? t(`kinds.${kind}.title`, { place: area.place })
              : t('title', { place: area.place })}
          </h1>
          {intro && <p className="mt-3 text-[16px] leading-7 text-brand-muted">{intro}</p>}

          <div className="mt-5 flex flex-wrap gap-3">
            {total > 0 && (
              <Link className={PRIMARY} href={routes.listings(locale, searchParams.toString())}>
                {t('seeAll', { count: total })}
              </Link>
            )}
            <Link className={SECONDARY} href={routes.findRoommate(locale, `citySlug=${citySlug}`)}>
              {t('findRoommate', { inCity: area.inCity })}
            </Link>
          </div>
        </header>

        {kindLinks.length > 0 && (
          <nav aria-labelledby="area-kinds" className="mt-6 max-w-3xl">
            <h2
              className="mb-2 text-[13px] font-bold uppercase tracking-wide text-brand-muted"
              id="area-kinds"
            >
              {t('byKind')}
            </h2>
            <AreaLinks items={kindLinks} locale={locale} />
          </nav>
        )}

        {seekers ? (
          <aside className="mt-6 flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-[15px] border border-brand-terracotta/30 bg-white px-5 py-4">
            <p className="text-[15px] font-bold text-brand-ink">
              {t('seekers', { count: seekers, place: area.place })}
            </p>
            <Link
              className="text-[14px] font-bold text-brand-terracotta hover:underline"
              href={routes.listProperty(locale)}
            >
              {t('seekersCta')} →
            </Link>
          </aside>
        ) : null}

        <section aria-labelledby="area-latest" className="mt-10">
          <h2
            className="mb-4 font-serif text-[26px] font-medium leading-none tracking-[-0.02em] text-brand-ink"
            id="area-latest"
          >
            {t('latest')}
          </h2>

          {latest === null ? (
            <StateMessage
              body={t('loadFailed')}
              title={tListings('search.errorTitle')}
              tone="error"
            />
          ) : latest.length === 0 ? (
            <StateMessage body={t('emptyBody')} title={t('emptyTitle')} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {latest.map((listing, index) => (
                <ListingCard
                  isAuthenticated={Boolean(viewer)}
                  isSaved={savedIds?.has(listing.id)}
                  key={listing.id}
                  listing={listing}
                  locale={locale}
                  priority={index < 4}
                  sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                />
              ))}
            </div>
          )}
        </section>

        {area.neighborhood ? (
          <section aria-labelledby="area-nearby" className="mt-12">
            <h2 className="mb-4 text-[18px] font-bold text-brand-ink" id="area-nearby">
              {t('nearby')}
            </h2>
            <AreaLinks
              items={nearby.map((item) => linkTo(item.id, item.label[locale]))}
              locale={locale}
            />
            <Link
              className="mt-5 inline-block text-[14px] font-bold text-brand-terracotta hover:underline"
              href={routes.area(locale, citySlug)}
            >
              {t('allOf', { city: area.city })} →
            </Link>
          </section>
        ) : (
          <section aria-labelledby="area-neighborhoods" className="mt-12">
            <h2 className="mb-4 text-[18px] font-bold text-brand-ink" id="area-neighborhoods">
              {t('neighborhoods', { inCity: area.inCity })}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map(({ group, neighborhoods }) => (
                <div key={group.id}>
                  <h3 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-brand-muted">
                    {group.label[locale]}
                  </h3>
                  <AreaLinks
                    items={neighborhoods.map((item) => linkTo(item.id, item.label[locale]))}
                    locale={locale}
                    stacked
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </AreaPageShell>
    </>
  );
}
