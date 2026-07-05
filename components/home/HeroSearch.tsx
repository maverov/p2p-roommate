'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown, Home, MapPin, Search, UserRound, Wallet } from 'lucide-react';

const CITIES = ['Sofia', 'Plovdiv', 'Varna', 'Burgas', 'Haskovo'] as const;
const PROPERTY_TYPES = ['Room', 'Apartment', 'Roommate'] as const;
const OCCUPANT_OPTIONS = ['1', '2', '3', '4', '5+'] as const;

const FEATURE_FLAGS = [
  'С обзавеждане',
  'Домашни любимци ОК',
  'Само момичета',
  'Близо до метро',
] as const;

type City = (typeof CITIES)[number];
type PropertyType = (typeof PROPERTY_TYPES)[number];
type Occupants = (typeof OCCUPANT_OPTIONS)[number];
type FeatureFlag = (typeof FEATURE_FLAGS)[number];

type ActiveDropdown = 'city' | 'propertyType' | 'occupants' | null;

export function HeroSearch() {
  const [activeDropdown, setActiveDropdown] = useState<ActiveDropdown>(null);
  const [city, setCity] = useState<City>('Sofia');
  const [propertyType, setPropertyType] = useState<PropertyType>('Room');
  const [budget, setBudget] = useState('');
  const [occupants, setOccupants] = useState<Occupants>('1');
  const [selectedFlags, setSelectedFlags] = useState<FeatureFlag[]>([]);

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
    const searchPayload = {
      city,
      propertyType,
      budgetEuro: budget,
      occupants,
      flags: selectedFlags,
    };

    console.log('Search payload:', searchPayload);
  };

  return (
    <div className="relative z-30 mt-10 w-full md:absolute md:left-1/2 md:top-[282px] md:mt-0 md:w-[calc(100%-48px)] md:max-w-[970px] md:-translate-x-1/2">
      <div className="rounded-[20px] bg-white px-4 py-4 shadow-[0_18px_45px_rgba(75,55,35,0.18)] md:px-6 md:py-5">
        <div className="grid grid-cols-1 md:grid-cols-[1.12fr_1.04fr_1fr_0.84fr_auto] md:items-center">
          <SearchSelect
            icon={<MapPin size={26} strokeWidth={1.8} />}
            label="Where?"
            value={city}
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
            label="What?"
            value={propertyType}
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
            label="People?"
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
            className="mt-4 flex h-[54px] w-full items-center justify-center gap-2 rounded-full bg-brand-terracotta px-9 text-base font-semibold text-white transition hover:bg-brand-terracotta-hover md:ml-4 md:mt-0 md:w-auto"
          >
            <Search size={19} strokeWidth={2.2} />
            Search
          </button>
        </div>
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
              {flag}
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
  isOpen,
  onToggle,
  onSelect,
}: {
  icon: ReactNode;
  label: string;
  value: TOption;
  options: readonly TOption[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (option: TOption) => void;
}) {
  return (
    <div className="relative border-b border-brand-border md:border-b-0 md:border-r">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={onToggle}
        className="flex w-full min-w-0 items-center gap-4 px-2 py-4 text-left md:px-5 md:py-0"
      >
        <span className="shrink-0 text-brand-olive">{icon}</span>

        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold leading-4 text-brand-ink">{label}</span>
          <span className="mt-1 block truncate text-sm leading-4 text-brand-muted">{value}</span>
        </span>

        <ChevronDown size={17} className="shrink-0 text-brand-muted" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+12px)] z-50 w-56 overflow-hidden rounded-2xl border border-brand-border bg-white p-2 shadow-[0_18px_45px_rgba(75,55,35,0.16)]">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(option)}
              className="block w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-brand-ink transition hover:bg-brand-chip"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BudgetInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex min-w-0 items-center gap-4 border-b border-brand-border px-2 py-4 md:border-b-0 md:border-r md:px-5 md:py-0">
      <span className="shrink-0 text-brand-olive">
        <Wallet size={26} strokeWidth={1.8} />
      </span>

      <label className="min-w-0 flex-1">
        <span className="block text-sm font-bold leading-4 text-brand-ink">Budget?</span>

        <span className="mt-1 flex items-center gap-1 text-sm leading-4 text-brand-muted">
          €
          <input
            value={value}
            min={0}
            inputMode="numeric"
            type="number"
            placeholder="Max"
            onChange={(event) => onChange(event.target.value)}
            className="w-full bg-transparent text-sm text-brand-muted outline-none placeholder:text-brand-muted/70"
          />
        </span>
      </label>
    </div>
  );
}
