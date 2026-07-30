'use client';

import { useMutation } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { apiClient } from '@/lib/api-client';
import type { Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import { cn } from '@/utils';

type SaveListingButtonProps = {
  listingId: string;
  listingTitle: string;
  locale: Locale;
  initialSaved: boolean;
  isAuthenticated: boolean;
  /** `overlay` is the circular button on a card image, `inline` a labelled pill. */
  variant?: 'overlay' | 'inline';
  className?: string;
};

// `z-20` keeps the heart above the full-card link overlay in `ListingCard`.
const OVERLAY_CLASSES =
  'absolute right-2.5 top-2.5 z-20 rounded-full bg-white/95 p-2 text-brand-ink shadow-sm transition hover:scale-105 hover:text-brand-terracotta focus-visible:outline-2 focus-visible:outline-brand-terracotta';

const INLINE_CLASSES =
  'inline-flex items-center justify-center gap-2 rounded-[10px] border border-brand-border bg-white px-4 py-2.5 text-[14px] font-bold text-brand-ink transition hover:border-brand-terracotta hover:text-brand-terracotta focus-visible:outline-2 focus-visible:outline-brand-terracotta disabled:opacity-60';

export function SaveListingButton({
  className,
  initialSaved,
  isAuthenticated,
  listingId,
  listingTitle,
  locale,
  variant = 'overlay',
}: SaveListingButtonProps) {
  const pathname = usePathname();
  const t = useTranslations('listings.common');
  const [saved, setSaved] = useState(initialSaved);

  const toggle = useMutation({
    mutationFn: (next: boolean) =>
      next
        ? apiClient.post(`/api/listings/${listingId}/favorite`)
        : apiClient.delete(`/api/listings/${listingId}/favorite`),
    // Optimistic: the heart is a low-stakes toggle, so waiting on the round trip
    // would only make it feel broken. A failure rolls the icon back.
    onMutate: (next) => {
      setSaved(next);
      return { previous: !next };
    },
    onError: (_error, _next, context) => {
      setSaved(context?.previous ?? initialSaved);
    },
  });

  const label = `${saved ? t('saved') : t('save')} — ${listingTitle}`;
  const icon = (
    <Heart
      aria-hidden="true"
      className={saved ? 'fill-brand-terracotta text-brand-terracotta' : undefined}
      size={variant === 'overlay' ? 16 : 17}
      strokeWidth={2}
    />
  );

  if (!isAuthenticated) {
    return (
      <Link
        aria-label={variant === 'overlay' ? t('signInToSave') : undefined}
        className={cn(variant === 'overlay' ? OVERLAY_CLASSES : INLINE_CLASSES, className)}
        href={routes.login(pathname)}
        title={t('signInToSave')}
      >
        {icon}
        {variant === 'inline' && t('save')}
      </Link>
    );
  }

  return (
    <button
      aria-label={variant === 'overlay' ? label : undefined}
      aria-pressed={saved}
      className={cn(variant === 'overlay' ? OVERLAY_CLASSES : INLINE_CLASSES, className)}
      disabled={toggle.isPending}
      onClick={(event) => {
        // Cards wrap the button in a Link; without this the navigation wins.
        event.preventDefault();
        event.stopPropagation();
        toggle.mutate(!saved);
      }}
      type="button"
    >
      {icon}
      {variant === 'inline' && (saved ? t('saved') : t('save'))}
    </button>
  );
}
