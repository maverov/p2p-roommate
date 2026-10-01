import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Route } from 'next';

import { StateMessage } from '@/components/shared/StateMessage';
import { CityCombobox } from '@/features/areas/components/CityCombobox';
import { scoreProfiles } from '@/features/compatibility/score';
import { getCompatibilityProfile } from '@/features/compatibility/server/repository';
import { ProfileCard } from '@/features/profiles/components/ProfileCard';
import { TraitCheckbox } from '@/features/profiles/components/TraitCheckbox';
import { parseProfileTraits } from '@/features/profiles/schemas';
import { listPublicProfiles } from '@/features/profiles/server/repository';
import { isCityId } from '@/lib/areas';
import { isLocale, type Locale } from '@/lib/i18n';
import { PROFILE_TRAITS } from '@/lib/labels';
import { routes } from '@/lib/routes';
import { pageContactMasker } from '@/lib/server/contact-visibility';
import { safeQuery } from '@/lib/server/safe';
import { getServerUser } from '@/lib/server/session';

const PER_PAGE = 24;

type FindRoommatePageProps = {
  params: { locale: string };
  searchParams: {
    citySlug?: string;
    q?: string;
    page?: string;
    looking?: string;
    /** Repeated (`traits=A&traits=B`, what the form sends) or comma-separated. */
    traits?: string | string[];
  };
};

export async function generateMetadata({ params }: FindRoommatePageProps): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : 'bg';
  const t = await getTranslations({ locale, namespace: 'profiles.search' });

  return { title: t('heading') };
}

export default async function FindRoommatePage({ params, searchParams }: FindRoommatePageProps) {
  if (!isLocale(params.locale)) notFound();

  const locale: Locale = params.locale;
  const t = await getTranslations({ locale, namespace: 'profiles.search' });
  const tEnums = await getTranslations({ locale, namespace: 'enums' });

  const citySlug = isCityId(searchParams.citySlug) ? searchParams.citySlug : undefined;
  const q = searchParams.q?.trim() || undefined;
  const lookingForRoom = searchParams.looking === '1';
  const traits = parseProfileTraits(
    [searchParams.traits ?? []].flat().flatMap((value) => value.split(',')),
  );
  const page = Math.max(1, Number(searchParams.page) || 1);

  const [found, viewer] = await Promise.all([
    safeQuery(
      listPublicProfiles({ citySlug, q, lookingForRoom, traits, page, perPage: PER_PAGE }),
      'find-roommate profiles',
    ),
    getServerUser(),
  ]);
  const [mask, seeker] = await Promise.all([
    pageContactMasker(locale, Boolean(viewer)),
    viewer && found?.items.length
      ? safeQuery(getCompatibilityProfile(viewer.id), 'compatibility profile')
      : null,
  ]);
  const result = found && { ...found, items: found.items.map(mask.profile) };

  const totalPages = result ? Math.max(1, Math.ceil(result.total / PER_PAGE)) : 1;

  const buildHref = (overrides: { page?: number; citySlug?: string; q?: string }): Route => {
    const sp = new URLSearchParams();
    const nextCity = overrides.citySlug ?? citySlug;
    const nextQ = overrides.q ?? q;
    const nextPage = overrides.page ?? page;
    if (nextCity) sp.set('citySlug', nextCity);
    if (nextQ) sp.set('q', nextQ);
    if (lookingForRoom) sp.set('looking', '1');
    for (const trait of traits) sp.append('traits', trait);
    if (nextPage > 1) sp.set('page', String(nextPage));
    const qs = sp.toString();
    const base = routes.findRoommate(locale) as string;
    return (qs ? `${base}?${qs}` : base) as Route;
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 lg:px-6">
      <h1 className="text-[24px] font-bold leading-8 text-brand-ink">{t('heading')}</h1>

      {/* Filters row */}
      <form method="GET" className="mt-6 flex flex-wrap gap-3">
        {/*
          Filtering happens on submit rather than on change: this is a server
          component, so an onChange handler cannot cross the boundary. The city
          picker posts its slug through a hidden input, like any other field.
        */}
        <CityCombobox
          aria-label={t('city')}
          classNames={{
            root: 'w-full sm:w-56',
            input:
              'w-full rounded-[10px] border border-brand-border bg-white px-3 py-2 text-[14px] text-brand-ink outline-none placeholder:text-brand-muted/70 focus:border-brand-terracotta',
          }}
          defaultValue={citySlug ?? ''}
          emptyLabel={t('anyCity')}
          locale={locale}
          name="citySlug"
        />

        {/* Keyword search */}
        <div className="flex flex-1 items-center gap-2">
          <input
            name="q"
            type="search"
            defaultValue={q ?? ''}
            placeholder={t('keywordPlaceholder')}
            className="min-w-0 flex-1 rounded-[10px] border border-brand-border bg-white px-3 py-2 text-[14px] outline-none placeholder:text-brand-muted/60 focus:border-brand-terracotta"
          />
          <button
            type="submit"
            className="rounded-[10px] bg-brand-terracotta px-4 py-2 text-[14px] font-medium text-white hover:bg-brand-terracotta/90"
          >
            {t('keyword')}
          </button>
        </div>

        <label className="flex w-full items-center gap-2 text-[14px] text-brand-ink">
          <input
            className="size-4 accent-brand-terracotta"
            defaultChecked={lookingForRoom}
            name="looking"
            type="checkbox"
            value="1"
          />
          {t('lookingOnly')}
        </label>

        <fieldset className="w-full">
          <legend className="mb-2 text-[13px] font-bold text-brand-ink">{t('traits')}</legend>
          <div className="flex flex-wrap gap-2">
            {PROFILE_TRAITS.map((trait) => (
              <TraitCheckbox
                defaultChecked={traits.includes(trait)}
                key={trait}
                label={tEnums(`profileTrait.${trait}`)}
                name="traits"
                value={trait}
              />
            ))}
          </div>
        </fieldset>
      </form>

      {/* Result count */}
      {result && (
        <p className="mt-4 text-[13px] text-brand-muted">
          {t('resultCount', { count: result.total })}
        </p>
      )}

      <div className="mt-6">
        {result === null ? (
          <StateMessage tone="error" title={t('errorTitle')} body={t('errorBody')} />
        ) : result.items.length === 0 ? (
          <StateMessage title={t('empty')} body={t('emptyBody')} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((item, index) => (
              <ProfileCard
                key={item.profileUserId}
                locale={locale}
                matchScore={
                  seeker && item.profileUserId !== viewer?.id
                    ? scoreProfiles(seeker, item.compatibility)
                    : null
                }
                priority={index < 3}
                profile={{
                  profileUserId: item.profileUserId,
                  name: item.name ?? '',
                  image: item.image ?? null,
                  citySlug: item.citySlug ?? null,
                  bio: item.bio ?? null,
                  createdAt: item.joinedAt ?? null,
                  isVerified: item.isVerified,
                  roomWanted: item.roomWanted,
                  traits: item.traits,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {result && totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Pagination">
          {page > 1 && (
            <Link
              href={buildHref({ page: page - 1 })}
              className="flex items-center gap-1 rounded-xl border border-brand-border px-3 py-2 text-[14px] hover:bg-brand-chip"
            >
              <ChevronLeft className="size-4" />
              {t('previous')}
            </Link>
          )}
          <span className="text-[14px] text-brand-muted">
            {t('pageOf', { page, total: totalPages })}
          </span>
          {page < totalPages && (
            <Link
              href={buildHref({ page: page + 1 })}
              className="flex items-center gap-1 rounded-xl border border-brand-border px-3 py-2 text-[14px] hover:bg-brand-chip"
            >
              {t('next')}
              <ChevronRight className="size-4" />
            </Link>
          )}
        </nav>
      )}
    </main>
  );
}
