'use client';

import { useMutation } from '@tanstack/react-query';
import { Bookmark } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { apiClient } from '@/lib/api-client';
import type { Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import { cn } from '@/utils';

type SaveProfileButtonProps = {
  profileUserId: string;
  displayName: string;
  locale: Locale;
  initialSaved: boolean;
  isAuthenticated: boolean;
  className?: string;
};

const BUTTON =
  'inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-brand-border bg-white px-4 py-2.5 text-[14px] font-bold text-brand-ink transition hover:border-brand-terracotta hover:text-brand-terracotta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terracotta disabled:opacity-60';

export function SaveProfileButton({
  className,
  displayName,
  initialSaved,
  isAuthenticated,
  locale,
  profileUserId,
}: SaveProfileButtonProps) {
  const pathname = usePathname();
  const t = useTranslations('profiles.common');
  const [saved, setSaved] = useState(initialSaved);

  const toggle = useMutation({
    mutationFn: (next: boolean) =>
      next
        ? apiClient.post(`/api/profiles/${profileUserId}/favorite`)
        : apiClient.delete(`/api/profiles/${profileUserId}/favorite`),
    // Optimistic for the same reason as the listing heart: a bookmark is
    // low-stakes, and waiting on the round trip only makes it feel broken.
    onMutate: (next) => {
      setSaved(next);
      return { previous: !next };
    },
    onError: (_error, _next, context) => {
      setSaved(context?.previous ?? initialSaved);
    },
  });

  const icon = (
    <Bookmark
      aria-hidden="true"
      className={saved ? 'fill-brand-terracotta text-brand-terracotta' : undefined}
      size={16}
      strokeWidth={2}
    />
  );

  if (!isAuthenticated) {
    return (
      <Link className={cn(BUTTON, className)} href={routes.login(pathname)}>
        {icon}
        {t('signInToSave')}
      </Link>
    );
  }

  return (
    <button
      aria-label={`${saved ? t('saved') : t('save')} — ${displayName}`}
      aria-pressed={saved}
      className={cn(BUTTON, className)}
      disabled={toggle.isPending}
      onClick={() => toggle.mutate(!saved)}
      type="button"
    >
      {icon}
      {saved ? t('saved') : t('save')}
    </button>
  );
}
