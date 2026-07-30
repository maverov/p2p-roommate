'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Archive, Eye, Loader2, Pause, Pencil, Play } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { formatDate, formatMoneyFromCents } from '@/lib/format';
import type { Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import type { ListingDTO } from '../server/repository';

type Props = {
  listing: ListingDTO;
  locale: Locale;
};

type ListingStatus = 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'ARCHIVED';

/** Message keys per status — derived names would defeat the typed-key checking. */
const STATUS_LABEL_KEYS = {
  DRAFT: 'statusDraft',
  PUBLISHED: 'statusPublished',
  PAUSED: 'statusPaused',
  ARCHIVED: 'statusArchived',
} as const;

const STATUS_STYLES: Record<ListingStatus, string> = {
  DRAFT: 'bg-zinc-100 text-zinc-600',
  PUBLISHED: 'bg-green-100 text-green-700',
  PAUSED: 'bg-amber-100 text-amber-700',
  ARCHIVED: 'bg-red-100 text-red-600',
};

export function MyListingCard({ listing, locale }: Props) {
  const t = useTranslations('listings.myListings');
  const tListings = useTranslations('listings');
  const tEnums = useTranslations('enums');
  const queryClient = useQueryClient();
  const [confirmArchive, setConfirmArchive] = useState(false);

  const statusMutation = useMutation({
    mutationFn: (status: ListingStatus) =>
      apiClient.patch(`/api/listings/${listing.id}`, { status }),
    onSuccess: () => {
      // Bust the my-listings cache when it exists.
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      setConfirmArchive(false);
      // Reload to get fresh RSC data — lightweight since this page has no heavy data.
      window.location.reload();
    },
  });

  const status = listing.status as ListingStatus;
  const isPending = statusMutation.isPending;

  const coverImage = listing.images[0];
  const rent = formatMoneyFromCents(listing.monthlyRentCents, listing.currency, locale);

  return (
    <article className="relative flex flex-col overflow-hidden rounded-2xl border border-brand-border bg-white transition hover:shadow-md">
      {/* Cover image with absolute overlay link */}
      <div className="relative h-40 bg-brand-chip">
        {coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImage.url}
            alt={coverImage.alt}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-brand-muted/40">
            <Eye className="size-8" />
          </div>
        )}
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[12px] font-medium ${STATUS_STYLES[status]}`}
        >
          {t(STATUS_LABEL_KEYS[status])}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="text-[13px] text-brand-muted">
            {tEnums(`propertyType.${listing.propertyType}`)} · {rent}/
            {tListings('common.perMonth')}
          </p>
          <h3 className="mt-0.5 line-clamp-2 text-[15px] font-semibold text-brand-ink">
            {listing.title}
          </h3>
        </div>

        <p className="text-[12px] text-brand-muted">
          {listing.publishedAt
            ? `${t('publishedAt')} ${formatDate(listing.publishedAt, locale)}`
            : listing.updatedAt
              ? `${t('updatedAt')} ${formatDate(listing.updatedAt, locale)}`
              : t('unpublished')}
        </p>

        {/* Quick-action buttons */}
        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          {status === 'DRAFT' || status === 'PAUSED' ? (
            <ActionButton
              label={t('actionPublish')}
              icon={<Play className="size-3.5" />}
              onClick={() => statusMutation.mutate('PUBLISHED')}
              disabled={isPending}
              variant="primary"
            />
          ) : null}

          {status === 'PUBLISHED' ? (
            <ActionButton
              label={t('actionPause')}
              icon={<Pause className="size-3.5" />}
              onClick={() => statusMutation.mutate('PAUSED')}
              disabled={isPending}
            />
          ) : null}

          {status !== 'ARCHIVED' ? (
            confirmArchive ? (
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-red-600">{t('confirmArchive')}</span>
                <button
                  className="rounded-lg bg-red-600 px-2 py-1 text-[12px] text-white hover:bg-red-700 disabled:opacity-50"
                  onClick={() => statusMutation.mutate('ARCHIVED')}
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="size-3 animate-spin" /> : t('actionArchive')}
                </button>
                <button
                  className="text-[12px] text-brand-muted hover:text-brand-ink"
                  onClick={() => setConfirmArchive(false)}
                >
                  ✕
                </button>
              </div>
            ) : (
              <ActionButton
                label={t('actionArchive')}
                icon={<Archive className="size-3.5" />}
                onClick={() => setConfirmArchive(true)}
                disabled={isPending}
                variant="danger"
              />
            )
          ) : null}

          {/*
            Edit and View links — z-20 to sit above the overlay link. Archived
            listings are read-only, so editing one is not offered.
          */}
          <div className="relative z-20 ml-auto flex items-center gap-2">
            {status !== 'ARCHIVED' && (
              <Link
                href={routes.editListing(locale, listing.id)}
                className="flex items-center gap-1 rounded-xl border border-brand-border px-2.5 py-1.5 text-[12px] font-medium text-brand-ink hover:bg-brand-chip"
              >
                <Pencil className="size-3.5" />
                {t('actionEdit')}
              </Link>
            )}

            {status === 'PUBLISHED' && (
              <Link
                href={routes.listing(locale, listing.id)}
                className="flex items-center gap-1 rounded-xl border border-brand-border px-2.5 py-1.5 text-[12px] font-medium text-brand-ink hover:bg-brand-chip"
              >
                <Eye className="size-3.5" />
                {t('actionView')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function ActionButton({
  label,
  icon,
  onClick,
  disabled,
  variant = 'default',
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary' | 'danger';
}) {
  const styles = {
    default:
      'border border-brand-border text-brand-ink hover:bg-brand-chip',
    primary:
      'bg-brand-terracotta text-white hover:bg-brand-terracotta/90',
    danger:
      'border border-red-200 text-red-600 hover:bg-red-50',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[12px] font-medium transition disabled:opacity-50 ${styles[variant]}`}
    >
      {disabled ? <Loader2 className="size-3.5 animate-spin" /> : icon}
      {label}
    </button>
  );
}
