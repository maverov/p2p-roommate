'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type ReactNode } from 'react';
import { ChevronDown, Home, MapPin, Search, UserRound, Wallet, AlertCircle } from 'lucide-react';

import type { Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';

/**
 * The pickers are keyed by stable ids, never by display text: the label is looked
 * up in `home.search.*` and the query parameters in the maps below, so translating
 * a label can never silently change what the search actually filters on.
 */
const CITIES = ['sofia', 'plovdiv', 'varna', 'burgas', 'haskovo'] as const;
const PROPERTY_TYPES = ['room', 'apartment', 'roommate'] as const;
const OCCUPANT_OPTIONS = ['1', '2', '3', '4', '5+'] as const;
const FEATURE_FLAGS = ['furnished', 'petsOk', 'girlsOnly', 'nearMetro'] as const;

type City = (typeof CITIES)[number];
type PropertyType = (typeof PROPERTY_TYPES)[number];
type Occupants = (typeof OCCUPANT_OPTIONS)[number];
type FeatureFlag = (typeof FEATURE_FLAGS)[number];

type ActiveDropdown = 'city' | 'propertyType' | 'occupants' | null;

/** `roommate` is not a property type — it maps onto the roommate-friendly flag. */
const PROPERTY_TYPE_PARAMS: Record<PropertyType, Record<string, string>> = {
  room: { propertyType: 'ROOM' },
  apartment: { propertyType: 'APARTMENT' },
  roommate: { roommateFriendly: 'true' },
};

const FLAG_PARAMS: Record<FeatureFlag, Record<string, string>> = {
  furnished: { isFurnished: 'true' },
  petsOk: { petsAllowed: 'true' },
  girlsOnly: { roommatePreference: 'WOMEN_ONLY' },
  nearMetro: { nearMetro: 'true' },
};

export function HeroSearch({ locale }: { locale: Locale }) {
  const t = useTranslations('home.search');
  const router = useRouter();
  const [isLoading, startSearch] = useTransition();
  const [activeDropdown, setActiveDropdown] = useState<ActiveDropdown>(null);
  const [city, setCity] = useState<City>('sofia');
  const [propertyType, setPropertyType] = useState<PropertyType>('room');
  const [budget, setBudget] = useState('');
  const [occupants, setOccupants] = useState<Occupants>('1');
  const [selectedFlags, setSelectedFlags] = useState<FeatureFlag[]>([]);
  const [error, setError] = useState<string | null>(null);

  const toggleDropdown = (dropdown: ActiveDropdown) => {
    setActiveDropdown((currentDropdown) => (currentDropdown === dropdown ? null : dropdown));
  };

  const toggleFlag = (flag: FeatureFlag) => {
    setSelectedFlags((currentFlags) =>
      currentFlags.includes(flag)
        ? currentFlags.filter((currentFlag) => currentFlag !== flag)
        : [...currentFlags, flag],
    );
  };

  const handleSearch = () => {
    setError(null);

    if (!city) {
      setError(t('cityRequired'));
      return;
    }

    const params = new URLSearchParams({
      citySlug: city,
      ...PROPERTY_TYPE_PARAMS[propertyType],
      // "5+" has no upper bound, so it filters on at least 5 occupants.
      maxOccupants: occupants.replace('+', ''),
      ...Object.assign({}, ...selectedFlags.map((flag) => FLAG_PARAMS[flag])),
    });

    const maxRent = Number(budget);

    if (Number.isFinite(maxRent) && maxRent > 0) {
      params.set('maxRentCents', String(Math.round(maxRent * 100)));
    }

    startSearch(() => {
      router.push(routes.listings(locale, params.toString()));
    });
  };

  return (
    <div className="relative z-30 mx-auto w-full max-w-[1560px] px-6 lg:px-10">
      <div className="rounded-[26px] bg-brand-surface px-4 py-4 shadow-[0_28px_70px_-12px_rgba(75,55,35,0.30)] md:px-6 md:py-5">
        <div className="grid grid-cols-1 md:grid-cols-[1.05fr_1fr_0.95fr_0.8fr_auto] md:items-center">
          <SearchSelect
            icon={<MapPin size={26} strokeWidth={1.8} />}
            label={t('whereLabel')}
            value={city}
            optionLabel={(option) => t(`cities.${option}`)}
            isOpen={activeDropdown === 'city'}
            options={CITIES}
            onToggle={() => toggleDropdown('city')}
            onSelect={(selectedCity) => {
              setCity(selectedCity);
              setActiveDropdown(null);
            }}
          />

          <SearchSelect
            icon={<Home size={26} strokeWidth={1.8} />}
            label={t('whatLabel')}
            value={propertyType}
            optionLabel={(option) => t(`propertyTypes.${option}`)}
            isOpen={activeDropdown === 'propertyType'}
            options={PROPERTY_TYPES}
            onToggle={() => toggleDropdown('propertyType')}
            onSelect={(selectedPropertyType) => {
              setPropertyType(selectedPropertyType);
              setActiveDropdown(null);
            }}
          />

          <BudgetInput value={budget} onChange={setBudget} />

          <SearchSelect
            icon={<UserRound size={26} strokeWidth={1.8} />}
            label={t('peopleLabel')}
            value={occupants}
            isOpen={activeDropdown === 'occupants'}
            options={OCCUPANT_OPTIONS}
            onToggle={() => toggleDropdown('occupants')}
            onSelect={(selectedOccupants) => {
              setOccupants(selectedOccupants);
              setActiveDropdown(null);
            }}
          />

          <button
            type="button"
            onClick={handleSearch}
            disabled={isLoading}
            className="mt-4 flex h-[60px] w-full items-center justify-center gap-2.5 rounded-full bg-brand-terracotta px-10 text-[17px] font-semibold text-white shadow-[0_10px_24px_-6px_rgba(200,91,54,0.55)] transition hover:bg-brand-terracotta-hover disabled:opacity-50 disabled:cursor-not-allowed md:ml-4 md:mt-0 md:w-auto"
            aria-busy={isLoading}
          >
            <Search size={19} strokeWidth={2.2} />
            {isLoading ? t('searching') : t('searchButton')}
          </button>
        </div>

        {error && (
          <div
            className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-red-700"
            role="alert"
            aria-live="assertive"
          >
            <AlertCircle size={18} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap justify-start gap-2 md:justify-center">
        {FEATURE_FLAGS.map((flag) => {
          const isSelected = selectedFlags.includes(flag);

          return (
            <button
              key={flag}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggleFlag(flag)}
              className={[
                'rounded-full border px-4 py-2 text-sm font-medium shadow-sm transition',
                isSelected
                  ? 'border-brand-terracotta bg-brand-terracotta text-white'
                  : 'border-brand-border bg-brand-chip text-brand-olive hover:border-brand-terracotta hover:text-brand-terracotta',
              ].join(' ')}
            >
              {t(`flags.${flag}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SearchSelect<TOption extends string>({
  icon,
  label,
  value,
  options,
  optionLabel,
  isOpen,
  onToggle,
  onSelect,
}: {
  icon: ReactNode;
  label: string;
  value: TOption;
  options: readonly TOption[];
  /** Omitted when the option is already display-ready (e.g. the occupant counts). */
  optionLabel?: (option: TOption) => string;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (option: TOption) => void;
}) {
  const t = useTranslations('home.search');
  const display = (option: TOption) => optionLabel?.(option) ?? option;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      if (isOpen) onToggle();
    }
  };

  return (
    <div className="relative border-b border-brand-border md:border-b-0 md:border-r">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={t('selectOption', { label, value: display(value) })}
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        className="flex w-full min-w-0 items-center gap-4 px-2 py-4 text-left md:px-6 md:py-2 focus-visible:outline-2 focus-visible:outline-brand-terracotta"
      >
        <span className="shrink-0 text-brand-olive" aria-hidden="true">
          {icon}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-base font-bold leading-5 text-brand-ink">{label}</span>
          <span className="mt-1 block truncate text-[15px] leading-5 text-brand-muted">
            {display(value)}
          </span>
        </span>

        <ChevronDown size={17} className="shrink-0 text-brand-muted" aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 top-[calc(100%+12px)] z-50 w-56 overflow-hidden rounded-2xl border border-brand-border bg-white p-2 shadow-[0_18px_45px_rgba(75,55,35,0.16)]"
          role="listbox"
          aria-label={t('optionsLabel', { label })}
        >
          {options.map((option) => (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={option === value}
              onClick={() => onSelect(option)}
              className="block w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-brand-ink transition hover:bg-brand-chip focus-visible:outline-2 focus-visible:outline-brand-terracotta"
            >
              {display(option)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BudgetInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const t = useTranslations('home.search');

  return (
    <div className="flex min-w-0 items-center gap-4 border-b border-brand-border px-2 py-4 md:border-b-0 md:border-r md:px-6 md:py-2">
      <span className="shrink-0 text-brand-olive">
        <Wallet size={26} strokeWidth={1.8} />
      </span>

      <label className="min-w-0 flex-1">
        <span className="block text-base font-bold leading-5 text-brand-ink">
          {t('budgetLabel')}
        </span>

        <span className="mt-1 flex items-center gap-1 text-[15px] leading-5 text-brand-muted">
          €
          <input
            value={value}
            min={0}
            inputMode="numeric"
            type="number"
            placeholder={t('budgetPlaceholder')}
            onChange={(event) => onChange(event.target.value)}
            className="w-full bg-transparent text-[15px] text-brand-muted outline-none placeholder:text-brand-muted/70"
          />
        </span>
      </label>
    </div>
  );
}
