'use client';

import { useTranslations } from 'next-intl';

import { getGroupedNeighborhoods, isCityId } from '@/lib/areas';
import { PLATFORM_CURRENCY } from '@/lib/currency';
import type { Locale } from '@/lib/i18n';
import { STAY_MONTH_OPTIONS, stayLabel } from '@/lib/stay';

import { SETTINGS_FIELD, SETTINGS_LABEL, SETTINGS_SECTION } from './settings-ui';

/** Form state as strings, the way inputs hold it; converted on submit. */
export type RoomWantedValue = {
  lookingForRoom: boolean;
  wantedNeighborhoods: string[];
  moveInDate: string;
  stayMonths: string;
  budgetMin: string;
  budgetMax: string;
};

type RoomWantedSectionProps = {
  locale: Locale;
  /** The profile's city, chosen in the section above; neighbourhoods depend on it. */
  citySlug: string;
  value: RoomWantedValue;
  onChange: (value: RoomWantedValue) => void;
};

export function RoomWantedSection({ locale, citySlug, value, onChange }: RoomWantedSectionProps) {
  const t = useTranslations('settings.roomWanted');
  const tCommon = useTranslations('common');
  const groups = isCityId(citySlug) ? getGroupedNeighborhoods(citySlug) : [];
  const set = (patch: Partial<RoomWantedValue>) => onChange({ ...value, ...patch });

  const toggleNeighborhood = (slug: string) =>
    set({
      wantedNeighborhoods: value.wantedNeighborhoods.includes(slug)
        ? value.wantedNeighborhoods.filter((item) => item !== slug)
        : [...value.wantedNeighborhoods, slug],
    });

  return (
    <section className={SETTINGS_SECTION}>
      <header>
        <h2 className="text-[17px] font-semibold text-brand-ink">{t('heading')}</h2>
        <p className="mt-1 text-[13px] text-brand-muted">{t('description')}</p>
      </header>

      <label className="flex items-start gap-2 text-[14px] text-brand-ink">
        <input
          checked={value.lookingForRoom}
          className="mt-0.5 size-4 accent-brand-terracotta"
          onChange={(e) => set({ lookingForRoom: e.target.checked })}
          type="checkbox"
        />
        <span>
          {t('publish')}
          <span className="block text-[12px] text-brand-muted">{t('publishHint')}</span>
        </span>
      </label>

      {value.lookingForRoom && (
        <>
          <fieldset>
            <legend className={SETTINGS_LABEL}>{t('neighborhoods')}</legend>
            {groups.length === 0 ? (
              <p className="text-[13px] text-brand-muted">{t('needCity')}</p>
            ) : (
              <>
                <p className="mb-2 text-[12px] text-brand-muted">{t('neighborhoodsHint')}</p>
                <div className="max-h-64 space-y-3 overflow-y-auto rounded-[10px] border border-brand-border p-3">
                  {groups.map(({ group, neighborhoods }) => (
                    <div key={group.id}>
                      <p className="text-[12px] font-semibold uppercase tracking-wide text-brand-muted">
                        {group.label[locale]}
                      </p>
                      <div className="mt-1 grid gap-1 sm:grid-cols-2">
                        {neighborhoods.map((neighborhood) => (
                          <label
                            className="flex items-center gap-2 text-[13px] text-brand-ink"
                            key={neighborhood.id}
                          >
                            <input
                              checked={value.wantedNeighborhoods.includes(neighborhood.id)}
                              className="size-[15px] accent-brand-terracotta"
                              onChange={() => toggleNeighborhood(neighborhood.id)}
                              type="checkbox"
                            />
                            {neighborhood.label[locale]}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={SETTINGS_LABEL} htmlFor="budgetMin">
                {t('budgetMin', { currency: PLATFORM_CURRENCY })}
              </label>
              <input
                className={SETTINGS_FIELD}
                id="budgetMin"
                inputMode="numeric"
                min={0}
                onChange={(e) => set({ budgetMin: e.target.value })}
                type="number"
                value={value.budgetMin}
              />
            </div>
            <div>
              <label className={SETTINGS_LABEL} htmlFor="budgetMax">
                {t('budgetMax', { currency: PLATFORM_CURRENCY })}
              </label>
              <input
                className={SETTINGS_FIELD}
                id="budgetMax"
                inputMode="numeric"
                min={0}
                onChange={(e) => set({ budgetMax: e.target.value })}
                type="number"
                value={value.budgetMax}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={SETTINGS_LABEL} htmlFor="moveInDate">
                {t('moveInDate')}
              </label>
              <input
                className={SETTINGS_FIELD}
                id="moveInDate"
                onChange={(e) => set({ moveInDate: e.target.value })}
                type="date"
                value={value.moveInDate}
              />
            </div>
            <div>
              <label className={SETTINGS_LABEL} htmlFor="stayMonths">
                {t('stay')}
              </label>
              <select
                className={SETTINGS_FIELD}
                id="stayMonths"
                onChange={(e) => set({ stayMonths: e.target.value })}
                value={value.stayMonths}
              >
                <option value="">{t('stayAny')}</option>
                {STAY_MONTH_OPTIONS.map((months) => {
                  const label = stayLabel(months);
                  return (
                    <option key={months} value={months}>
                      {tCommon(`stay.${label.unit}`, { count: label.count })}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
