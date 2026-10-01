import { Home } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { getCityLabel, getNeighborhoodLabel } from '@/lib/areas';
import { PLATFORM_CURRENCY } from '@/lib/currency';
import { formatDate, formatMoneyFromCents } from '@/lib/format';
import type { Locale } from '@/lib/i18n';
import { stayLabel } from '@/lib/stay';

export type RoomWantedPost = {
  citySlug: string | null;
  wantedNeighborhoods: readonly string[];
  budgetMinCents?: number;
  budgetMaxCents?: number;
  moveInDate: string | null;
  stayMonths: number | null;
};

type RoomWantedCardProps = RoomWantedPost & { locale: Locale };

/** The post as label/value rows, shared by this card and the find-roommate cards. */
export async function getRoomWantedRows(
  locale: Locale,
  { citySlug, wantedNeighborhoods, budgetMinCents, budgetMaxCents, moveInDate, stayMonths }: RoomWantedPost,
) {
  const t = await getTranslations({ locale, namespace: 'profiles.roomWanted' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  const city = getCityLabel(citySlug, locale);
  const where =
    wantedNeighborhoods.length > 0
      ? wantedNeighborhoods
          .map((slug) => getNeighborhoodLabel(citySlug, slug, locale))
          .join(', ')
      : city
        ? t('anywhere', { city })
        : null;

  const money = (cents: number) => formatMoneyFromCents(cents, PLATFORM_CURRENCY, locale);
  const budget =
    budgetMinCents !== undefined && budgetMaxCents !== undefined
      ? t('budgetRange', { min: money(budgetMinCents), max: money(budgetMaxCents) })
      : budgetMaxCents !== undefined
        ? t('budgetUpTo', { max: money(budgetMaxCents) })
        : budgetMinCents !== undefined
          ? t('budgetFrom', { min: money(budgetMinCents) })
          : null;

  const stay = stayMonths === null ? null : stayLabel(stayMonths);

  return [
    where && { label: t('where'), value: where },
    budget && { label: t('budget'), value: budget },
    { label: t('moveIn'), value: moveInDate ? formatDate(moveInDate, locale) : t('flexible') },
    {
      label: t('stay'),
      value: stay ? tCommon(`stay.${stay.unit}`, { count: stay.count }) : t('flexible'),
    },
  ].filter((row): row is { label: string; value: string } => Boolean(row));
}

/** A seeker's published "room wanted" post, shown at the top of their profile. */
export async function RoomWantedCard({ locale, ...post }: RoomWantedCardProps) {
  const t = await getTranslations({ locale, namespace: 'profiles.roomWanted' });
  const rows = await getRoomWantedRows(locale, post);

  return (
    <section className="rounded-[15px] border border-brand-terracotta/30 bg-white p-5">
      <h2 className="flex items-center gap-2 text-[17px] font-bold text-brand-ink">
        <Home aria-hidden="true" className="text-brand-terracotta" size={18} strokeWidth={1.9} />
        {t('heading')}
      </h2>

      <dl className="mt-3 grid gap-x-6 gap-y-2 text-[14px] sm:grid-cols-2">
        {rows.map((row) => (
          <div className="flex gap-2" key={row.label}>
            <dt className="shrink-0 font-semibold text-brand-ink">{row.label}:</dt>
            <dd className="text-brand-muted">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
