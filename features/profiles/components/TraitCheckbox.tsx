import type { InputHTMLAttributes } from 'react';

type TraitCheckboxProps = { label: string } & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'className' | 'type'
>;

/**
 * A lifestyle tag as a toggle chip. A real checkbox underneath, so it works in the
 * settings form (controlled) and in the find-roommate GET form (plain `name`/`value`).
 */
export function TraitCheckbox({ label, ...input }: TraitCheckboxProps) {
  return (
    <label className="cursor-pointer rounded-full border border-brand-border bg-white px-3 py-1.5 text-[13px] text-brand-ink transition hover:border-brand-terracotta/60 has-[:checked]:border-brand-terracotta has-[:checked]:bg-brand-terracotta/10 has-[:checked]:text-brand-terracotta has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-terracotta">
      <input className="sr-only" type="checkbox" {...input} />
      {label}
    </label>
  );
}
