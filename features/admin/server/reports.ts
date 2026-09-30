import 'server-only';

import { and, asc, count, desc, eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { db } from '@/db';
import { listings, reports, user } from '@/db/schema';
import type { ReportStatus } from '@/lib/labels';
import { ApiError } from '@/lib/server/api';

import type { UpdateReportInput } from '../schemas';

export const REPORTS_PER_PAGE = 20;

const reporter = alias(user, 'reporter');
const reportedUser = alias(user, 'reported_user');
const listingOwner = alias(user, 'listing_owner');
const resolver = alias(user, 'resolver');

/** Every status an admin may move a report to, keyed by its current status. */
const ALLOWED_TRANSITIONS: Record<ReportStatus, readonly ReportStatus[]> = {
  OPEN: ['REVIEWING', 'RESOLVED', 'DISMISSED'],
  REVIEWING: ['RESOLVED', 'DISMISSED'],
  RESOLVED: [],
  DISMISSED: [],
};

export function allowedReportTransitions(status: ReportStatus) {
  return ALLOWED_TRANSITIONS[status];
}

export async function countReportsByStatus() {
  const rows = await db
    .select({ status: reports.status, total: count() })
    .from(reports)
    .groupBy(reports.status);

  const counts: Record<ReportStatus, number> = { OPEN: 0, REVIEWING: 0, RESOLVED: 0, DISMISSED: 0 };

  for (const row of rows) {
    counts[row.status] = row.total;
  }

  return counts;
}

export async function listReportsForModeration(status: ReportStatus, page: number) {
  // The work queues are first-in-first-out so nothing waits forever; history reads newest first.
  const isQueue = status === 'OPEN' || status === 'REVIEWING';
  const byAge = isQueue ? asc : desc;

  return db
    .select({
      id: reports.id,
      reason: reports.reason,
      status: reports.status,
      createdAt: reports.createdAt,
      reporterName: reporter.name,
      listingTitle: listings.title,
      reportedUserName: reportedUser.name,
    })
    .from(reports)
    .innerJoin(reporter, eq(reports.reporterId, reporter.id))
    .leftJoin(listings, eq(reports.listingId, listings.id))
    .leftJoin(reportedUser, eq(reports.reportedUserId, reportedUser.id))
    .where(eq(reports.status, status))
    .orderBy(byAge(reports.createdAt), byAge(reports.id))
    .limit(REPORTS_PER_PAGE)
    .offset((page - 1) * REPORTS_PER_PAGE);
}

export type ReportListItem = Awaited<ReturnType<typeof listReportsForModeration>>[number];

export async function getReportForModeration(reportId: string) {
  const [report] = await db
    .select({
      id: reports.id,
      reason: reports.reason,
      details: reports.details,
      status: reports.status,
      createdAt: reports.createdAt,
      resolvedAt: reports.resolvedAt,
      resolutionNote: reports.resolutionNote,
      resolvedByName: resolver.name,
      reporter: { id: reporter.id, name: reporter.name, email: reporter.email },
      listing: { id: listings.id, title: listings.title, status: listings.status },
      listingOwner: {
        id: listingOwner.id,
        name: listingOwner.name,
        email: listingOwner.email,
        role: listingOwner.role,
        banned: listingOwner.banned,
      },
      reportedUser: {
        id: reportedUser.id,
        name: reportedUser.name,
        email: reportedUser.email,
        role: reportedUser.role,
        banned: reportedUser.banned,
      },
    })
    .from(reports)
    .innerJoin(reporter, eq(reports.reporterId, reporter.id))
    .leftJoin(listings, eq(reports.listingId, listings.id))
    .leftJoin(listingOwner, eq(listings.ownerId, listingOwner.id))
    .leftJoin(reportedUser, eq(reports.reportedUserId, reportedUser.id))
    .leftJoin(resolver, eq(reports.resolvedById, resolver.id))
    .where(eq(reports.id, reportId))
    .limit(1);

  if (!report) {
    throw new ApiError(404, 'REPORT_NOT_FOUND', 'Report was not found.');
  }

  return report;
}

export type ReportDetail = Awaited<ReturnType<typeof getReportForModeration>>;
export type ModerationTarget = NonNullable<ReportDetail['reportedUser']>;

export async function updateReportStatus(
  reportId: string,
  adminId: string,
  input: UpdateReportInput,
) {
  const [existing] = await db
    .select({ status: reports.status })
    .from(reports)
    .where(eq(reports.id, reportId))
    .limit(1);

  if (!existing) {
    throw new ApiError(404, 'REPORT_NOT_FOUND', 'Report was not found.');
  }

  if (!ALLOWED_TRANSITIONS[existing.status].includes(input.status)) {
    throw new ApiError(
      409,
      'INVALID_STATUS_TRANSITION',
      `A ${existing.status.toLowerCase()} report cannot be moved to ${input.status.toLowerCase()}.`,
    );
  }

  const now = new Date();
  const resolution =
    input.status === 'REVIEWING'
      ? {}
      : { resolvedById: adminId, resolvedAt: now, resolutionNote: input.note };

  const [updated] = await db
    .update(reports)
    .set({ status: input.status, updatedAt: now, ...resolution })
    // Matching the status just read makes a concurrent decision by the other admin
    // fail loudly instead of being silently overwritten.
    .where(and(eq(reports.id, reportId), eq(reports.status, existing.status)))
    .returning({ id: reports.id, status: reports.status });

  if (!updated) {
    throw new ApiError(
      409,
      'REPORT_CHANGED',
      'The report changed while you were viewing it. Reload and try again.',
    );
  }

  return updated;
}
