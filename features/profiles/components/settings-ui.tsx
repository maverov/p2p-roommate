import { CheckCircle2, Loader2 } from 'lucide-react';

/** Shared look for every settings section, matching the listing form's cards. */
export const SETTINGS_SECTION = 'space-y-4 rounded-2xl border border-brand-border bg-white p-5';
export const SETTINGS_LABEL = 'mb-1 block text-[13px] font-medium text-brand-ink';
export const SETTINGS_FIELD =
  'w-full rounded-[10px] border border-brand-border bg-white px-3 py-2 text-[14px] text-brand-ink outline-none transition focus:border-brand-terracotta focus:ring-1 focus:ring-brand-terracotta/30 disabled:opacity-60';
export const SETTINGS_BUTTON =
  'inline-flex items-center gap-2 rounded-xl bg-brand-terracotta px-5 py-2.5 text-[14px] font-medium text-white transition hover:bg-brand-terracotta/90 disabled:opacity-60';

type SettingsSaveBarProps = {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  labels: { save: string; saving: string; saved: string; failed: string };
};

export function SettingsSaveBar({ isPending, isSuccess, isError, labels }: SettingsSaveBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <p aria-live="polite" className="text-[13px]">
        {isSuccess && (
          <span className="inline-flex items-center gap-1 text-brand-olive">
            <CheckCircle2 aria-hidden="true" className="size-4" />
            {labels.saved}
          </span>
        )}
        {isError && <span className="text-red-600">{labels.failed}</span>}
      </p>
      <button className={SETTINGS_BUTTON} disabled={isPending} type="submit">
        {isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
        {isPending ? labels.saving : labels.save}
      </button>
    </div>
  );
}
