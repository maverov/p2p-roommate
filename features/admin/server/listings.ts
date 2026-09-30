import 'server-only';

import { eq } from 'drizzle-orm';

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
