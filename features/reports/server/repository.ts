import 'server-only';

import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { listings, reports, user } from '@/db/schema';
import { ApiError } from '@/lib/server/api';

export const createReportInputSchema = z
  .object({
    listingId: z.string().min(1).optional(),
    reportedUserId: z.string().min(1).optional(),
    reason: z.string().trim().min(3).max(120),
    details: z.string().trim().max(2000).optional(),
  })
  .refine((input) => input.listingId || input.reportedUserId, {
    message: 'Provide listingId, reportedUserId, or both.',
  });

export type CreateReportInput = z.infer<typeof createReportInputSchema>;

export async function createReport(reporterId: string, input: CreateReportInput) {
  if (input.listingId) {
    const [listing] = await db
      .select({ id: listings.id })
      .from(listings)
      .where(eq(listings.id, input.listingId))
      .limit(1);

    if (!listing) {
      throw new ApiError(404, 'LISTING_NOT_FOUND', 'Listing was not found.');
    }
  }

  if (input.reportedUserId) {
    const [reportedUser] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, input.reportedUserId))
      .limit(1);

    if (!reportedUser) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'Reported user was not found.');
    }
  }

  const [report] = await db
    .insert(reports)
    .values({
      id: crypto.randomUUID(),
      reporterId,
      listingId: input.listingId,
      reportedUserId: input.reportedUserId,
      reason: input.reason,
      details: input.details,
    })
    .returning();

  return report;
}
