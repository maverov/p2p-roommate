'use client';

import { SlidersHorizontal, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';

import { CITY_IDS, cityLabels, getGroupedNeighborhoods, isCityId } from '@/lib/areas';
import type { Locale } from '@/lib/i18n';
import { PROPERTY_TYPES, ROOMMATE_PREFERENCES } from '@/lib/labels';
import { routes } from '@/lib/routes';
import { cn } from '@/utils';

type ListingFiltersProps = {
  locale: Locale;
};

/**
 * Boolean amenity filters, in sidebar order, each mapped to the message key that
 * labels it. A static map rather than a helper function: the labels live under
 * two different `listings` sub-namespaces, and a hook cannot run at module scope.
 */
const FLAG_LABEL_KEYS = {
  isVerified: 'common.verified',
  isFurnished: 'detail.included.furnished',
  internetIncluded: 'detail.included.internet',
  utilitiesIncluded: 'detail.included.utilities',
  petsAllowed: 'detail.included.pets',
  nearMetro: 'detail.included.nearMetro',
  roommateFriendly: 'detail.included.roommateFriendly',
} as const;

const FLAG_FILTERS = Object.keys(FLAG_LABEL_KEYS) as Array<keyof typeof FLAG_LABEL_KEYS>;

const FIELD =
  'w-full rounded-[10px] border border-brand-border bg-brand-chip px-3 py-2 text-[14px] text-brand-ink outline-none transition placeholder:text-brand-muted/70 focus:border-brand-terracotta focus:bg-white';

const CHECKBOX =
  'size-[15px] shrink-0 accent-brand-terracotta focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-terracotta';

/**
 * Every filter lives in the query string — a search is then shareable, the back
 * button works, and the server component is the only thing that reads state.
 *
 * `pending` mirrors the params locally so a click registers immediately instead
 * of waiting for the RSC round trip; it is dropped once the URL catches up.
 */
export function ListingFilters({ locale }: ListingFiltersProps) {
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
    // Result counts change under a new filter, so page 5 is meaningless.
    next.delete('page');

    const nextSearch = next.toString();
    setPending(nextSearch);
    startTransition(() => {
      router.replace(routes.listings(locale, nextSearch), { scroll: false });
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

  const csvValues = (key: string) =>
    new Set(params.get(key)?.split(',').filter(Boolean) ?? []);

  const citySlug = params.get('citySlug') ?? '';
  const neighborhoodGroups = isCityId(citySlug) ? getGroupedNeighborhoods(citySlug) : [];
  const selectedNeighborhoods = csvValues('neighborhoodSlug');
  const selectedPropertyTypes = csvValues('propertyType');
  const hasFilters = Array.from(params.keys()).some(
    (key) => key !== 'sort' && key !== 'page',
  );

  return (
    <>
      <button
        aria-controls="listing-filters"
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
        id="listing-filters"
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
          <select
            className={FIELD}
            onChange={(event) =>
              update((next) => {
                const value = event.target.value;

                if (value) {
                  next.set('citySlug', value);
                } else {
                  next.delete('citySlug');
                }

                // Neighborhood slugs belong to the previous city.
                next.delete('neighborhoodSlug');
              })
            }
            value={citySlug}
          >
            <option value="">{t('anyCity')}</option>
            {CITY_IDS.map((city) => (
              <option key={city} value={city}>
                {cityLabels[city][locale]}
              </option>
            ))}
          </select>
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

        <Group label={t('propertyType')}>
          <div className="grid gap-1.5">
            {PROPERTY_TYPES.map((type) => (
              <CheckboxRow
                checked={selectedPropertyTypes.has(type)}
                key={type}
                label={tEnums(`propertyType.${type}`)}
                onChange={() => toggleCsv('propertyType', type)}
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

        <Group label={t('bedrooms')}>
          <select
            className={FIELD}
            onChange={(event) => setSingle('bedroomCount', event.target.value)}
            value={params.get('bedroomCount') ?? ''}
          >
            <option value="">{t('anyBedrooms')}</option>
            {[1, 2, 3, 4].map((count) => (
              <option key={count} value={count}>
                {t('minBedrooms', { count })}
              </option>
            ))}
          </select>
        </Group>

        <Group label={t('occupants')}>
          <select
            className={FIELD}
            onChange={(event) => setSingle('maxOccupants', event.target.value)}
            value={params.get('maxOccupants') ?? ''}
          >
            <option value="">{t('anyOccupants')}</option>
            {[1, 2, 3, 4, 5].map((count) => (
              <option key={count} value={count}>
                {t('minOccupants', { count })}
              </option>
            ))}
          </select>
        </Group>

        <Group label={t('roommatePreference')}>
          <select
            className={FIELD}
            onChange={(event) => setSingle('roommatePreference', event.target.value)}
            value={params.get('roommatePreference') ?? ''}
          >
            <option value="">{t('any')}</option>
            {ROOMMATE_PREFERENCES.map((preference) => (
              <option key={preference} value={preference}>
                {tEnums(`roommatePreference.${preference}`)}
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
            {FLAG_FILTERS.map((flag) => (
              <CheckboxRow
                checked={params.get(flag) === 'true'}
                key={flag}
                label={tListings(FLAG_LABEL_KEYS[flag])}
                onChange={() =>
                  setSingle(flag, params.get(flag) === 'true' ? '' : 'true')
                }
              />
            ))}
          </div>
        </Group>
      </div>
    </>
  );
}

const centsToUnits = (cents: string | null) => {
  const value = Number(cents);

  return Number.isFinite(value) && value > 0 ? String(Math.round(value / 100)) : '';
};

const unitsToCents = (units: string) => {
  const value = Number(units);

  return Number.isFinite(value) && value > 0 ? String(Math.round(value * 100)) : '';
};

type DebouncedInputProps = {
  className: string;
  label: string;
  min?: number;
  onCommit: (value: string) => void;
  placeholder: string;
  type: 'search' | 'number';
  value: string;
};

const COMMIT_DELAY_MS = 450;

/**
 * Free-text and price inputs navigate on a debounce rather than per keystroke,
 * so typing "1200" is one request instead of four.
 */
function DebouncedInput({
  className,
  label,
  min,
  onCommit,
  placeholder,
  type,
  value,
}: DebouncedInputProps) {
  const [draft, setDraft] = useState(value);

  // Resync when the URL changes from outside this input (back button, Clear all).
  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (draft === value) {
      return;
    }

    const timer = setTimeout(() => onCommit(draft), COMMIT_DELAY_MS);

    return () => clearTimeout(timer);
    // `onCommit` closes over the current params by design; re-running on every
    // render would restart the timer forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, value]);

  return (
    <input
      aria-label={label}
      className={className}
      inputMode={type === 'number' ? 'numeric' : undefined}
      min={min}
      onChange={(event) => setDraft(event.target.value)}
      placeholder={placeholder}
      type={type}
      value={draft}
    />
  );
}

function Group({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="mt-5 border-t border-brand-border pt-4">
      <p className="mb-2 text-[13px] font-bold text-brand-ink">{label}</p>
      {children}
    </div>
  );
}

function CheckboxRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[13px] leading-5 text-brand-muted transition hover:text-brand-ink">
      <input checked={checked} className={CHECKBOX} onChange={onChange} type="checkbox" />
      {label}
    </label>
  );
}
