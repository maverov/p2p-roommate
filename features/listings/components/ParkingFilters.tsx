'use client';

import { SlidersHorizontal, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';

import { CityCombobox } from '@/features/areas/components/CityCombobox';
import { getGroupedNeighborhoods, hasMetro, isCityId } from '@/lib/areas';
import { VERIFICATION_BADGES } from '@/lib/feature-flags';
import type { Locale } from '@/lib/i18n';
import { PARKING_TYPES } from '@/lib/labels';
import { routes } from '@/lib/routes';
import { cn } from '@/utils';

import {
  CheckboxRow,
  DebouncedInput,
  FIELD,
  Group,
  centsToUnits,
  unitsToCents,
} from './filter-controls';

/**
 * The parking sidebar, which is deliberately much shorter than the home one: bedrooms,
 * roommate preference, furnishing and the rest of the household filters mean nothing to
 * somebody looking for somewhere to put a car.
 *
 * Mirrors `ListingFilters` in how it works — every filter lives in the query string, and
 * `pending` mirrors it locally so a click registers before the RSC round trip returns.
 */
const FLAG_LABEL_KEYS = {
  isVerified: 'common.verified',
  evCharging: 'parking.evCharging',
  gatedAccess: 'parking.gatedAccess',
  nearMetro: 'detail.included.nearMetro',
} as const;

const FLAG_FILTERS = (Object.keys(FLAG_LABEL_KEYS) as Array<keyof typeof FLAG_LABEL_KEYS>).filter(
  (flag) => VERIFICATION_BADGES || flag !== 'isVerified',
);

/** Common car lengths, in centimetres: a city hatchback up to a long estate or pickup. */
const VEHICLE_LENGTHS_CM = [400, 450, 500, 550];

export function ParkingFilters({ locale }: { locale: Locale }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('listings.search');
  const tListings = useTranslations('listings');
  const tEnums = useTranslations('enums');
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  const search = pending ?? searchParams.toString();
  const params = useMemo(() => new URLSearchParams(search), [search]);

  useEffect(() => {
    setPending(null);
  }, [searchParams]);

  const commit = (next: URLSearchParams) => {
    next.delete('page');

    const nextSearch = next.toString();
    setPending(nextSearch);
    startTransition(() => {
      router.replace(routes.parking(locale, nextSearch), { scroll: false });
    });
  };

  const update = (mutate: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(search);
    mutate(next);
    commit(next);
  };

  const setSingle = (key: string, value: string) =>
    update((next) => (value ? next.set(key, value) : next.delete(key)));

  const toggleCsv = (key: string, value: string) =>
    update((next) => {
      const values = new Set(next.get(key)?.split(',').filter(Boolean) ?? []);

      if (values.has(value)) {
        values.delete(value);
      } else {
        values.add(value);
      }

      if (values.size > 0) {
        next.set(key, Array.from(values).join(','));
      } else {
        next.delete(key);
      }
    });

  const citySlug = params.get('citySlug') ?? '';
  const neighborhoodGroups = isCityId(citySlug) ? getGroupedNeighborhoods(citySlug) : [];
  const selectedNeighborhoods = new Set(
    params.get('neighborhoodSlug')?.split(',').filter(Boolean) ?? [],
  );
  const selectedParkingTypes = new Set(params.get('parkingType')?.split(',').filter(Boolean) ?? []);
  const hasFilters = Array.from(params.keys()).some((key) => key !== 'sort' && key !== 'page');

  return (
    <>
      <button
        aria-controls="parking-filters"
        aria-expanded={isOpen}
        className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-brand-border bg-white px-4 py-2.5 text-[14px] font-bold text-brand-ink transition hover:border-brand-terracotta lg:hidden"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        <SlidersHorizontal aria-hidden="true" size={15} strokeWidth={2} />
        {isOpen ? t('closeFilters') : t('openFilters')}
      </button>

      <div
        className={cn(
          'rounded-[15px] border border-brand-border bg-white p-5 transition-opacity lg:block',
          isOpen ? 'mt-3 block' : 'hidden',
          isPending && 'opacity-60',
        )}
        id="parking-filters"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[16px] font-bold text-brand-ink">{t('filters')}</h2>

          {hasFilters && (
            <button
              className="flex items-center gap-1 text-[13px] font-medium text-brand-terracotta hover:underline"
              onClick={() => commit(new URLSearchParams())}
              type="button"
            >
              <X aria-hidden="true" size={13} strokeWidth={2.2} />
              {t('clearAll')}
            </button>
          )}
        </div>

        <Group label={t('keyword')}>
          <DebouncedInput
            className={FIELD}
            label={t('keyword')}
            onCommit={(value) => setSingle('q', value)}
            placeholder={t('keywordPlaceholder')}
            type="search"
            value={params.get('q') ?? ''}
          />
        </Group>

        <Group label={t('city')}>
          <CityCombobox
            aria-label={t('city')}
            classNames={{ input: FIELD }}
            emptyLabel={t('anyCity')}
            locale={locale}
            onChange={(city) =>
              update((next) => {
                if (city) {
                  next.set('citySlug', city);
                } else {
                  next.delete('citySlug');
                }

                next.delete('neighborhoodSlug');

                if (city && !hasMetro(city)) {
                  next.delete('nearMetro');
                }
              })
            }
            value={isCityId(citySlug) ? citySlug : ''}
          />
        </Group>

        {neighborhoodGroups.length > 0 && (
          <Group label={t('neighborhood')}>
            <div className="max-h-64 space-y-3 overflow-y-auto rounded-[10px] border border-brand-border bg-brand-chip p-3">
              {neighborhoodGroups.map(({ group, neighborhoods }) => (
                <fieldset key={group.id}>
                  <legend className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-brand-muted">
                    {group.label[locale]}
                  </legend>

                  <div className="grid gap-1.5">
                    {neighborhoods.map((neighborhood) => (
                      <CheckboxRow
                        checked={selectedNeighborhoods.has(neighborhood.id)}
                        key={neighborhood.id}
                        label={neighborhood.label[locale]}
                        onChange={() => toggleCsv('neighborhoodSlug', neighborhood.id)}
                      />
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          </Group>
        )}

        <Group label={tListings('parking.type')}>
          <div className="grid gap-1.5">
            {PARKING_TYPES.map((type) => (
              <CheckboxRow
                checked={selectedParkingTypes.has(type)}
                key={type}
                label={tEnums(`parkingType.${type}`)}
                onChange={() => toggleCsv('parkingType', type)}
              />
            ))}
          </div>
        </Group>

        <Group label={t('priceRange')}>
          <div className="flex items-center gap-2">
            <DebouncedInput
              className={FIELD}
              label={t('minPrice')}
              min={0}
              onCommit={(value) => setSingle('minRentCents', unitsToCents(value))}
              placeholder={t('minPrice')}
              type="number"
              value={centsToUnits(params.get('minRentCents'))}
            />

            <span aria-hidden="true" className="text-brand-muted">
              –
            </span>

            <DebouncedInput
              className={FIELD}
              label={t('maxPrice')}
              min={0}
              onCommit={(value) => setSingle('maxRentCents', unitsToCents(value))}
              placeholder={t('maxPrice')}
              type="number"
              value={centsToUnits(params.get('maxRentCents'))}
            />
          </div>
        </Group>

        {/* Spots that state no limit are kept, so this never hides an unmeasured garage. */}
        <Group label={tListings('parking.vehicleLength')}>
          <select
            className={FIELD}
            onChange={(event) => setSingle('vehicleLengthCm', event.target.value)}
            value={params.get('vehicleLengthCm') ?? ''}
          >
            <option value="">{tListings('parking.anyVehicleLength')}</option>
            {VEHICLE_LENGTHS_CM.map((length) => (
              <option key={length} value={length}>
                {tListings('common.vehicleLengthMetres', { metres: (length / 100).toFixed(1) })}
              </option>
            ))}
          </select>
        </Group>

        <Group label={t('availableFrom')}>
          <input
            className={FIELD}
            onChange={(event) => setSingle('availableFrom', event.target.value)}
            type="date"
            value={params.get('availableFrom')?.slice(0, 10) ?? ''}
          />
        </Group>

        <Group label={t('features')}>
          <div className="grid gap-1.5">
            {FLAG_FILTERS.filter(
              (flag) => flag !== 'nearMetro' || !citySlug || hasMetro(citySlug),
            ).map((flag) => (
              <CheckboxRow
                checked={params.get(flag) === 'true'}
                key={flag}
                label={tListings(FLAG_LABEL_KEYS[flag])}
                onChange={() => setSingle(flag, params.get(flag) === 'true' ? '' : 'true')}
              />
            ))}
          </div>
        </Group>
      </div>
    </>
  );
}
