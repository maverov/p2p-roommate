import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import Link from 'next/link';
import SquiggleUnderline from '@/components/ui/SquiggleUnderline';
import { countPublishedListingsByCity } from '@/features/listings/server/repository';
import { getCityLabel, inPlace, type CityId } from '@/lib/areas';
import type { Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import { safeQuery } from '@/lib/server/safe';

/** The cities we have photos for; names come from `lib/areas`. */
const POPULAR_CITIES: ReadonlyArray<{ slug: CityId; imageSrc: string; imagePosition: string }> = [
  {
    slug: 'sofia',
    imageSrc: '/images/landing/sofia.jpg',
    imagePosition: 'center 45%',
  },
  {
    slug: 'plovdiv',
    imageSrc: '/images/landing/plovdiv.jpg',
    imagePosition: 'center 45%',
  },
  {
    slug: 'varna',
    imageSrc: '/images/landing/varna.jpg',
    imagePosition: 'center 50%',
  },
  {
    slug: 'burgas',
    imageSrc: '/images/landing/burgas.jpg',
    imagePosition: 'center 50%',
  },
  {
    slug: 'haskovo',
    imageSrc: '/images/landing/haskovo.jpg',
    imagePosition: 'center 45%',
  },
];

const CITY_LINK =
  'rounded-sm underline-offset-4 transition hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

export default async function PopularCities({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home.popularCities' });

  // Real counts rather than hardcoded copy; a failed count just hides the line.
  const counts = await safeQuery(countPublishedListingsByCity(), 'listing counts by city');

  const countLabel = (slug: string) => {
    const total = counts?.get(slug);

    return total === undefined ? null : t('listingCount', { count: total });
  };

  return (
    <section className="bg-brand-cream px-6 pb-14 pt-14 lg:px-10">
      <div className="mx-auto w-full max-w-[2000px]">
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-[32px] font-medium leading-none tracking-[-0.03em] text-brand-ink">
              {t('heading')}
            </h2>

            <SquiggleUnderline />
          </div>

          <Link
            href={routes.areas(locale)}
            className="text-md pt-2 font-medium text-brand-ink transition hover:text-brand-terracotta"
          >
            {t('viewAll')} →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {POPULAR_CITIES.map((city, index) => {
            const name = getCityLabel(city.slug, locale);
            const place = inPlace(locale, name);
            const listings = countLabel(city.slug);
            const cityHref = routes.area(locale, city.slug);
            const links = [
              {
                label: t('rooms'),
                ariaLabel: t('roomsIn', { place }),
                href: routes.listings(locale, `citySlug=${city.slug}&propertyType=ROOM`),
              },
              {
                label: t('homes'),
                ariaLabel: t('homesIn', { place }),
                href: routes.areaKind(locale, 'apartments', city.slug),
              },
              {
                label: t('roommates'),
                ariaLabel: t('roommatesIn', { place }),
                href: routes.findRoommate(locale, `citySlug=${city.slug}`),
              },
            ];

            return (
              <article
                key={city.slug}
                className="group relative overflow-hidden rounded-[15px] shadow-[0_8px_24px_rgba(75,55,35,0.10)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(75,55,35,0.16)]"
              >
                <div className="relative aspect-[3/2] w-full bg-brand-border">
                  <Image
                    src={city.imageSrc}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 20vw, (min-width: 640px) 50vw, 100vw"
                    priority={index < 2}
                    quality={85}
                    className="object-cover transition duration-500 group-hover:scale-105"
                    style={{ objectPosition: city.imagePosition }}
                  />

                  {/* Legibility gradient behind the overlaid text */}
                  <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                </div>

                {/* A click anywhere on the photo opens the city's page; keyboards use the links below. */}
                <Link
                  href={cityHref}
                  aria-hidden="true"
                  tabIndex={-1}
                  className="absolute inset-0"
                />

                <div className="pointer-events-none absolute inset-x-0 bottom-0 px-4 pb-3.5">
                  <h3 className="text-[17px] font-bold leading-6 text-white">{name}</h3>

                  {listings && (
                    <p className="mt-0.5 text-[13px] leading-4 text-white/85">{listings}</p>
                  )}

                  {/*
                    Every link carries its "|" on the left, pulled into a clipped margin: the
                    one starting each line (first, or after a wrap) is hidden, the rest show.
                  */}
                  <div className="pointer-events-auto -m-1 mt-1 overflow-hidden p-1">
                    <ul className="-ml-[17px] flex flex-wrap items-center text-[13px] font-semibold leading-5 text-white">
                      {links.map((link) => (
                        <li className="flex items-center" key={link.label}>
                          <span aria-hidden="true" className="w-[17px] text-center text-white/50">
                            |
                          </span>
                          <Link aria-label={link.ariaLabel} className={CITY_LINK} href={link.href}>
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
