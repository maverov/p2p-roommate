import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import type { Metadata } from 'next';
import {
  BadgeCheck,
  BedDouble,
  Building2,
  CalendarDays,
  Check,
  Droplets,
  Layers,
  MapPin,
  Maximize2,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';

import { Avatar } from '@/components/shared/Avatar';
import { Rating } from '@/components/shared/Rating';
import { StateMessage } from '@/components/shared/StateMessage';
import { ContactOwnerPanel } from '@/features/listings/components/ContactOwnerPanel';
import { ListingCard } from '@/features/listings/components/ListingCard';
import { ListingGallery } from '@/features/listings/components/ListingGallery';
import { SaveListingButton } from '@/features/listings/components/SaveListingButton';
import {
  getPublishedListingById,
  getSavedListingIds,
  listSimilarListings,
} from '@/features/listings/server/repository';
import { getPublicProfile } from '@/features/profiles/server/repository';
import { listListingReviews } from '@/features/reviews/server/repository';
import { getCityLabel, getNeighborhoodLabel } from '@/lib/areas';
import {
  depositInMonths,
  formatDate,
  formatMoneyFromCents,
  formatMonthYear,
  responseTimeParts,
} from '@/lib/format';
import { isLocale, openGraphLocale, type Locale } from '@/lib/i18n';
import { BreadcrumbJsonLd, ListingJsonLd } from '@/lib/jsonld';
import { routes } from '@/lib/routes';
import { safeQuery } from '@/lib/server/safe';
import { getServerUser } from '@/lib/server/session';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const REVIEWS_ON_PAGE = 6;
const SIMILAR_ON_PAGE = 4;

type ListingPageProps = {
  params: {
    locale: string;
    id: string;
  };
};

/**
 * `generateMetadata` and the page body both need the listing; `cache` collapses
 * that into a single query per request.
 */
const loadListing = cache((id: string) => safeQuery(getPublishedListingById(id), `listing ${id}`));

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : 'bg';
  const listing = await loadListing(params.id);

  if (!listing) {
    const t = await getTranslations({ locale, namespace: 'listings.detail' });

    return { title: t('notFound'), robots: { index: false } };
  }

  const city = getCityLabel(listing.citySlug, locale);
  // The root layout's `%s | Stay.bg` template brands `metadata.title` for us, but
  // Open Graph and Twitter titles bypass that template, so they get it spelled out.
  const title = `${listing.title} — ${city}`;
  const socialTitle = `${title} | Stay.bg`;
  const description = listing.description.slice(0, 300);
  const url = `${appUrl}${routes.listing(locale, listing.id)}`;
  const image = listing.images[0]?.url ?? `${appUrl}/og-image.png`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        'bg-BG': `${appUrl}${routes.listing('bg', listing.id)}`,
        'en-US': `${appUrl}${routes.listing('en', listing.id)}`,
      },
    },
    openGraph: {
      title: socialTitle,
      description,
      url,
      type: 'website',
      locale: openGraphLocale[locale],
      images: [{ url: image, width: 1200, height: 630, alt: listing.title }],
    },
    twitter: { card: 'summary_large_image', title: socialTitle, description, images: [image] },
  };
}

export default async function ListingDetailPage({ params }: ListingPageProps) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const locale: Locale = params.locale;
  const t = await getTranslations({ locale, namespace: 'listings' });
  const tEnums = await getTranslations({ locale, namespace: 'enums' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const listing = await loadListing(params.id);

  if (!listing) {
    notFound();
  }

  const viewer = await getServerUser();
  const isOwner = viewer?.id === listing.ownerId;

  // Enrichment runs in parallel and degrades independently of the main record.
  const [reviews, similar, ownerProfile, savedIds] = await Promise.all([
    safeQuery(
      listListingReviews(listing.id, { page: 1, perPage: REVIEWS_ON_PAGE }),
      'listing reviews',
    ),
    safeQuery(listSimilarListings(listing.id, SIMILAR_ON_PAGE), 'similar listings'),
    safeQuery(getPublicProfile(listing.ownerId), 'owner profile'),
    viewer
      ? safeQuery(getSavedListingIds(viewer.id, [listing.id]), 'saved listings')
      : null,
  ]);

  const city = getCityLabel(listing.citySlug, locale);
  const neighborhood = getNeighborhoodLabel(listing.citySlug, listing.neighborhoodSlug, locale);
  const depositMonths = listing.depositCents
    ? depositInMonths(listing.depositCents, listing.monthlyRentCents)
    : null;
  const availableNow =
    listing.availableFrom === null || listing.availableFrom.getTime() <= Date.now();

  const facts = [
    {
      icon: Building2,
      label: t('detail.facts.propertyType'),
      value: tEnums(`propertyType.${listing.propertyType}`),
    },
    {
      icon: BedDouble,
      label: t('detail.facts.rooms'),
      value: String(listing.bedroomCount),
    },
    {
      icon: Droplets,
      label: t('detail.facts.bathrooms'),
      value: String(listing.bathroomCount),
    },
    listing.sizeSqm !== null && {
      icon: Maximize2,
      label: t('detail.facts.size'),
      value: `${listing.sizeSqm} м²`,
    },
    listing.floor !== null && {
      icon: Layers,
      label: t('detail.facts.floor'),
      value:
        listing.totalFloors !== null
          ? t('detail.facts.floorOf', { floor: listing.floor, total: listing.totalFloors })
          : String(listing.floor),
    },
    {
      icon: UsersRound,
      label: t('detail.facts.occupants'),
      value: t('detail.facts.occupantsValue', { count: listing.maxOccupants }),
    },
  ].filter((fact): fact is { icon: typeof Building2; label: string; value: string } =>
    Boolean(fact),
  );

  const terms = [
    listing.isFurnished && t('detail.included.furnished'),
    listing.internetIncluded && t('detail.included.internet'),
    listing.utilitiesIncluded && t('detail.included.utilities'),
    listing.petsAllowed && t('detail.included.pets'),
    listing.nearMetro && t('detail.included.nearMetro'),
    listing.roommateFriendly && t('detail.included.roommateFriendly'),
  ].filter((term): term is string => Boolean(term));

  const breadcrumbItems = [
    { name: 'Stay.bg', url: `${appUrl}${routes.home(locale)}` },
    { name: t('common.listings'), url: `${appUrl}${routes.listings(locale)}` },
    { name: city, url: `${appUrl}${routes.listings(locale, `citySlug=${listing.citySlug}`)}` },
    { name: listing.title, url: `${appUrl}${routes.listing(locale, listing.id)}` },
  ];

  return (
    <>
      <ListingJsonLd
        appUrl={appUrl}
        listing={{
          id: listing.id,
          title: listing.title,
          description: listing.description,
          city,
          address: neighborhood ?? city,
          monthlyRent: Math.round(listing.monthlyRentCents / 100),
          currency: listing.currency,
          bedroomCount: listing.bedroomCount,
          bathroomCount: listing.bathroomCount,
          sizeSqm: listing.sizeSqm ?? undefined,
          image: listing.images[0]?.url,
          url: `${appUrl}${routes.listing(locale, listing.id)}`,
        }}
      />
      <BreadcrumbJsonLd items={breadcrumbItems} />

      <main className="min-h-screen bg-brand-cream text-brand-ink" id="main-content">
        <div className="mx-auto w-full max-w-[1400px] px-6 pb-16 pt-6 lg:px-10">
          <nav aria-label="Breadcrumb" className="mb-4 text-[13px] text-brand-muted">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link className="hover:text-brand-terracotta" href={routes.home(locale)}>
                  Stay.bg
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link className="hover:text-brand-terracotta" href={routes.listings(locale)}>
                  {t('common.listings')}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  className="hover:text-brand-terracotta"
                  href={routes.listings(locale, `citySlug=${listing.citySlug}`)}
                >
                  {city}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="line-clamp-1 text-brand-ink">
                {listing.title}
              </li>
            </ol>
          </nav>

          <ListingGallery images={listing.images} locale={locale} />

          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_364px] lg:gap-8">
            <div className="min-w-0">
              <header>
                <p className="flex items-center gap-1.5 text-[14px] font-medium text-brand-terracotta">
                  <MapPin aria-hidden="true" size={15} strokeWidth={2} />
                  {neighborhood ? `${neighborhood}, ${city}` : city}
                </p>

                <h1 className="mt-2 font-serif text-[34px] font-medium leading-[1.15] tracking-[-0.02em] text-brand-ink sm:text-[40px]">
                  {listing.title}
                </h1>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                  {reviews && reviews.summary.averageRating !== null && (
                    <Rating
                      caption={t('detail.reviewCount', { count: reviews.summary.reviewCount })}
                      locale={locale}
                      value={reviews.summary.averageRating}
                    />
                  )}

                  {listing.isVerified && (
                    <span className="flex items-center gap-1.5 rounded-full bg-[#f2f4e2] px-2.5 py-1 text-[12px] font-bold text-brand-olive">
                      <ShieldCheck aria-hidden="true" size={13} strokeWidth={2.4} />
                      {t('common.verified')}
                    </span>
                  )}
                </div>
              </header>

              <dl className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {facts.map((fact) => (
                  <div
                    className="rounded-[12px] border border-brand-border bg-white px-3.5 py-3"
                    key={fact.label}
                  >
                    <dt className="flex items-center gap-1.5 text-[12px] font-medium text-brand-muted">
                      <fact.icon aria-hidden="true" size={13} strokeWidth={1.9} />
                      {fact.label}
                    </dt>
                    <dd className="mt-0.5 text-[15px] font-bold text-brand-ink">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>

              {terms.length > 0 && (
                <Section title={t('detail.included.heading')}>
                  <ul className="flex flex-wrap gap-2">
                    {terms.map((term) => (
                      <li
                        className="flex items-center gap-1.5 rounded-full border border-brand-border bg-white px-3 py-1.5 text-[13px] text-brand-ink"
                        key={term}
                      >
                        <Check
                          aria-hidden="true"
                          className="text-brand-olive"
                          size={14}
                          strokeWidth={2.4}
                        />
                        {term}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              <Section title={t('detail.about')}>
                <div className="max-w-3xl space-y-3 text-[15px] leading-7 text-brand-muted">
                  {listing.description.split('\n').filter(Boolean).map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </Section>

              {(listing.amenities.length > 0 || listing.rules.length > 0) && (
                <div className="mt-10 grid gap-8 sm:grid-cols-2">
                  {listing.amenities.length > 0 && (
                    <ListBlock items={listing.amenities} title={t('detail.amenities')} />
                  )}

                  {listing.rules.length > 0 && (
                    <ListBlock items={listing.rules} title={t('detail.rules')} />
                  )}
                </div>
              )}

              <Section title={t('detail.location')}>
                <div className="rounded-[15px] border border-brand-border bg-white p-5">
                  <p className="flex items-center gap-2 text-[15px] font-bold text-brand-ink">
                    <MapPin aria-hidden="true" size={16} strokeWidth={2} />
                    {[listing.addressLine, neighborhood, city].filter(Boolean).join(', ')}
                  </p>

                  <p className="mt-2 text-[13px] leading-6 text-brand-muted">
                    {t('detail.locationNote')}
                  </p>

                  <p className="mt-3 text-[13px] text-brand-muted">
                    {t('detail.facts.roommatePreference')}:{' '}
                    <span className="font-bold text-brand-ink">
                      {tEnums(`roommatePreference.${listing.roommatePreference}`)}
                    </span>
                  </p>
                </div>
              </Section>

              <Section title={t('detail.owner')}>
                {ownerProfile ? (
                  <div className="rounded-[15px] border border-brand-border bg-white p-5">
                    <div className="flex items-start gap-4">
                      <Avatar
                        name={ownerProfile.displayName}
                        size={56}
                        src={ownerProfile.avatarUrl}
                      />

                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 text-[16px] font-bold text-brand-ink">
                          {ownerProfile.displayName}
                          {ownerProfile.isVerified && (
                            <BadgeCheck
                              aria-label={t('common.verified')}
                              className="text-brand-olive"
                              size={16}
                              strokeWidth={2.2}
                            />
                          )}
                        </p>

                        {ownerProfile.reviews.averageRating !== null && (
                          <Rating
                            caption={t('detail.reviewCount', { count: ownerProfile.reviews.reviewCount })}
                            className="mt-1"
                            locale={locale}
                            value={ownerProfile.reviews.averageRating}
                          />
                        )}

                        {ownerProfile.bio && (
                          <p className="mt-2 line-clamp-3 text-[14px] leading-6 text-brand-muted">
                            {ownerProfile.bio}
                          </p>
                        )}
                      </div>
                    </div>

                    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-brand-border pt-4 text-[13px] sm:grid-cols-4">
                      <Stat
                        label={t('detail.respondsIn')}
                        value={responseTime(ownerProfile.responseTimeMinutes, tCommon)}
                      />
                      <Stat
                        label={t('detail.responseRate')}
                        value={`${ownerProfile.responseRate}%`}
                      />
                      <Stat
                        label={t('detail.successfulRentals')}
                        value={String(ownerProfile.successfulRentals)}
                      />
                      {ownerProfile.joinedAt && (
                        <Stat
                          label={t('detail.memberSince')}
                          value={formatMonthYear(ownerProfile.joinedAt, locale)}
                        />
                      )}
                    </dl>

                    <Link
                      className="mt-4 inline-block text-[14px] font-bold text-brand-terracotta underline-offset-2 hover:underline"
                      href={routes.profile(locale, listing.ownerId)}
                    >
                      {t('detail.viewProfile')} →
                    </Link>
                  </div>
                ) : (
                  <StateMessage
                    body={t('common.loadFailed')}
                    title={t('detail.owner')}
                    tone="error"
                  />
                )}
              </Section>

              <Section
                title={
                  reviews && reviews.summary.reviewCount > 0
                    ? `${t('detail.reviews')} · ${t('detail.reviewCount', { count: reviews.summary.reviewCount })}`
                    : t('detail.reviews')
                }
              >
                {!reviews ? (
                  <StateMessage body={t('common.loadFailed')} title={t('detail.reviews')} tone="error" />
                ) : reviews.items.length === 0 ? (
                  <StateMessage title={t('detail.noReviews')} />
                ) : (
                  <ul className="grid gap-3">
                    {reviews.items.map((review) => (
                      <li
                        className="rounded-[15px] border border-brand-border bg-white p-5"
                        key={review.id}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar name={review.reviewer.name} size={38} src={review.reviewer.image} />

                          <div className="min-w-0">
                            <p className="text-[14px] font-bold text-brand-ink">
                              {review.reviewer.name}
                            </p>
                            <p className="text-[12px] text-brand-muted">
                              {tEnums(`reviewerRole.${review.reviewerRole}`)} ·{' '}
                              {formatDate(review.createdAt, locale)}
                            </p>
                          </div>

                          <Rating className="ml-auto" locale={locale} size={13} value={review.rating} />
                        </div>

                        <p className="mt-3 text-[14px] leading-6 text-brand-muted">{review.body}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </div>

            <aside className="lg:sticky lg:top-6 lg:h-fit">
              <div className="rounded-[15px] border border-brand-border bg-white p-5 shadow-[0_16px_48px_rgba(48,51,41,0.10)]">
                <p className="flex items-baseline gap-1.5">
                  <span className="text-[30px] font-bold leading-none text-brand-terracotta">
                    {formatMoneyFromCents(listing.monthlyRentCents, listing.currency, locale)}
                  </span>
                  <span className="text-[14px] font-medium text-brand-muted">
                    {t('common.perMonth')}
                  </span>
                </p>

                <dl className="mt-4 grid gap-2.5 border-t border-brand-border pt-4 text-[14px]">
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-brand-muted">{t('detail.deposit')}</dt>
                    <dd className="text-right font-bold text-brand-ink">
                      {listing.depositCents
                        ? formatMoneyFromCents(listing.depositCents, listing.currency, locale)
                        : t('detail.noDeposit')}
                      {depositMonths && (
                        <span className="ml-1 font-medium text-brand-muted">
                          ({t('detail.depositMonths', { months: depositMonths })})
                        </span>
                      )}
                    </dd>
                  </div>

                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="flex items-center gap-1.5 text-brand-muted">
                      <CalendarDays aria-hidden="true" size={14} strokeWidth={1.9} />
                      {t('detail.availableFrom')}
                    </dt>
                    <dd className="text-right font-bold text-brand-ink">
                      {availableNow
                        ? t('detail.availableNow')
                        : formatDate(listing.availableFrom!, locale)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-5 grid gap-2">
                  <ContactOwnerPanel
                    isAuthenticated={Boolean(viewer)}
                    isOwner={isOwner}
                    listingId={listing.id}
                    locale={locale}
                    ownerId={listing.ownerId}
                  />

                  <SaveListingButton
                    initialSaved={savedIds?.has(listing.id) ?? false}
                    isAuthenticated={Boolean(viewer)}
                    listingId={listing.id}
                    listingTitle={listing.title}
                    locale={locale}
                    variant="inline"
                  />
                </div>
              </div>
            </aside>
          </div>

          <Section title={t('detail.similar')}>
            {!similar ? (
              <StateMessage body={t('common.loadFailed')} title={t('detail.similar')} tone="error" />
            ) : similar.length === 0 ? (
              <StateMessage title={t('detail.noSimilar')} />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {similar.map((item) => (
                  <ListingCard
                    isAuthenticated={Boolean(viewer)}
                    key={item.id}
                    listing={item}
                    locale={locale}
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  />
                ))}
              </div>
            )}
          </Section>
        </div>
      </main>
    </>
  );
}

/** Picks the unit, then lets the catalogue's plural rules do the wording. */
function responseTime(
  minutes: number,
  tCommon: Awaited<ReturnType<typeof getTranslations<'common'>>>,
) {
  const { unit, value } = responseTimeParts(minutes);

  return tCommon(`duration.${unit}`, { value });
}

function Section({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="mt-10">
      <h2 className="mb-4 font-serif text-[26px] font-medium leading-none tracking-[-0.02em] text-brand-ink">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ListBlock({ items, title }: { items: string[]; title: string }) {
  return (
    <div>
      <h3 className="text-[16px] font-bold text-brand-ink">{title}</h3>
      <ul className="mt-3 grid gap-2 text-[14px] leading-6 text-brand-muted">
        {items.map((item) => (
          <li className="flex items-start gap-2" key={item}>
            <Check
              aria-hidden="true"
              className="mt-1 shrink-0 text-brand-olive"
              size={14}
              strokeWidth={2.4}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-brand-muted">{label}</dt>
      <dd className="mt-0.5 font-bold text-brand-ink">{value}</dd>
    </div>
  );
}
