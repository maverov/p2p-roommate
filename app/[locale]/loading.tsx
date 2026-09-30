'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * Route-level fallback: navigation feedback appears at once instead of the old page
 * sitting unchanged while the next one renders. The navbar and footer stay mounted.
 */
export default function Loading() {
  const t = useTranslations('common');

  return (
    <div
      aria-live="polite"
      className="flex min-h-[50vh] animate-fade-in-delayed items-center justify-center"
      role="status"
    >
      <Loader2 aria-hidden="true" className="size-8 animate-spin text-brand-terracotta" />
      <span className="sr-only">{t('loading')}</span>
    </div>
  );
}
