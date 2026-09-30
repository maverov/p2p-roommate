import { CalendarClock } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import Link from 'next/link';

import { Avatar } from '@/components/shared/Avatar';
import { WriteReviewButton } from '@/features/reviews/components/WriteReviewButton';
import type { ViewingRequestListItem } from '@/features/viewing-requests/server/repository';
import { getCityLabel, getNeighborhoodLabel } from '@/lib/areas';
import { formatDateTime, formatMoneyFromCents } from '@/lib/format';
import type { Locale } from '@/lib/i18n';
import type { ViewingRequestStatus } from '@/lib/labels';
import { routes } from '@/lib/routes';
import { cn } from '@/utils';

import { isViewingCompleted, VIEWING_REQUEST_STATUS_STYLES } from '../constants';

import { CancelViewingRequestButton } from './CancelViewingRequestButton';

/** Mirrors the transitions `updateViewingRequest` allows a requester to make. */
const CANCELLABLE_STATUSES: ReadonlySet<ViewingRequestStatus> = new Set(['REQUESTED', 'ACCEPTED']);

type AppliedListingCardProps = {
  request: ViewingRequestListItem;
  locale: Locale;
  /** What the requester has already reviewed, so used prompts disappear. */
  reviewed: { listing: boolean; owner: boolean };
};

export async function AppliedListingCard({ request, locale, reviewed }: AppliedListingCardProps) {
  const t = await getTranslations({ locale, namespace: 'listings' });
  const tEnums = await getTranslations({ locale, namespace: 'enums' });
  const tReviews = await getTranslations({ locale, namespace: 'reviews.write' });
  // Once the viewing has happened, cancelling is meaningless and reviewing becomes possible.
  const isCompleted = isViewingCompleted(request, new Date());
  const reviewPrompts = {
    listing: isCompleted && !reviewed.listing,
    owner: isCompleted && !reviewed.owner,
  };

  const city = getCityLabel(request.listingCitySlug, locale);
  const neighborhood = getNeighborhoodLabel(
    request.listingCitySlug,
    request.listingNeighborhoodSlug,
    locale,
  );
  const location = neighborhood ? `${neighborhood}, ${city}` : city;
  const rent = formatMoneyFromCents(
    request.listingMonthlyRentCents,
    request.listingCurrency,
    locale,
  );

  return (
    <article className="group relative flex gap-4 rounded-[15px] border border-brand-border bg-white p-3 shadow-[0_8px_24px_rgba(75,55,35,0.06)] transition hover:shadow-[0_14px_30px_rgba(75,55,35,0.1)] sm:p-4">
      <div className="relative size-24 shrink-0 overflow-hidden rounded-[10px] bg-brand-border sm:size-28">
        {request.listingCoverImageUrl ? (
          // The title next to it already names the listing, so the thumbnail is decorative.
          <Image
            alt=""
            className="object-cover"
            fill
            sizes="112px"
            src={request.listingCoverImageUrl}
          />
        ) : (
          <span className="flex h-full items-center justify-center px-2 text-center text-[11px] text-brand-muted">
            {t('detail.noPhotos')}
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="line-clamp-1 text-[15px] font-bold leading-5 text-brand-ink">
            {request.listingTitle}
          </h2>
          <span
            className={cn(
              'shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-medium',
              VIEWING_REQUEST_STATUS_STYLES[request.status],
            )}
          >
            {tEnums(`viewingRequestStatus.${request.status}`)}
          </span>
        </div>

        <p className="line-clamp-1 text-[13px] leading-5 text-brand-muted">
          {location} · <span className="font-semibold text-brand-terracotta">{rent}</span>{' '}
          {t('common.perMonth')}
        </p>

        <p className="flex items-center gap-1.5 text-[13px] leading-5 text-brand-ink">
          <CalendarClock aria-hidden="true" size={14} strokeWidth={1.8} />
          {t('appliedListings.viewingAt', {
            date: formatDateTime(request.requestedStartAt, locale),
          })}
        </p>

        <p className="flex items-center gap-2 text-[12px] leading-4 text-brand-muted">
          <Avatar name={request.ownerName} size={20} src={request.ownerImage} />
          {request.ownerName}
        </p>

        {request.message && (
          <p className="mt-1 line-clamp-2 rounded-[10px] bg-brand-chip px-3 py-2 text-[13px] leading-5 text-brand-muted">
            <span className="font-semibold text-brand-ink">{t('appliedListings.yourNote')}:</span>{' '}
            {request.message}
          </p>
        )}

        {CANCELLABLE_STATUSES.has(request.status) && !isCompleted && (
          <div className="relative z-20 mt-1">
            <CancelViewingRequestButton requestId={request.id} />
          </div>
        )}

        {(reviewPrompts.listing || reviewPrompts.owner) && (
          <div className="relative z-20 mt-1 flex flex-wrap gap-2">
            {reviewPrompts.listing && (
              <WriteReviewButton
                label={tReviews('reviewListing')}
                target={{ targetType: 'LISTING', listingId: request.listingId }}
              />
            )}
            {reviewPrompts.owner && (
              <WriteReviewButton
                label={tReviews('reviewOwner', { name: request.ownerName })}
                target={{ targetType: 'USER', targetUserId: request.ownerId }}
              />
            )}
          </div>
        )}
      </div>

      <Link
        className="absolute inset-0 z-10 rounded-[15px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terracotta"
        href={routes.listing(locale, request.listingId)}
      >
        <span className="sr-only">{request.listingTitle}</span>
      </Link>
    </article>
  );
}
