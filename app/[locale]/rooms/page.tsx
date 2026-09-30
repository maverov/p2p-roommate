import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AreaLinks, AreaPageShell, Breadcrumbs } from '@/features/areas/components/area-ui';
import { areaKey, getListingCountsByArea } from '@/features/areas/server/repository';
import { CITY_IDS, cityLabels, getNeighborhoodsByCity } from '@/lib/areas';
import { isLocale, type Locale } from '@/lib/i18n';
import { BreadcrumbJsonLd } from '@/lib/jsonld';
import { routes } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { safeQuery } from '@/lib/server/safe';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Nothing on the hub is per-viewer, so it is prerendered; the counts refresh hourly.
export const revalidate = 3600;

type AreasPageProps = {
  params: { locale: string };
};

export async function generateMetadata({ params }: AreasPageProps): Promise<Metadata> {
  if (!isLocale(params.locale)) notFound();

  const locale = params.locale;
  const t = await getTranslations({ locale, namespace: 'areas.hub' });

  return pageMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    locale,
    path: routes.areas,
  });
}

/** The hub: every city, with its neighbourhoods that have listings, busiest first. */
export default async function AreasPage({ params }: AreasPageProps) {
  if (!isLocale(params.locale)) notFound();

  const locale: Locale = params.locale;
  const [t, counts] = await Promise.all([
    getTranslations({ locale, namespace: 'areas' }),
    safeQuery(getListingCountsByArea(), 'area counts'),
  ]);
  const crumbs = [
    { name: 'Stay.bg', href: routes.home(locale) },
    { name: t('breadcrumb'), href: routes.areas(locale) },
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
            {t('hub.title')}
          </h1>
          <p className="mt-3 text-[16px] leading-7 text-brand-muted">{t('hub.intro')}</p>
        </header>

        <div className="mt-10 grid gap-8">
          {CITY_IDS.map((citySlug) => {
            const busiest = getNeighborhoodsByCity(citySlug)
              .map((item) => ({
                item,
                count: counts?.neighborhoods.get(areaKey(citySlug, item.id)) ?? 0,
              }))
              .filter(({ count }) => count > 0)
              .sort((a, b) => b.count - a.count);

            return (
              <section
                aria-labelledby={`hub-${citySlug}`}
                className="rounded-[15px] border border-brand-border bg-white p-6"
                key={citySlug}
              >
                <h2 className="flex flex-wrap items-baseline gap-3" id={`hub-${citySlug}`}>
                  <Link
                    className="font-serif text-[28px] font-medium leading-none text-brand-ink hover:text-brand-terracotta"
                    href={routes.area(locale, citySlug)}
                  >
                    {cityLabels[citySlug][locale]}
                  </Link>
                  {counts && (
                    <span className="text-[14px] text-brand-muted">
                      {t('listingCount', { count: counts.cities.get(citySlug) ?? 0 })}
                    </span>
                  )}
                </h2>

                {busiest.length > 0 && (
                  <>
                    <h3 className="mb-2 mt-5 text-[13px] font-bold uppercase tracking-wide text-brand-muted">
                      {t('hub.popular')}
                    </h3>
                    <AreaLinks
                      items={busiest.map(({ count, item }) => ({
                        href: routes.area(locale, citySlug, item.id),
                        label: item.label[locale],
                        count,
                      }))}
                      locale={locale}
                    />
                  </>
                )}

                <Link
                  className="mt-5 inline-block text-[14px] font-bold text-brand-terracotta hover:underline"
                  href={routes.area(locale, citySlug)}
                >
                  {t('allOf', { city: cityLabels[citySlug][locale] })} →
                </Link>
              </section>
            );
          })}
        </div>
      </AreaPageShell>
    </>
  );
}
