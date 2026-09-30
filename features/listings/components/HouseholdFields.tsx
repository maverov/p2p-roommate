'use client';

import { useTranslations } from 'next-intl';

import {
  CLEANLINESS_LEVELS,
  GUEST_FREQUENCIES,
  HOUSEHOLD_GENDERS,
  HOUSEHOLD_OCCUPATIONS,
  ROOM_TYPES,
  SOCIAL_LEVELS,
} from '@/lib/labels';
import { STAY_MONTH_OPTIONS, stayLabel } from '@/lib/stay';

import type { HouseholdFormValues } from '../form-values';

type HouseholdFieldsProps = {
  value: HouseholdFormValues;
  onChange: (value: HouseholdFormValues) => void;
  /** Section styling shared with the rest of the listing form. */
  classes: { section: string; title: string; label: string; field: string };
};

/** The listing form's "Room and stay" and "Who lives here" sections. */
export function HouseholdFields({ value, onChange, classes }: HouseholdFieldsProps) {
  const t = useTranslations('listings.form');
  const tEnums = useTranslations('enums');
  const tCommon = useTranslations('common');

  const set = <K extends keyof HouseholdFormValues>(key: K, next: HouseholdFormValues[K]) =>
    onChange({ ...value, [key]: next });

  const stayOptions = STAY_MONTH_OPTIONS.map((months) => {
    const label = stayLabel(months);
    return { months, label: tCommon(`stay.${label.unit}`, { count: label.count }) };
  });

  const select = (
    key: keyof HouseholdFormValues,
    label: string,
    options: ReadonlyArray<{ value: string; label: string }>,
    emptyLabel = t('notSpecified'),
  ) => (
    <div>
      <label className={classes.label} htmlFor={`household-${key}`}>
        {label}
      </label>
      <select
        className={classes.field}
        id={`household-${key}`}
        onChange={(e) => set(key, e.target.value as never)}
        value={value[key]}
      >
        <option value="">{emptyLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  const number = (key: keyof HouseholdFormValues, label: string, min: number, max: number) => (
    <div>
      <label className={classes.label} htmlFor={`household-${key}`}>
        {label}
      </label>
      <input
        className={classes.field}
        id={`household-${key}`}
        inputMode="numeric"
        max={max}
        min={min}
        onChange={(e) => set(key, e.target.value as never)}
        type="number"
        value={value[key]}
      />
    </div>
  );

  const yesNo = [
    { value: 'true', label: t('yes') },
    { value: 'false', label: t('no') },
  ];

  return (
    <>
      <section className={classes.section}>
        <h2 className={classes.title}>{t('sectionRoom')}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {select(
            'roomType',
            t('roomType'),
            ROOM_TYPES.map((type) => ({ value: type, label: tEnums(`roomType.${type}`) })),
            t('roomTypeWhole'),
          )}
          {select(
            'minStayMonths',
            t('minStay'),
            stayOptions.map((option) => ({ value: String(option.months), label: option.label })),
            t('noMinimum'),
          )}
          {select(
            'maxStayMonths',
            t('maxStay'),
            stayOptions.map((option) => ({ value: String(option.months), label: option.label })),
            t('noMaximum'),
          )}
        </div>
      </section>

      <section className={classes.section}>
        <h2 className={classes.title}>{t('sectionHousehold')}</h2>
        <p className="-mt-2 text-[13px] text-brand-muted">{t('householdHint')}</p>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {number('size', t('householdSize'), 0, 20)}
          {select(
            'genders',
            t('householdGenders'),
            HOUSEHOLD_GENDERS.map((item) => ({
              value: item,
              label: tEnums(`householdGender.${item}`),
            })),
          )}
          {number('ageMin', t('householdAgeMin'), 16, 99)}
          {number('ageMax', t('householdAgeMax'), 16, 99)}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {select(
            'occupation',
            t('householdOccupation'),
            HOUSEHOLD_OCCUPATIONS.map((item) => ({
              value: item,
              label: tEnums(`householdOccupation.${item}`),
            })),
          )}
          {select('smokers', t('householdSmokers'), yesNo)}
          {select('pets', t('householdPets'), yesNo)}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {select(
            'cleanliness',
            t('cleanliness'),
            CLEANLINESS_LEVELS.map((item) => ({ value: item, label: tEnums(`cleanliness.${item}`) })),
          )}
          {select(
            'social',
            t('social'),
            SOCIAL_LEVELS.map((item) => ({ value: item, label: tEnums(`social.${item}`) })),
          )}
          {select(
            'guests',
            t('guests'),
            GUEST_FREQUENCIES.map((item) => ({ value: item, label: tEnums(`guests.${item}`) })),
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 sm:w-1/2">
          {number('preferredAgeMin', t('preferredAgeMin'), 16, 99)}
          {number('preferredAgeMax', t('preferredAgeMax'), 16, 99)}
        </div>
      </section>
    </>
  );
}
