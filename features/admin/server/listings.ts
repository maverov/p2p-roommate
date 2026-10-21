import 'server-only';

import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { listings } from '@/db/schema';
import { ApiError } from '@/lib/server/api';

/** Takes a listing out of search and off its public page; the owner can no longer edit it. */
export async function archiveListing(listingId: string) {
  const [archived] = await db
    .update(listings)
    .set({ status: 'ARCHIVED', updatedAt: new Date() })
    .where(eq(listings.id, listingId))
    .returning({ id: listings.id, status: listings.status });

  if (!archived) {
    throw new ApiError(404, 'LISTING_NOT_FOUND', 'Listing was not found.');
  }

  return archived;
}

/** Restore to paused: the owner explicitly republishes after reviewing the listing. */
export async function restoreListing(listingId: string) {
  const [restored] = await db
    .update(listings)
    .set({ status: 'PAUSED', updatedAt: new Date() })
    .where(and(eq(listings.id, listingId), eq(listings.status, 'ARCHIVED')))
    .returning({ id: listings.id, status: listings.status });
  if (!restored) throw new ApiError(409, 'NOT_ARCHIVED', 'Only archived listings can be restored.');
  return restored;
}
