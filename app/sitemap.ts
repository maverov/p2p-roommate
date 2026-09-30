import type { MetadataRoute } from 'next';

import { getListingCountsByArea } from '@/features/areas/server/repository';
import { listPublishedListingsForSitemap } from '@/features/listings/server/repository';
import { TEMPLATE_DOCS, TEMPLATE_SLUGS } from '@/features/templates/documents';
import { CITY_IDS, getNeighborhoodsByCity } from '@/lib/areas';
import { localeTag, locales, type Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import { safeQuery } from '@/lib/server/safe';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/** Regenerated at most hourly, so new listings appear without a deploy. */
export const revalidate = 3600;

/**
 * The sitemap protocol caps one file at 50,000 URLs, and every page is listed once per
 * locale. Past that, split the file with `generateSitemaps`.
 */
const MAX_URLS = 50_000;

type SitemapEntry = MetadataRoute.Sitemap[number];
type LocalizedPath = (locale: Locale) => string;

/** Indexable pages without an id. Filtered and tabbed variants are `noindex`, so never here. */
const STATIC_PAGES: Array<
  { path: LocalizedPath } & Pick<SitemapEntry, 'changeFrequency' | 'priority'>
> = [
  { path: routes.home, changeFrequency: 'daily', priority: 1 },
  { path: (locale) => routes.listings(locale), changeFrequency: 'hourly', priority: 0.9 },
  { path: routes.findRoommate, changeFrequency: 'daily', priority: 0.7 },
  { path: routes.safety, changeFrequency: 'yearly', priority: 0.3 },
  { path: routes.areas, changeFrequency: 'daily', priority: 0.7 },
  { path: routes.templates, changeFrequency: 'yearly', priority: 0.5 },
  ...TEMPLATE_DOCS.map((doc) => ({
    path: (locale: Locale) => routes.template(locale, TEMPLATE_SLUGS[doc]),
    changeFrequency: 'yearly' as const,
    priority: 0.5,
  })),
];

/** One entry per locale, each carrying the same hreflang set the page's own metadata declares. */
function localized(
  path: LocalizedPath,
  entry: Omit<SitemapEntry, 'url' | 'alternates'>,
): SitemapEntry[] {
  const languages = Object.fromEntries(
    locales.map((locale) => [localeTag[locale], `${appUrl}${path(locale)}`]),
  );

  return locales.map((locale) => ({
    ...entry,
    url: `${appUrl}${path(locale)}`,
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // A failed query still serves the static pages rather than a 500 crawlers would retry.
  const counts = await safeQuery(getListingCountsByArea(), 'sitemap areas');
  // Every city page, and the neighbourhood pages that have listings: the empty ones are
  // `noindex`, so listing them would only waste crawl budget.
  const areaPaths: LocalizedPath[] = CITY_IDS.flatMap((citySlug) => [
    (locale: Locale) => routes.area(locale, citySlug),
    ...getNeighborhoodsByCity(citySlug)
      .filter((item) => counts?.neighborhoods.get(`${citySlug}/${item.id}`))
      .map((item) => (locale: Locale) => routes.area(locale, citySlug, item.id)),
  ]);
  const listingLimit =
    Math.floor(MAX_URLS / locales.length) - STATIC_PAGES.length - areaPaths.length;
  const listings = await safeQuery(
    listPublishedListingsForSitemap(listingLimit),
    'sitemap listings',
  );

  return [
    ...STATIC_PAGES.flatMap(({ path, ...entry }) => localized(path, entry)),
    ...areaPaths.flatMap((path) => localized(path, { changeFrequency: 'daily', priority: 0.6 })),
    ...(listings ?? []).flatMap((listing) =>
      localized((locale) => routes.listing(locale, listing.id), {
        lastModified: listing.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.8,
      }),
    ),
  ];
}
