'use client';

import { Check, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';

import { CITY_IDS, cityLabels, type CityId } from '@/lib/areas';
import type { Locale } from '@/lib/i18n';
import { cn } from '@/utils';

type CityValue = CityId | '';

type CityComboboxProps = {
  locale: Locale;
  /** Controlled selection; `''` is "no city". Omit it (and use `defaultValue`) inside a plain form. */
  value?: CityValue;
  defaultValue?: CityValue;
  onChange?: (city: CityValue) => void;
  /** Adds a first option that clears the selection, e.g. "All cities". */
  emptyLabel?: string;
  /** Submits the slug with a plain form, through a hidden input. */
  name?: string;
  id?: string;
  'aria-label'?: string;
  placeholder?: string;
  /** Lets a parent close its other pickers when this one opens. */
  onOpen?: () => void;
  /** Per-part overrides; `root: 'static'` anchors the toggle and popup to a larger parent field. */
  classNames?: { root?: string; input?: string; toggle?: string; popup?: string };
};

function normalize(text: string) {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}

/** Either language's name matches, at its start or at any word, so "sofia", "соф" and "tarn" all work. */
function matches(cityId: CityId, query: string) {
  return [cityLabels[cityId].bg, cityLabels[cityId].en].some((label) => {
    const name = normalize(label);

    return name.startsWith(query) || name.split(/[\s-]+/).some((word) => word.startsWith(query));
  });
}

export function CityCombobox({
  locale,
  value,
  defaultValue = '',
  onChange,
  emptyLabel,
  name,
  id,
  'aria-label': ariaLabel,
  placeholder,
  onOpen,
  classNames = {},
}: CityComboboxProps) {
  const t = useTranslations('common.cityPicker');
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [internalValue, setInternalValue] = useState<CityValue>(defaultValue);
  // `null` while not typing, so the input shows the selected city's name.
  const [query, setQuery] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const selected = value ?? internalValue;
  const hasEmptyOption = emptyLabel !== undefined;
  const allOptions: CityValue[] = hasEmptyOption ? ['', ...CITY_IDS] : CITY_IDS;
  const normalizedQuery = normalize(query ?? '');
  const options = normalizedQuery
    ? CITY_IDS.filter((cityId) => matches(cityId, normalizedQuery))
    : allOptions;

  const labelOf = (city: CityValue) => (city ? cityLabels[city][locale] : (emptyLabel ?? ''));
  const optionId = (index: number) => `${listboxId}-option-${index}`;

  useEffect(() => {
    if (isOpen && activeIndex >= 0) {
      document.getElementById(optionId(activeIndex))?.scrollIntoView({ block: 'nearest' });
    }
    // `optionId` only depends on `listboxId`, which never changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeIndex]);

  const open = () => {
    if (!isOpen) {
      setIsOpen(true);
      setActiveIndex(allOptions.indexOf(selected));
      onOpen?.();
    }
  };

  const close = () => {
    setIsOpen(false);
    setQuery(null);
    setActiveIndex(-1);
  };

  const select = (city: CityValue) => {
    if (value === undefined) {
      setInternalValue(city);
    }

    onChange?.(city);
    close();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (isOpen) {
          setActiveIndex((index) => Math.min(index + 1, options.length - 1));
        } else {
          open();
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen) {
          setActiveIndex((index) => Math.max(index - 1, 0));
        }
        break;
      case 'Enter':
        // Closed, Enter keeps its normal job of submitting the surrounding form.
        if (isOpen && options[activeIndex] !== undefined) {
          event.preventDefault();
          select(options[activeIndex]);
        }
        break;
      case 'Escape':
        if (isOpen) {
          event.preventDefault();
          close();
        }
        break;
    }
  };

  const activeOptionId = isOpen && options[activeIndex] !== undefined ? optionId(activeIndex) : undefined;

  return (
    <div className={cn('relative', classNames.root)}>
      <input
        aria-activedescendant={activeOptionId}
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        autoComplete="off"
        className={cn('pr-9', classNames.input)}
        id={id}
        onBlur={close}
        onChange={(event) => {
          setQuery(event.target.value);
          open();
          // After `open`, so the first match is highlighted rather than the old selection.
          setActiveIndex(0);
        }}
        onClick={(event) => {
          // Selecting on focus alone is undone by the mouseup, so typing would append to the name.
          if (query === null) event.currentTarget.select();
          open();
        }}
        onFocus={(event) => event.currentTarget.select()}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? emptyLabel}
        ref={inputRef}
        role="combobox"
        spellCheck={false}
        type="text"
        value={query ?? (selected ? labelOf(selected) : '')}
      />

      <button
        aria-label={t('showAll')}
        className={cn(
          'absolute inset-y-0 right-0 flex w-9 items-center justify-center text-brand-muted transition hover:text-brand-ink',
          classNames.toggle,
        )}
        // Keeps focus in the input, so the list does not close before it opens.
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          if (isOpen) {
            close();
          } else {
            setQuery(null);
            open();
            inputRef.current?.focus();
          }
        }}
        tabIndex={-1}
        type="button"
      >
        <ChevronDown aria-hidden="true" className={cn('transition', isOpen && 'rotate-180')} size={16} />
      </button>

      {name && <input name={name} type="hidden" value={selected} />}

      <div
        className={cn(
          'absolute left-0 top-[calc(100%+6px)] z-50 w-full min-w-48 overflow-hidden rounded-2xl border border-brand-border bg-white p-1.5 shadow-[0_18px_45px_rgba(75,55,35,0.16)]',
          classNames.popup,
        )}
        hidden={!isOpen}
        // A click on an option or the scrollbar must not blur the input first.
        onMouseDown={(event) => event.preventDefault()}
      >
        <ul aria-label={t('listLabel')} className="max-h-72 overflow-y-auto" id={listboxId} role="listbox">
          {options.map((city, index) => (
            <li
              aria-selected={city === selected}
              className={cn(
                'flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-brand-ink',
                index === activeIndex && 'bg-brand-chip',
              )}
              id={optionId(index)}
              key={city || 'none'}
              onClick={() => select(city)}
              onMouseEnter={() => setActiveIndex(index)}
              role="option"
            >
              {labelOf(city)}
              {city === selected && <Check aria-hidden="true" className="shrink-0 text-brand-terracotta" size={15} />}
            </li>
          ))}
        </ul>

        {options.length === 0 && (
          <p className="px-3 py-2.5 text-[14px] text-brand-muted" role="status">
            {t('noMatches')}
          </p>
        )}
      </div>
    </div>
  );
}
