import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { StateMessage } from '@/components/shared/StateMessage';
import { ListingCard } from '@/features/listings/components/ListingCard';
import { getSavedListingIds, listSavedListings } from '@/features/listings/server/repository';
import { ProfileCard } from '@/features/profiles/components/ProfileCard';
import { listSavedProfiles } from '@/features/profiles/server/repository';
import { isLocale, type Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import { safeQuery } from '@/lib/server/safe';
import { requireServerUser } from '@/lib/server/session';

const SAVED_TABS = ['listings', 'profiles'] as const;
type SavedTab = (typeof SAVED_TABS)[number];

function resolveTab(value?: string): SavedTab {
  return SAVED_TABS.includes(value as SavedTab) ? (value as SavedTab) : 'listings';
}

function tabHref(locale: Locale, tab: SavedTab) {
  return routes.saved(locale, tab === 'listings' ? undefined : `tab=${tab}`);
}

type SavedPageProps = {
  params: { locale: string };
  searchParams: { tab?: string };
};

export async function generateMetadata({ params }: SavedPageProps): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : 'bg';
  const t = await getTranslations({ locale, namespace: 'saved' });

  return {
    title: t('heading'),
    robots: { index: false },
  };
}

export default async function SavedPage({ params, searchParams }: SavedPageProps) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const locale: Locale = params.locale;
  const t = await getTranslations({ locale, namespace: 'saved' });
  const user = await requireServerUser(routes.saved(locale));
  const tab = resolveTab(searchParams.tab);

  const [savedListings, savedProfiles] = await Promise.all([
    tab === 'listings'
      ? safeQuery(listSavedListings(user.id), `saved listings ${user.id}`)
      : null,
    tab === 'profiles'
      ? safeQuery(listSavedProfiles(user.id), `saved profiles ${user.id}`)
      : null,
  ]);

  const savedListingIdSet =
    savedListings && savedListings.length > 0
      ? await safeQuery(
          getSavedListingIds(
            user.id,
            savedListings.map((item) => item.id),
          ),
          'saved listing ids',
        )
      : new Set<string>();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 lg:px-6">
      <h1 className="text-[24px] font-bold leading-8 text-brand-ink">{t('heading')}</h1>

      <nav aria-label={t('tabsLabel')} className="mt-6">
        <ul className="flex items-center gap-1 border-b border-brand-border">
          {SAVED_TABS.map((item) => (
            <li key={item}>
              <Link
                aria-current={item === tab ? 'page' : undefined}
                className={`-mb-px inline-block border-b-2 px-4 py-2.5 text-[14px] font-bold transition ${
                  item === tab
                    ? 'border-brand-terracotta text-brand-terracotta'
                    : 'border-transparent text-brand-muted hover:text-brand-ink'
                }`}
                href={tabHref(locale, item)}
                scroll={false}
              >
                {t(`tabs.${item}`)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-6">
        {tab === 'listings' && (
          <SavedListingsTab
            isAuthenticated={true}
            listings={savedListings}
            locale={locale}
            savedListingIds={savedListingIdSet}
          />
        )}
        {tab === 'profiles' && <SavedProfilesTab locale={locale} profiles={savedProfiles} />}
      </div>
    </main>
  );
}

async function SavedListingsTab({
  isAuthenticated,
  listings,
  locale,
  savedListingIds,
}: {
  isAuthenticated: boolean;
  listings: Awaited<ReturnType<typeof listSavedListings>> | null;
  locale: Locale;
  savedListingIds: Set<string> | null;
}) {
  // Re-resolving the translator per section rather than threading it through props:
  // next-intl memoises the request config, so this is a map lookup, not a reload.
  const t = await getTranslations({ locale, namespace: 'saved.listings' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  if (listings === null) {
    return <StateMessage body={t('errorBody')} title={t('errorTitle')} tone="error" />;
  }

  if (listings.length === 0) {
    return (
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
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {listings.map((item, index) => (
        <ListingCard
          isAuthenticated={isAuthenticated}
          isSaved={savedListingIds?.has(item.id) ?? true}
          key={item.id}
          listing={item}
          locale={locale}
          priority={index < 4}
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
      ))}
    </div>
  );
}

async function SavedProfilesTab({
  locale,
  profiles,
}: {
  locale: Locale;
  profiles: Awaited<ReturnType<typeof listSavedProfiles>> | null;
}) {
  const t = await getTranslations({ locale, namespace: 'saved.profiles' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  if (profiles === null) {
    return <StateMessage body={t('errorBody')} title={t('errorTitle')} tone="error" />;
  }

  if (profiles.length === 0) {
    return (
      <StateMessage
        action={
          <Link
            className="rounded-[10px] bg-brand-terracotta px-5 py-2.5 text-[14px] font-bold text-white transition hover:bg-brand-terracotta-hover"
            href={routes.findRoommate(locale)}
          >
            {tCommon('actions.findRoommate')}
          </Link>
        }
        body={t('emptyBody')}
        title={t('empty')}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {profiles.map((item) => (
        <ProfileCard
          key={item.profileUserId}
          locale={locale}
          profile={{
            profileUserId: item.profileUserId,
            name: item.name,
            image: item.image,
            citySlug: item.profile?.citySlug ?? null,
            bio: item.profile?.bio ?? null,
            createdAt: item.profile?.joinedAt ?? null,
          }}
        />
      ))}
    </div>
  );
}
