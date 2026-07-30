import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import type { Metadata } from 'next';
import {
  BadgeCheck,
  CalendarDays,
  Languages,
  MapPin,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import { Avatar } from '@/components/shared/Avatar';
import { Rating } from '@/components/shared/Rating';
import { StateMessage } from '@/components/shared/StateMessage';
import { ListingCard } from '@/features/listings/components/ListingCard';
import { getSavedListingIds } from '@/features/listings/server/repository';
import { ContactProfilePanel } from '@/features/profiles/components/ContactProfilePanel';
import { SaveProfileButton } from '@/features/profiles/components/SaveProfileButton';
import { parseRoommatePreferences } from '@/features/profiles/schemas';
import {
  getPublicProfile,
  isProfileSaved,
  listProfileListings,
} from '@/features/profiles/server/repository';
import { listUserReviews } from '@/features/reviews/server/repository';
import { getCityLabel, getNeighborhoodLabel } from '@/lib/areas';
import {
  formatDate,
  formatMoneyFromCents,
  formatMonthYear,
  responseTimeParts,
} from '@/lib/format';
import { isLocale, localeTag, openGraphLocale, type Locale } from '@/lib/i18n';
import { BreadcrumbJsonLd, ProfileJsonLd } from '@/lib/jsonld';
import { routes } from '@/lib/routes';
import { safeQuery, tryQuery } from '@/lib/server/safe';
import { getServerUser } from '@/lib/server/session';
import { cn } from '@/utils';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const REVIEWS_PER_PAGE = 8;

/**
 * Roommate budgets are stored as bare cents with no currency, and every listing
 * on the platform is priced in BGN, so that is what they are rendered in.
 */
const PREFERENCE_CURRENCY = 'BGN';

const PROFILE_TABS = ['about', 'listings', 'reviews', 'preferences'] as const;

type ProfileTab = (typeof PROFILE_TABS)[number];

/** `about` doubles as the fallback, so a hand-edited `?tab=` never 404s. */
function resolveTab(value?: string): ProfileTab {
  return PROFILE_TABS.includes(value as ProfileTab) ? (value as ProfileTab) : 'about';
}

function resolvePage(value?: string) {
  const page = Number(value);

  return Number.isInteger(page) && page > 0 ? Math.min(page, 10_000) : 1;
}

/** The tab lives in the query string, so the default tab keeps the clean URL. */
function tabHref(locale: Locale, id: string, tab: ProfileTab) {
  return routes.profile(locale, id, tab === 'about' ? undefined : `tab=${tab}`);
}

type ProfilePageProps = {
  params: {
    locale: string;
    id: string;
  };
  searchParams: {
    tab?: string;
    page?: string;
  };
};

/**
 * `generateMetadata` and the page body both need the profile; `cache` collapses
 * that into a single query per request.
 */
const loadProfile = cache((id: string) =>
  tryQuery(getPublicProfile(id), `profile ${id}`),
);

export async function generateMetadata({
  params,
  searchParams,
}: ProfilePageProps): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : 'bg';
  const t = await getTranslations({ locale, namespace: 'profiles' });
  const outcome = await loadProfile(params.id);

  if (outcome.status !== 'ok') {
    return { title: t('notFound'), robots: { index: false } };
  }

  const profile = outcome.data;
  // The root layout's `%s | Stay.bg` template brands `metadata.title` for us, but
  // Open Graph and Twitter titles bypass that template, so they get it spelled out.
  const title = profile.displayName;
  const socialTitle = `${title} | Stay.bg`;
  const description =
    profile.bio?.slice(0, 300) ??
    `${profile.displayName} — ${t('stats.activeListings')}: ${profile.activeListingCount}.`;
  const url = `${appUrl}${routes.profile(locale, profile.userId)}`;

  return {
    title,
    description,
    alternates: {
      // Tabs are the same profile sliced differently, so they all canonicalise
      // to the clean URL.
      canonical: url,
      languages: {
        'bg-BG': `${appUrl}${routes.profile('bg', profile.userId)}`,
        'en-US': `${appUrl}${routes.profile('en', profile.userId)}`,
      },
    },
    robots: resolveTab(searchParams.tab) === 'about' ? undefined : { index: false, follow: true },
    openGraph: {
      title: socialTitle,
      description,
      url,
      type: 'profile',
      locale: openGraphLocale[locale],
      images: profile.avatarUrl ? [{ url: profile.avatarUrl, alt: profile.displayName }] : undefined,
    },
  };
}

export default async function ProfilePage({ params, searchParams }: ProfilePageProps) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const locale: Locale = params.locale;
  const t = await getTranslations({ locale, namespace: 'profiles' });
  const outcome = await loadProfile(params.id);

  if (outcome.status === 'missing') {
    notFound();
  }

  if (outcome.status === 'failed') {
    return (
      <PageShell>
        <StateMessage
          action={
            <Link
              className="rounded-[10px] bg-brand-terracotta px-5 py-2.5 text-[14px] font-bold text-white transition hover:bg-brand-terracotta-hover"
              href={routes.listings(locale)}
            >
              {t('backToListings')}
            </Link>
          }
          body={t('common.loadFailed')}
          title={t('notFound')}
          tone="error"
        />
      </PageShell>
    );
  }

  const profile = outcome.data;
  const tab = resolveTab(searchParams.tab);
  const reviewsPage = resolvePage(searchParams.page);
  const viewer = await getServerUser();
  const isOwnProfile = viewer?.id === profile.userId;

  // The listing list feeds both the listings tab and the contact panel's picker,
  // so it is fetched on every tab; the rest is scoped to the tab being rendered.
  const [listings, reviews, savedProfile] = await Promise.all([
    safeQuery(listProfileListings(profile.userId), `profile listings ${profile.userId}`),
    tab === 'reviews'
      ? safeQuery(
          listUserReviews(profile.userId, { page: reviewsPage, perPage: REVIEWS_PER_PAGE }),
          `profile reviews ${profile.userId}`,
        )
      : null,
    viewer && !isOwnProfile
      ? safeQuery(isProfileSaved(viewer.id, profile.userId), 'saved profile')
      : null,
  ]);

  const savedListingIds =
    tab === 'listings' && viewer && listings && listings.length > 0
      ? await safeQuery(
          getSavedListingIds(
            viewer.id,
            listings.map((listing) => listing.id),
          ),
          'saved listings',
        )
      : null;

  const city = getCityLabel(profile.citySlug, locale);
  const neighborhood = getNeighborhoodLabel(profile.citySlug, profile.neighborhoodSlug, locale);
  const location = profile.citySlug ? [neighborhood, city].filter(Boolean).join(', ') : null;

  const stats = [
    { label: t('stats.activeListings'), value: String(profile.activeListingCount) },
    {
      label: t('stats.respondsIn'),
      value: await responseTime(profile.responseTimeMinutes, locale),
    },
    { label: t('stats.responseRate'), value: `${profile.responseRate}%` },
    { label: t('stats.successfulRentals'), value: String(profile.successfulRentals) },
  ];

  const breadcrumbItems = [
    { name: 'Stay.bg', url: `${appUrl}${routes.home(locale)}` },
    { name: profile.displayName, url: `${appUrl}${routes.profile(locale, profile.userId)}` },
  ];

  return (
    <>
      <ProfileJsonLd
        profile={{
          name: profile.displayName,
          url: `${appUrl}${routes.profile(locale, profile.userId)}`,
          description: profile.bio,
          image: profile.avatarUrl,
          ratingValue: profile.reviews.averageRating,
          reviewCount: profile.reviews.reviewCount,
        }}
      />
      <BreadcrumbJsonLd items={breadcrumbItems} />

      <PageShell>
        <nav aria-label="Breadcrumb" className="mb-4 text-[13px] text-brand-muted">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link className="hover:text-brand-terracotta" href={routes.home(locale)}>
                Stay.bg
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-brand-ink">
              {profile.displayName}
            </li>
          </ol>
        </nav>

        <header className="rounded-[15px] border border-brand-border bg-white p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <Avatar name={profile.displayName} priority size={88} src={profile.avatarUrl} />

            <div className="min-w-0 flex-1">
              <h1 className="flex flex-wrap items-center gap-2 font-serif text-[32px] font-medium leading-[1.15] tracking-[-0.02em] text-brand-ink sm:text-[36px]">
                {profile.displayName}

                {profile.isVerified && (
                  <BadgeCheck
                    aria-label={t('common.verified')}
                    className="text-brand-olive"
                    size={24}
                    strokeWidth={2.2}
                  />
                )}
              </h1>

              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-brand-muted">
                {location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin aria-hidden="true" size={14} strokeWidth={2} />
                    {location}
                  </span>
                )}

                {profile.joinedAt && (
                  <span className="flex items-center gap-1.5">
                    <CalendarDays aria-hidden="true" size={14} strokeWidth={1.9} />
                    {t('memberSince')} {formatMonthYear(profile.joinedAt, locale)}
                  </span>
                )}

                {profile.reviews.averageRating !== null && (
                  <Rating
                    caption={t('reviewCount', { count: profile.reviews.reviewCount })}
                    locale={locale}
                    value={profile.reviews.averageRating}
                  />
                )}
              </div>
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-brand-border pt-5 text-[13px] sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="text-brand-muted">{stat.label}</dt>
                <dd className="mt-0.5 text-[16px] font-bold text-brand-ink">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </header>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_344px] lg:gap-8">
          <div className="min-w-0">
            {/*
              Tabs are real links carrying `?tab=`, not client state: each section
              is shareable, the back button works, and only the visible tab's data
              is queried on the server.
            */}
            <nav aria-label={t('tabsLabel')}>
              <ul className="flex flex-wrap items-center gap-1 border-b border-brand-border">
                {PROFILE_TABS.map((item) => (
                  <li key={item}>
                    <Link
                      aria-current={item === tab ? 'page' : undefined}
                      className={cn(
                        '-mb-px inline-block border-b-2 px-3.5 py-2.5 text-[14px] font-bold transition',
                        item === tab
                          ? 'border-brand-terracotta text-brand-terracotta'
                          : 'border-transparent text-brand-muted hover:text-brand-ink',
                      )}
                      href={tabHref(locale, profile.userId, item)}
                      scroll={false}
                    >
                      {t(`tabs.${item}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="pt-6">
              {tab === 'about' && <AboutTab locale={locale} profile={profile} />}

              {tab === 'listings' && (
                <ListingsTab
                  isAuthenticated={Boolean(viewer)}
                  listings={listings}
                  locale={locale}
                  savedListingIds={savedListingIds}
                />
              )}

              {tab === 'reviews' && (
                <ReviewsTab
                  locale={locale}
                  page={reviewsPage}
                  profileUserId={profile.userId}
                  reviews={reviews}
                />
              )}

              {tab === 'preferences' && (
                <PreferencesTab locale={locale} profile={profile} />
              )}
            </div>
          </div>

          <aside className="lg:sticky lg:top-6 lg:h-fit">
            <div className="rounded-[15px] border border-brand-border bg-white p-5 shadow-[0_16px_48px_rgba(48,51,41,0.10)]">
              <h2 className="text-[16px] font-bold text-brand-ink">{t('contact.heading')}</h2>

              <div className="mt-4 grid gap-2">
                <ContactProfilePanel
                  isAuthenticated={Boolean(viewer)}
                  isOwnProfile={isOwnProfile}
                  listings={
                    listings
                      ? listings.map((listing) => ({ id: listing.id, title: listing.title }))
                      : null
                  }
                  locale={locale}
                  profileUserId={profile.userId}
                />

                {!isOwnProfile && (
                  <SaveProfileButton
                    displayName={profile.displayName}
                    initialSaved={savedProfile ?? false}
                    isAuthenticated={Boolean(viewer)}
                    locale={locale}
                    profileUserId={profile.userId}
                  />
                )}
              </div>
            </div>
          </aside>
        </div>
      </PageShell>
    </>
  );
}

type PublicProfile = Awaited<ReturnType<typeof getPublicProfile>>;

/**
 * Each tab resolves its own translator instead of receiving one as a prop:
 * next-intl memoises the request config, so this is a map lookup, not a reload.
 */
async function profileTranslations(locale: Locale) {
  return getTranslations({ locale, namespace: 'profiles' });
}

/** Picks the unit, then lets the catalogue's plural rules do the wording. */
async function responseTime(minutes: number, locale: Locale) {
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const { unit, value } = responseTimeParts(minutes);

  return tCommon(`duration.${unit}`, { value });
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-brand-cream text-brand-ink" id="main-content">
      <div className="mx-auto w-full max-w-[1400px] px-6 pb-16 pt-6 lg:px-10">{children}</div>
    </main>
  );
}

async function AboutTab({ locale, profile }: { locale: Locale; profile: PublicProfile }) {
  const t = await profileTranslations(locale);

  const verifications = [
    profile.isVerified && t('about.profileVerified'),
    profile.identityVerified && t('about.identityVerified'),
    profile.phoneVerified && t('about.phoneVerified'),
    profile.emailVerified && t('about.emailVerified'),
  ].filter((item): item is string => Boolean(item));

  return (
    <div className="grid gap-8">
      <section>
        <h2 className="text-[18px] font-bold text-brand-ink">{t('about.heading')}</h2>

        {profile.bio ? (
          <div className="mt-3 max-w-3xl space-y-3 text-[15px] leading-7 text-brand-muted">
            {profile.bio
              .split('\n')
              .filter(Boolean)
              .map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
          </div>
        ) : (
          <p className="mt-3 text-[15px] leading-7 text-brand-muted">{t('about.noBio')}</p>
        )}
      </section>

      {profile.traits.length > 0 && (
        <section>
          <h3 className="flex items-center gap-2 text-[16px] font-bold text-brand-ink">
            <Sparkles aria-hidden="true" size={16} strokeWidth={1.9} />
            {t('about.traits')}
          </h3>

          <ul className="mt-3 flex flex-wrap gap-2">
            {profile.traits.map((trait) => (
              <li
                className="rounded-full border border-brand-border bg-white px-3 py-1.5 text-[13px] text-brand-ink"
                key={trait}
              >
                {trait}
              </li>
            ))}
          </ul>
        </section>
      )}

      {profile.languages.length > 0 && (
        <section>
          <h3 className="flex items-center gap-2 text-[16px] font-bold text-brand-ink">
            <Languages aria-hidden="true" size={16} strokeWidth={1.9} />
            {t('about.languages')}
          </h3>

          <p className="mt-2 text-[15px] leading-6 text-brand-muted">
            {/* Locale-aware list joining — "и" in Bulgarian, "and" in English. */}
            {new Intl.ListFormat(localeTag[locale], {
              style: 'long',
              type: 'conjunction',
            }).format(profile.languages)}
          </p>
        </section>
      )}

      <section>
        <h3 className="flex items-center gap-2 text-[16px] font-bold text-brand-ink">
          <ShieldCheck aria-hidden="true" size={16} strokeWidth={1.9} />
          {t('about.verification')}
        </h3>

        {verifications.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {verifications.map((item) => (
              <li
                className="flex items-center gap-1.5 rounded-full bg-[#f2f4e2] px-3 py-1.5 text-[13px] font-bold text-brand-olive"
                key={item}
              >
                <BadgeCheck aria-hidden="true" size={14} strokeWidth={2.2} />
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[14px] leading-6 text-brand-muted">
            {t('about.notVerifiedYet')}
          </p>
        )}
      </section>
    </div>
  );
}

async function ListingsTab({
  isAuthenticated,
  listings,
  locale,
  savedListingIds,
}: {
  isAuthenticated: boolean;
  listings: Awaited<ReturnType<typeof listProfileListings>> | null;
  locale: Locale;
  savedListingIds: Set<string> | null;
}) {
  const t = await profileTranslations(locale);

  if (!listings) {
    return (
      <StateMessage body={t('common.loadFailed')} title={t('listings.heading')} tone="error" />
    );
  }

  if (listings.length === 0) {
    return <StateMessage body={t('listings.emptyBody')} title={t('listings.empty')} />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {listings.map((listing, index) => (
        <ListingCard
          isAuthenticated={isAuthenticated}
          isSaved={savedListingIds?.has(listing.id) ?? false}
          key={listing.id}
          listing={listing}
          locale={locale}
          priority={index < 3}
          sizes="(min-width: 1280px) 25vw, (min-width: 640px) 40vw, 100vw"
        />
      ))}
    </div>
  );
}

async function ReviewsTab({
  locale,
  page,
  profileUserId,
  reviews,
}: {
  locale: Locale;
  page: number;
  profileUserId: string;
  reviews: Awaited<ReturnType<typeof listUserReviews>> | null;
}) {
  const t = await profileTranslations(locale);
  const tEnums = await getTranslations({ locale, namespace: 'enums' });

  if (!reviews) {
    return <StateMessage body={t('common.loadFailed')} title={t('reviews.heading')} tone="error" />;
  }

  if (reviews.items.length === 0) {
    return <StateMessage body={t('reviews.emptyBody')} title={t('reviews.empty')} />;
  }

  const totalPages = Math.max(1, Math.ceil(reviews.total / reviews.perPage));

  return (
    <div>
      <ul className="grid gap-3">
        {reviews.items.map((review) => (
          <li className="rounded-[15px] border border-brand-border bg-white p-5" key={review.id}>
            <div className="flex items-center gap-3">
              <Avatar name={review.reviewer.name} size={38} src={review.reviewer.image} />

              <div className="min-w-0">
                <p className="text-[14px] font-bold text-brand-ink">{review.reviewer.name}</p>
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

      {totalPages > 1 && (
        <nav
          aria-label={t('reviews.heading')}
          className="mt-6 flex items-center justify-between gap-4"
        >
          {/* Real anchors, so a review page is linkable like any other URL. */}
          {page > 1 ? (
            <Link
              className="rounded-[10px] border border-brand-border bg-white px-4 py-2.5 text-[14px] font-bold text-brand-ink transition hover:border-brand-terracotta hover:text-brand-terracotta"
              href={routes.profile(locale, profileUserId, `tab=reviews&page=${page - 1}`)}
              rel="prev"
            >
              ← {t('reviews.previous')}
            </Link>
          ) : (
            <span />
          )}

          <span className="text-[13px] text-brand-muted">
            {t('reviews.pageOf', { page, total: totalPages })}
          </span>

          {page < totalPages ? (
            <Link
              className="rounded-[10px] border border-brand-border bg-white px-4 py-2.5 text-[14px] font-bold text-brand-ink transition hover:border-brand-terracotta hover:text-brand-terracotta"
              href={routes.profile(locale, profileUserId, `tab=reviews&page=${page + 1}`)}
              rel="next"
            >
              {t('reviews.next')} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}

async function PreferencesTab({
  locale,
  profile,
}: {
  locale: Locale;
  profile: PublicProfile;
}) {
  const t = await profileTranslations(locale);
  const tEnums = await getTranslations({ locale, namespace: 'enums' });
  const preferences = parseRoommatePreferences(profile.roommatePreferences);
  const money = (cents: number) => formatMoneyFromCents(cents, PREFERENCE_CURRENCY, locale);

  // The column is free-form JSON, so a swapped min/max still renders as a sane
  // range rather than "35 – 22".
  const { ageMin, ageMax, budgetMinCents, budgetMaxCents } = preferences;

  const budget =
    budgetMinCents !== undefined && budgetMaxCents !== undefined
      ? `${money(Math.min(budgetMinCents, budgetMaxCents))} – ${money(Math.max(budgetMinCents, budgetMaxCents))}`
      : budgetMinCents !== undefined
        ? money(budgetMinCents)
        : budgetMaxCents !== undefined
          ? money(budgetMaxCents)
          : null;

  const age =
    ageMin !== undefined && ageMax !== undefined
      ? t('preferences.ageRange', { min: Math.min(ageMin, ageMax), max: Math.max(ageMin, ageMax) })
      : ageMin !== undefined
        ? t('preferences.ageFrom', { min: ageMin })
        : ageMax !== undefined
          ? t('preferences.ageTo', { max: ageMax })
          : null;

  const yesNo = (value: boolean) => (value ? t('preferences.yes') : t('preferences.no'));

  const rows = [
    preferences.gender && {
      label: t('preferences.gender'),
      value: tEnums(`roommatePreference.${preferences.gender}`),
    },
    age && { label: t('preferences.age'), value: age },
    budget && { label: t('preferences.budget'), value: budget },
    preferences.occupation && {
      label: t('preferences.occupation'),
      value: preferences.occupation,
    },
    preferences.smoking !== undefined && {
      label: t('preferences.smoking'),
      value: yesNo(preferences.smoking),
    },
    preferences.pets !== undefined && {
      label: t('preferences.pets'),
      value: yesNo(preferences.pets),
    },
    preferences.quietHoursFrom && {
      label: t('preferences.quietHoursFrom'),
      value: preferences.quietHoursFrom,
    },
    preferences.environment && {
      label: t('preferences.environment'),
      value: preferences.environment,
    },
  ].filter((row): row is { label: string; value: string } => Boolean(row));

  if (rows.length === 0) {
    return <StateMessage body={t('preferences.emptyBody')} title={t('preferences.empty')} />;
  }

  return (
    <section>
      <h2 className="text-[18px] font-bold text-brand-ink">{t('preferences.heading')}</h2>

      <dl className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {rows.map((row) => (
          <div
            className="rounded-[12px] border border-brand-border bg-white px-4 py-3"
            key={row.label}
          >
            <dt className="text-[12px] font-medium text-brand-muted">{row.label}</dt>
            <dd className="mt-0.5 text-[15px] font-bold text-brand-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
