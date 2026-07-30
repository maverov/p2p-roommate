import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Route } from 'next';

import { StateMessage } from '@/components/shared/StateMessage';
import { ProfileCard } from '@/features/profiles/components/ProfileCard';
import { listPublicProfiles } from '@/features/profiles/server/repository';
import { CITY_IDS, cityLabels, isCityId } from '@/lib/areas';
import { isLocale, type Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import { safeQuery } from '@/lib/server/safe';

const PER_PAGE = 24;

type FindRoommatePageProps = {
  params: { locale: string };
  searchParams: { citySlug?: string; q?: string; page?: string };
};

export async function generateMetadata({ params }: FindRoommatePageProps): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : 'bg';
  const t = await getTranslations({ locale, namespace: 'profiles.search' });

  return { title: t('heading') };
}

export default async function FindRoommatePage({
  params,
  searchParams,
}: FindRoommatePageProps) {
  if (!isLocale(params.locale)) notFound();

  const locale: Locale = params.locale;
  const t = await getTranslations({ locale, namespace: 'profiles.search' });

  const citySlug = isCityId(searchParams.citySlug) ? searchParams.citySlug : undefined;
  const q = searchParams.q?.trim() || undefined;
  const page = Math.max(1, Number(searchParams.page) || 1);

  const result = await safeQuery(
    listPublicProfiles({ citySlug, q, page, perPage: PER_PAGE }),
    'find-roommate profiles',
  );

  const totalPages = result ? Math.max(1, Math.ceil(result.total / PER_PAGE)) : 1;

  const buildHref = (overrides: { page?: number; citySlug?: string; q?: string }): Route => {
    const sp = new URLSearchParams();
    const nextCity = overrides.citySlug ?? citySlug;
    const nextQ = overrides.q ?? q;
    const nextPage = overrides.page ?? page;
    if (nextCity) sp.set('citySlug', nextCity);
    if (nextQ) sp.set('q', nextQ);
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
          component, so an onChange handler cannot cross the boundary, and a plain
          GET form keeps the page working without JavaScript.
        */}
        <select
          name="citySlug"
          defaultValue={citySlug ?? ''}
          className="rounded-[10px] border border-brand-border bg-white px-3 py-2 text-[14px] text-brand-ink outline-none focus:border-brand-terracotta"
        >
          <option value="">{t('anyCity')}</option>
          {CITY_IDS.map((id) => (
            <option key={id} value={id}>
              {cityLabels[id][locale]}
            </option>
          ))}
        </select>

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
      </form>

      {/* Result count */}
      {result && (
        <p className="mt-4 text-[13px] text-brand-muted">
          {t('resultCount', { count: result.total })}
        </p>
      )}

      <div className="mt-6">
        {result === null ? (
          <StateMessage
            tone="error"
            title={t('errorTitle')}
            body={t('errorBody')}
          />
        ) : result.items.length === 0 ? (
          <StateMessage title={t('empty')} body={t('emptyBody')} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {result.items.map((item) => (
              <ProfileCard
                key={item.profileUserId}
                locale={locale}
                profile={{
                  profileUserId: item.profileUserId,
                  name: item.name ?? '',
                  image: item.image ?? null,
                  citySlug: item.citySlug ?? null,
                  bio: item.bio ?? null,
                  createdAt: item.joinedAt ?? null,
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
          <span className="text-[14px] text-brand-muted">{t('pageOf', { page, total: totalPages })}</span>
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
