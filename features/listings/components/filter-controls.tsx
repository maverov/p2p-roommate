'use client';

import { useEffect, useState } from 'react';

/**
 * The pieces every listing filter sidebar is built from.
 *
 * Homes and parking spots filter on almost disjoint sets of fields, so they have a sidebar
 * each; what they share is the look of a group, a checkbox row and a debounced input. Keeping
 * those here means the two sidebars cannot drift apart visually while their fields differ.
 */

export const FIELD =
  'w-full rounded-[10px] border border-brand-border bg-brand-chip px-3 py-2 text-[14px] text-brand-ink outline-none transition placeholder:text-brand-muted/70 focus:border-brand-terracotta focus:bg-white';

const CHECKBOX =
  'size-[15px] shrink-0 accent-brand-terracotta focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-terracotta';

export const centsToUnits = (cents: string | null) => {
  const value = Number(cents);

  return Number.isFinite(value) && value > 0 ? String(Math.round(value / 100)) : '';
};

export const unitsToCents = (units: string) => {
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
export function DebouncedInput({
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

export function Group({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="mt-5 border-t border-brand-border pt-4">
      <p className="mb-2 text-[13px] font-bold text-brand-ink">{label}</p>
      {children}
    </div>
  );
}

export function CheckboxRow({
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
