import { UsersRound } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import type { Locale } from '@/lib/i18n';

import { parseListingHousehold } from '../schemas';

type HouseholdSectionProps = {
  locale: Locale;
  /** The stored `listing.household` blob; parsed here, never trusted. */
  household: unknown;
};

/** "Who lives here" on the listing page. Renders nothing when the owner said nothing. */
export async function HouseholdSection({ locale, household: raw }: HouseholdSectionProps) {
  const t = await getTranslations({ locale, namespace: 'listings.detail.household' });
  const tEnums = await getTranslations({ locale, namespace: 'enums' });
  const household = parseListingHousehold(raw);

  const range = (min?: number, max?: number) =>
    min !== undefined && max !== undefined
      ? t('agesRange', { min, max })
      : min !== undefined
        ? t('agesFrom', { min })
        : max !== undefined
          ? t('agesUpTo', { max })
          : null;
  const yesNo = (value?: boolean) => (value === undefined ? null : value ? t('yes') : t('no'));

  const rows = [
    { label: t('genders'), value: household.genders && tEnums(`householdGender.${household.genders}`) },
    { label: t('ages'), value: range(household.ageMin, household.ageMax) },
    {
      label: t('occupation'),
      value: household.occupation && tEnums(`householdOccupation.${household.occupation}`),
    },
    { label: t('smokers'), value: yesNo(household.smokers) },
    { label: t('pets'), value: yesNo(household.pets) },
    {
      label: t('cleanliness'),
      value: household.cleanliness && tEnums(`cleanliness.${household.cleanliness}`),
    },
    { label: t('social'), value: household.social && tEnums(`social.${household.social}`) },
    { label: t('guests'), value: household.guests && tEnums(`guests.${household.guests}`) },
    {
      label: t('preferredAges'),
      value: range(household.preferredAgeMin, household.preferredAgeMax),
    },
  ].filter((row): row is { label: string; value: string } => Boolean(row.value));

  if (household.size === undefined && rows.length === 0) {
    return null;
  }

  return (
    <section className="mt-10">
      <h2 className="mb-4 font-serif text-[26px] font-medium leading-none tracking-[-0.02em] text-brand-ink">
        {t('heading')}
      </h2>

      <div className="rounded-[15px] border border-brand-border bg-white p-5">
        {household.size !== undefined && (
          <p className="flex items-center gap-2 text-[15px] font-bold text-brand-ink">
            <UsersRound aria-hidden="true" size={17} strokeWidth={1.9} />
            {t('people', { count: household.size })}
          </p>
        )}

        {rows.length > 0 && (
          <dl className="mt-3 grid gap-x-6 gap-y-2 text-[14px] sm:grid-cols-2">
            {rows.map((row) => (
              <div className="flex gap-2" key={row.label}>
                <dt className="shrink-0 font-semibold text-brand-ink">{row.label}:</dt>
                <dd className="text-brand-muted">{row.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
