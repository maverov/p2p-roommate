import 'server-only';

import { and, eq, inArray, isNull } from 'drizzle-orm';

import { db } from '@/db';
import { listings, reports, user } from '@/db/schema';
import { ApiError } from '@/lib/server/api';

import type { CreateReportInput } from '../schemas';

export async function createReport(reporterId: string, input: CreateReportInput) {
  if (input.listingId) {
    const [listing] = await db
      .select({ ownerId: listings.ownerId })
      .from(listings)
      .where(eq(listings.id, input.listingId))
      .limit(1);

    if (!listing) {
      throw new ApiError(404, 'LISTING_NOT_FOUND', 'Listing was not found.');
    }

    if (listing.ownerId === reporterId) {
      throw new ApiError(400, 'CANNOT_REPORT_OWN_LISTING', 'You cannot report your own listing.');
    }
  }

  if (input.reportedUserId) {
    if (input.reportedUserId === reporterId) {
      throw new ApiError(400, 'CANNOT_REPORT_YOURSELF', 'You cannot report yourself.');
    }

    const [reportedUser] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, input.reportedUserId))
      .limit(1);

    if (!reportedUser) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'Reported user was not found.');
    }
  }

  // One pending report per reporter and target keeps a single upset user from flooding the queue.
  const [pending] = await db
    .select({ id: reports.id })
    .from(reports)
    .where(
      and(
        eq(reports.reporterId, reporterId),
        input.listingId ? eq(reports.listingId, input.listingId) : isNull(reports.listingId),
        input.reportedUserId
          ? eq(reports.reportedUserId, input.reportedUserId)
          : isNull(reports.reportedUserId),
        inArray(reports.status, ['OPEN', 'REVIEWING']),
      ),
    )
    .limit(1);

  if (pending) {
    throw new ApiError(409, 'ALREADY_REPORTED', 'You have already reported this, and it is being reviewed.');
  }

  const [report] = await db
    .insert(reports)
    .values({
      id: crypto.randomUUID(),
      reporterId,
      listingId: input.listingId,
      reportedUserId: input.reportedUserId,
      reason: input.reason,
      details: input.details || undefined,
    })
    .returning();

  return report;
}
