'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

import type { ListingSort } from '@/features/listings/schemas';
import type { Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';

type ListingSortSelectProps = {
  locale: Locale;
  value: ListingSort;
};

const SORT_OPTIONS: ListingSort[] = ['newest', 'price-asc', 'price-desc'];

export function ListingSortSelect({ locale, value }: ListingSortSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('listings.search');
  const [isPending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2 text-[13px] text-brand-muted">
      <span className="whitespace-nowrap">{t('sortLabel')}</span>

      <select
        className="rounded-[10px] border border-brand-border bg-white px-3 py-2 text-[13px] font-medium text-brand-ink outline-none transition focus:border-brand-terracotta disabled:opacity-60"
        disabled={isPending}
        onChange={(event) => {
          const next = new URLSearchParams(searchParams.toString());
          next.set('sort', event.target.value);
          // A re-sort invalidates the current page offset.
          next.delete('page');

          startTransition(() => {
            router.replace(routes.listings(locale, next.toString()), { scroll: false });
          });
        }}
        value={value}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {t(`sort.${option}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
