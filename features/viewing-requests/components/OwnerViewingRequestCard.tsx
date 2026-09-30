import { CalendarClock } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

import { Avatar } from '@/components/shared/Avatar';
import { WriteReviewButton } from '@/features/reviews/components/WriteReviewButton';
import type { ViewingRequestListItem } from '@/features/viewing-requests/server/repository';
import { formatDateTime } from '@/lib/format';
import type { Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import { cn } from '@/utils';

import { VIEWING_REQUEST_STATUS_STYLES } from '../constants';

import { ViewingRequestDecision } from './ViewingRequestDecision';

type OwnerViewingRequestCardProps = {
  request: ViewingRequestListItem;
  locale: Locale;
  /** The viewing took place and the owner has not reviewed this tenant yet. */
  canReviewTenant: boolean;
};

export async function OwnerViewingRequestCard({
  request,
  locale,
  canReviewTenant,
}: OwnerViewingRequestCardProps) {
  const t = await getTranslations({ locale, namespace: 'listings.myListings.requests' });
  const tEnums = await getTranslations({ locale, namespace: 'enums' });
  const tReviews = await getTranslations({ locale, namespace: 'reviews.write' });

  return (
    <article className="flex flex-col gap-2 rounded-[15px] border border-brand-border bg-white p-4 shadow-[0_8px_24px_rgba(75,55,35,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            className="line-clamp-1 text-[12px] text-brand-muted hover:text-brand-terracotta"
            href={routes.listing(locale, request.listingId)}
          >
            {request.listingTitle}
          </Link>
          <h3 className="mt-1 flex items-center gap-2 text-[15px] font-bold text-brand-ink">
            <Avatar name={request.requesterName} size={24} src={request.requesterImage} />
            <Link
              className="truncate hover:text-brand-terracotta"
              href={routes.profile(locale, request.requesterId)}
            >
              {request.requesterName}
            </Link>
          </h3>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-medium',
            VIEWING_REQUEST_STATUS_STYLES[request.status],
          )}
        >
          {tEnums(`viewingRequestStatus.${request.status}`)}
        </span>
      </div>

      <p className="flex items-center gap-1.5 text-[13px] leading-5 text-brand-ink">
        <CalendarClock aria-hidden="true" size={14} strokeWidth={1.8} />
        {t('viewingAt', { date: formatDateTime(request.requestedStartAt, locale) })}
      </p>

      {request.message && (
        <p className="rounded-[10px] bg-brand-chip px-3 py-2 text-[13px] leading-5 text-brand-muted">
          <span className="font-semibold text-brand-ink">{t('theirNote')}:</span> {request.message}
        </p>
      )}

      {request.status === 'REQUESTED' && <ViewingRequestDecision requestId={request.id} />}

      {canReviewTenant && (
        <div>
          <WriteReviewButton
            label={tReviews('reviewTenant', { name: request.requesterName })}
            target={{ targetType: 'USER', targetUserId: request.requesterId }}
          />
        </div>
      )}
    </article>
  );
}
