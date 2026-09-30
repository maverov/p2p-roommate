import type { ViewingRequestStatus } from '@/lib/labels';

/** Fragment id of the owner's request list on My Listings; notification emails deep-link to it. */
export const OWNER_REQUESTS_ANCHOR = 'viewing-requests';

export const VIEWING_REQUEST_STATUS_STYLES: Record<ViewingRequestStatus, string> = {
  REQUESTED: 'bg-amber-100 text-amber-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  DECLINED: 'bg-red-100 text-red-600',
  CANCELLED: 'bg-zinc-100 text-zinc-600',
};

/**
 * A review prompt makes sense only once the two sides have actually met: the owner
 * accepted and the agreed time has passed. The API accepts a review from the moment of
 * acceptance; this is the stricter product rule for when the UI offers one.
 */
export function isViewingCompleted(
  request: { status: ViewingRequestStatus; requestedStartAt: Date },
  now: Date,
) {
  return request.status === 'ACCEPTED' && request.requestedStartAt.getTime() <= now.getTime();
}
