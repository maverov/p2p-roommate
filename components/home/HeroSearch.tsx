'use client';

import {
  AlertCircle,
  BedDouble,
  Building2,
  Check,
  CircleParking,
  MapPin,
  Search,
  SlidersHorizontal,
  Users,
  UsersRound,
} from 'lucide-react';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCallback, useId, useRef, useState, useTransition, type ReactNode } from 'react';

import { CityCombobox } from '@/features/areas/components/CityCombobox';
import { useDismiss } from '@/hooks';
import { hasMetro, type CityId } from '@/lib/areas';
import type { Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import { cn } from '@/utils';

/**
 * The controls are keyed by stable ids, never by display text: the label is looked
 * up in `home.search.*` and the query parameters in the maps below, so translating
 * a label can never silently change what the search actually filters on.
 */
const SEARCH_TABS = [
  { id: 'apartment', icon: Building2 },
  { id: 'room', icon: BedDouble },
  { id: 'roommate', icon: Users },
  { id: 'parking', icon: CircleParking },
] as const;

const OCCUPANT_OPTIONS = ['1', '2', '3', '4', '5+'] as const;
const FEATURE_FLAGS = [
  'furnished',
  'petsOk',
  'girlsOnly',
  'evCharging',
  'gatedAccess',
  'nearMetro',
] as const;

type SearchTab = (typeof SEARCH_TABS)[number]['id'];
type Occupants = (typeof OCCUPANT_OPTIONS)[number];
type FeatureFlag = (typeof FEATURE_FLAGS)[number];

type ActiveDropdown = 'budget' | 'occupants' | 'preferences' | null;

/**
 * What each tab contributes to the search. A tab is a selection, not a link — picking
 * one only changes the filters the search will carry, and the button runs it.
 */
const TAB_PARAMS: Record<SearchTab, Record<string, string>> = {
  apartment: { propertyType: 'APARTMENT,STUDIO,HOUSE' },
  room: { propertyType: 'ROOM' },
  // Not a property type of its own — it maps onto the roommate-friendly flag.
  roommate: { roommateFriendly: 'true' },
  // `/parking` pins `kind=PARKING` itself, so the tab has nothing left to add.
  parking: {},
};

/**
 * Parking runs against its own search. A parking row stores no occupants and none of
 * the household fields, so on `/listings` the home filters would match nothing at all.
 */
const TAB_ROUTES: Record<SearchTab, (locale: Locale, search?: string) => Route> = {
  apartment: routes.listings,
  room: routes.listings,
  roommate: routes.listings,
  parking: routes.parking,
};

const FLAG_PARAMS: Record<FeatureFlag, Record<string, string>> = {
  furnished: { isFurnished: 'true' },
  petsOk: { petsAllowed: 'true' },
  girlsOnly: { roommatePreference: 'WOMEN_ONLY' },
  evCharging: { evCharging: 'true' },
  gatedAccess: { gatedAccess: 'true' },
  nearMetro: { nearMetro: 'true' },
};

/**
 * The preferences each tab offers. Furnishing, pets and the household describe a home;
 * charging and gated access describe a parking spot. Only the location suits both — and
 * it still needs a city that has a metro, which `availableFlags` checks separately.
 */
const HOME_FLAGS = ['furnished', 'petsOk', 'girlsOnly', 'nearMetro'] as const;

const TAB_FLAGS: Record<SearchTab, readonly FeatureFlag[]> = {
  apartment: HOME_FLAGS,
  room: HOME_FLAGS,
  roommate: HOME_FLAGS,
  parking: ['evCharging', 'gatedAccess', 'nearMetro'],
};

/** Every field is the same boxed control, so the row reads as one strip of inputs. */
const FIELD_BOX =
  'relative flex h-13 w-full items-center gap-2.5 rounded-[14px] border border-brand-border bg-white px-3.5 transition focus-within:border-brand-terracotta';

const PANEL =
  'absolute left-0 top-[calc(100%+8px)] z-50 w-full min-w-[15rem] rounded-2xl border border-brand-border bg-white p-2 shadow-[0_18px_45px_rgba(75,55,35,0.16)]';

const PANEL_ROW =
  'flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium text-brand-ink transition hover:bg-brand-chip';

/** Rent is stored in cents; a blank or non-positive bound is simply no bound at all. */
function setRentBound(params: URLSearchParams, key: string, value: string) {
  const amount = Number(value);

  if (Number.isFinite(amount) && amount > 0) {
    params.set(key, String(Math.round(amount * 100)));
  }
}

export function HeroSearch({ locale }: { locale: Locale }) {
  const t = useTranslations('home.search');
  const router = useRouter();
  const [isLoading, startSearch] = useTransition();
  const tabGroupName = useId();
  const cityInputId = useId();

  const [tab, setTab] = useState<SearchTab>('apartment');
  const [activeDropdown, setActiveDropdown] = useState<ActiveDropdown>(null);
  const [city, setCity] = useState<CityId | ''>('');
  const [minRent, setMinRent] = useState('');
  const [maxRent, setMaxRent] = useState('');
  const [occupants, setOccupants] = useState<Occupants | ''>('');
  const [selectedFlags, setSelectedFlags] = useState<FeatureFlag[]>([]);
  const [error, setError] = useState<string | null>(null);

  // A parking spot holds no occupants, and "near the metro" only means something in a city
  // that has one. A control the tab hides must not filter either, so the search below reads
  // these derived values rather than the raw state.
  const acceptsOccupants = tab !== 'parking';
  const availableFlags = TAB_FLAGS[tab].filter((flag) => flag !== 'nearMetro' || hasMetro(city));
  const activeFlags = selectedFlags.filter((flag) => availableFlags.includes(flag));

  const closeDropdown = useCallback(() => setActiveDropdown(null), []);

  const toggleDropdown = (dropdown: ActiveDropdown) =>
    setActiveDropdown((current) => (current === dropdown ? null : dropdown));

  const toggleFlag = (flag: FeatureFlag) =>
    setSelectedFlags((flags) =>
      flags.includes(flag) ? flags.filter((current) => current !== flag) : [...flags, flag],
    );

  const describeBudget = () => {
    const from = minRent ? `€${minRent}` : '';
    const to = maxRent ? `€${maxRent}` : '';

    if (from && to) return `${from} – ${to}`;
    if (to) return t('budgetTo', { max: to });
    if (from) return t('budgetFrom', { min: from });

    return '';
  };

  const describePreferences = () => {
    if (activeFlags.length === 0) return '';
    if (activeFlags.length === 1) return t(`flags.${activeFlags[0]}`);

    return t('preferencesSelected', { count: activeFlags.length });
  };

  const handleSearch = () => {
    setError(null);

    if (!city) {
      setError(t('cityRequired'));
      return;
    }

    const params = new URLSearchParams({ citySlug: city, ...TAB_PARAMS[tab] });

    for (const flag of activeFlags) {
      for (const [key, value] of Object.entries(FLAG_PARAMS[flag])) {
        params.set(key, value);
      }
    }

    if (acceptsOccupants && occupants) {
      // "5+" has no upper bound, so it filters on at least 5 occupants.
      params.set('maxOccupants', occupants.replace('+', ''));
    }

    setRentBound(params, 'minRentCents', minRent);
    setRentBound(params, 'maxRentCents', maxRent);

    startSearch(() => router.push(TAB_ROUTES[tab](locale, params.toString())));
  };

  return (
    <div className="relative z-30 mx-auto w-full max-w-[1560px] px-6 lg:px-10">
      {/*
        The tab ledge. It carries the card's own surface, so the two read as one raised shape
        with a tab rising out of the top-left corner rather than as a strip laid on top, and
        the card squares off the corner this ledge now rounds. The ledge sits flush on the
        card and carries no bottom border of its own: the card's top border alone draws the
        hairline dividing the tabs from the fields, so it stays one even weight the whole way
        across instead of doubling up under the tabs. The shadow is cast upwards only — a
        full one would smudge that hairline.

        Native radios carry the "one of four" semantics and arrow-key navigation for free.
      */}
      <div
        aria-label={t('tabsLabel')}
        className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-t-[22px] bg-brand-surface px-2.5 pb-2.5 pt-2.5 shadow-[0_-10px_28px_-12px_rgba(75,55,35,0.22)]"
        role="radiogroup"
      >
        {SEARCH_TABS.map(({ id, icon: Icon }) => (
          <label className="shrink-0" key={id}>
            <input
              checked={tab === id}
              className="peer sr-only"
              name={tabGroupName}
              onChange={() => setTab(id)}
              type="radio"
              value={id}
            />

            <span className="flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-[14px] font-medium text-brand-muted transition hover:bg-brand-sand/50 hover:text-brand-terracotta peer-checked:bg-brand-terracotta/10 peer-checked:font-semibold peer-checked:text-brand-terracotta peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-terracotta">
              <Icon aria-hidden="true" size={17} strokeWidth={1.9} />
              {t(`tabs.${id}`)}
            </span>
          </label>
        ))}
      </div>

      <div className="relative rounded-3xl rounded-tl-none border-t border-brand-border/50 bg-brand-surface p-4 shadow-[0_28px_70px_-12px_rgba(75,55,35,0.30)] md:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.5fr_1fr_0.8fr_1.1fr_auto] md:items-end md:gap-4">
          <Field htmlFor={cityInputId} label={t('whereLabel')}>
            <div className={FIELD_BOX}>
              <MapPin
                aria-hidden="true"
                className="shrink-0 text-brand-olive"
                size={18}
                strokeWidth={1.9}
              />

              <CityCombobox
                id={cityInputId}
                locale={locale}
                onChange={(selected) => selected && setCity(selected)}
                onOpen={closeDropdown}
                placeholder={t('wherePlaceholder')}
                value={city}
                classNames={{
                  root: 'static min-w-0 flex-1',
                  input:
                    'w-full truncate bg-transparent text-[15px] leading-5 text-brand-ink outline-none placeholder:text-brand-muted/70',
                  toggle: 'right-0',
                  popup: 'top-[calc(100%+8px)]',
                }}
              />
            </div>
          </Field>

          <DropdownField
            icon={<SlidersHorizontal size={17} strokeWidth={1.9} />}
            isOpen={activeDropdown === 'budget'}
            label={t('budgetLabel')}
            onClose={closeDropdown}
            onToggle={() => toggleDropdown('budget')}
            panelClassName="min-w-[18rem]"
            placeholder={t('budgetPlaceholder')}
            value={describeBudget()}
          >
            <div className="flex items-center gap-2">
              <RentInput
                label={t('budgetMin')}
                onChange={setMinRent}
                placeholder={t('budgetMinPlaceholder')}
                value={minRent}
              />

              <span aria-hidden="true" className="text-brand-muted">
                –
              </span>

              <RentInput
                label={t('budgetMax')}
                onChange={setMaxRent}
                placeholder={t('budgetMaxPlaceholder')}
                value={maxRent}
              />
            </div>
          </DropdownField>

          <DropdownField
            haspopup="listbox"
            icon={<UsersRound size={17} strokeWidth={1.9} />}
            isDisabled={!acceptsOccupants}
            isOpen={activeDropdown === 'occupants'}
            label={t('peopleLabel')}
            onClose={closeDropdown}
            onToggle={() => toggleDropdown('occupants')}
            placeholder={t('peoplePlaceholder')}
            value={occupants}
          >
            <div aria-label={t('optionsLabel', { label: t('peopleLabel') })} role="listbox">
              {OCCUPANT_OPTIONS.map((option) => (
                <button
                  aria-selected={option === occupants}
                  className={cn(PANEL_ROW, 'justify-between')}
                  key={option}
                  onClick={() => {
                    setOccupants(option);
                    closeDropdown();
                  }}
                  role="option"
                  type="button"
                >
                  {option}

                  {option === occupants && (
                    <Check
                      aria-hidden="true"
                      className="shrink-0 text-brand-terracotta"
                      size={15}
                    />
                  )}
                </button>
              ))}
            </div>
          </DropdownField>

          <DropdownField
            icon={<Check size={17} strokeWidth={2.1} />}
            isDisabled={availableFlags.length === 0}
            isOpen={activeDropdown === 'preferences'}
            label={t('preferencesLabel')}
            onClose={closeDropdown}
            onToggle={() => toggleDropdown('preferences')}
            placeholder={t('preferencesPlaceholder')}
            value={describePreferences()}
          >
            <fieldset>
              <legend className="sr-only">{t('preferencesLabel')}</legend>

              {availableFlags.map((flag) => (
                <label className={PANEL_ROW} key={flag}>
                  <input
                    checked={selectedFlags.includes(flag)}
                    className="h-4 w-4 shrink-0 accent-brand-terracotta"
                    onChange={() => toggleFlag(flag)}
                    type="checkbox"
                  />
                  {t(`flags.${flag}`)}
                </label>
              ))}
            </fieldset>
          </DropdownField>

          <button
            aria-busy={isLoading}
            className="mt-1 flex h-13 w-full items-center justify-center gap-2.5 rounded-[14px] bg-brand-terracotta px-8 text-[16px] font-semibold text-white shadow-[0_10px_24px_-6px_rgba(200,91,54,0.55)] transition hover:bg-brand-terracotta-hover disabled:cursor-not-allowed disabled:opacity-50 md:mt-0 md:w-auto"
            disabled={isLoading}
            onClick={handleSearch}
            type="button"
          >
            <Search aria-hidden="true" size={18} strokeWidth={2.2} />
            {isLoading ? t('searching') : t('searchButton')}
          </button>
        </div>

        {error && (
          <div
            aria-live="assertive"
            className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-red-700"
            role="alert"
          >
            <AlertCircle aria-hidden="true" size={18} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * A field's caption. `htmlFor` always points at a labelable control — the city input or a
 * dropdown's trigger button — so clicking the caption focuses it; the triggers carry their
 * own `aria-label`, which names them with the current value rather than the caption alone.
 */
function Field({
  htmlFor,
  label,
  children,
}: {
  htmlFor: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label
        className="mb-1.5 block text-[13px] font-semibold leading-4 text-brand-ink"
        htmlFor={htmlFor}
      >
        {label}
      </label>

      {children}
    </div>
  );
}

/** A boxed trigger that shows the current selection, plus the panel that edits it. */
function DropdownField({
  label,
  value,
  placeholder,
  icon,
  isOpen,
  isDisabled = false,
  haspopup = 'dialog',
  panelClassName,
  onToggle,
  onClose,
  children,
}: {
  label: string;
  /** The current selection, already formatted; empty falls back to the placeholder. */
  value: string;
  placeholder: string;
  icon: ReactNode;
  isOpen: boolean;
  /** For a field the active tab does not apply, e.g. occupants on a parking spot. */
  isDisabled?: boolean;
  haspopup?: 'dialog' | 'listbox';
  panelClassName?: string;
  onToggle: () => void;
  onClose: () => void;
  children: ReactNode;
}) {
  const t = useTranslations('home.search');
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerId = useId();

  useDismiss({ isOpen, onDismiss: onClose, ref: containerRef });

  return (
    <Field htmlFor={triggerId} label={label}>
      <div className={cn(FIELD_BOX, isDisabled && 'opacity-50')} ref={containerRef}>
        <button
          aria-expanded={isOpen}
          aria-haspopup={haspopup}
          aria-label={t('selectOption', { label, value: value || placeholder })}
          className="flex min-w-0 flex-1 items-center gap-2.5 outline-none disabled:cursor-not-allowed"
          disabled={isDisabled}
          id={triggerId}
          onClick={onToggle}
          type="button"
        >
          <span
            className={cn(
              'min-w-0 flex-1 truncate text-left text-[15px] leading-5',
              value ? 'text-brand-ink' : 'text-brand-muted/70',
            )}
          >
            {value || placeholder}
          </span>

          <span aria-hidden="true" className="shrink-0 text-brand-olive">
            {icon}
          </span>
        </button>

        {isOpen && !isDisabled && <div className={cn(PANEL, panelClassName)}>{children}</div>}
      </div>
    </Field>
  );
}

/** One bound of the budget range. The caption is for screen readers; the box shows a placeholder. */
function RentInput({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="min-w-0 flex-1">
      <span className="sr-only">{label}</span>

      <span className="flex items-center gap-1 rounded-xl border border-brand-border bg-white px-3 py-2 text-[14px] text-brand-ink focus-within:border-brand-terracotta">
        €
        <input
          className="w-full min-w-0 bg-transparent outline-none placeholder:text-brand-muted/70"
          inputMode="numeric"
          min={0}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type="number"
          value={value}
        />
      </span>
    </label>
  );
}
