'use client';

import { useMutation } from '@tanstack/react-query';
import { BellPlus, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import { ApiError, apiClient } from '@/lib/api-client';
import type { Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';

type SaveSearchButtonProps = {
  locale: Locale;
  isAuthenticated: boolean;
  /** Human name derived server-side from the active filters. */
  name: string;
};

const BUTTON =
  'flex items-center gap-2 rounded-[10px] border border-brand-border bg-white px-3.5 py-2 text-[13px] font-bold text-brand-ink transition hover:border-brand-terracotta hover:text-brand-terracotta focus-visible:outline-2 focus-visible:outline-brand-terracotta disabled:opacity-60';

export function SaveSearchButton({ isAuthenticated, locale, name }: SaveSearchButtonProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('listings.search');
  const tCommon = useTranslations('listings.common');

  const save = useMutation({
    mutationFn: () =>
      apiClient.post('/api/saved-searches', {
        name,
        // Stored as the raw query so re-running a saved search is a URL rebuild.
        filters: Object.fromEntries(searchParams.entries()),
        notificationsEnabled: true,
      }),
  });

  if (!isAuthenticated) {
    return (
      <Link
        className={BUTTON}
        href={routes.login(`${pathname}?${searchParams.toString()}`)}
      >
        <BellPlus aria-hidden="true" size={14} strokeWidth={2} />
        {t('signInToSaveSearch')}
      </Link>
    );
  }

  if (save.isSuccess) {
    return (
      <p className="flex items-center gap-2 rounded-[10px] border border-brand-olive/40 bg-[#f7f8ef] px-3.5 py-2 text-[13px] font-bold text-brand-ink">
        <Check aria-hidden="true" size={14} strokeWidth={2.4} />
        {t('searchSaved')}
      </p>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        className={BUTTON}
        disabled={save.isPending}
        onClick={() => save.mutate()}
        type="button"
      >
        <BellPlus aria-hidden="true" size={14} strokeWidth={2} />
        {t('saveSearch')}
      </button>

      {save.error && (
        <p className="text-[12px] text-brand-terracotta" role="alert">
          {save.error instanceof ApiError
            ? save.error.message
            : tCommon('loadFailed')}
        </p>
      )}
    </div>
  );
}
