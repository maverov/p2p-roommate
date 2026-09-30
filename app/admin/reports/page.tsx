import type { Metadata } from 'next';
import Link from 'next/link';

import { StateMessage } from '@/components/shared/StateMessage';
import { AdminPagination } from '@/features/admin/components/AdminPagination';
import { REPORT_STATUS_LABELS } from '@/features/admin/components/ReportStatusBadge';
import {
  REPORTS_PER_PAGE,
  countReportsByStatus,
  listReportsForModeration,
  type ReportListItem,
} from '@/features/admin/server/reports';
import { getReportReasonLabel } from '@/features/admin/server/labels';
import { formatDateTime } from '@/lib/format';
import { REPORT_STATUSES, type ReportStatus } from '@/lib/labels';
import { routes } from '@/lib/routes';
import { requireAdminUser } from '@/lib/server/admin';
import { safeQuery } from '@/lib/server/safe';
import { cn } from '@/utils';

export const metadata: Metadata = {
  title: 'Reports',
};

type AdminReportsPageProps = {
  searchParams: { status?: string; page?: string };
};

function parseStatus(value?: string): ReportStatus {
  return REPORT_STATUSES.find((status) => status === value) ?? 'OPEN';
}

function parsePage(value?: string) {
  const page = Number(value);

  return Number.isInteger(page) && page > 0 ? page : 1;
}

function reportsHref(status: ReportStatus, page = 1) {
  const params = new URLSearchParams();

  if (status !== 'OPEN') params.set('status', status);
  if (page > 1) params.set('page', String(page));

  return routes.adminReports(params.toString());
}

function describeTarget(report: ReportListItem) {
  const targets = [
    report.listingTitle && `Listing “${report.listingTitle}”`,
    report.reportedUserName && `User ${report.reportedUserName}`,
  ].filter(Boolean);

  return targets.length > 0 ? targets.join(' · ') : 'Reported item no longer exists';
}

export default async function AdminReportsPage({ searchParams }: AdminReportsPageProps) {
  await requireAdminUser();

  const status = parseStatus(searchParams.status);
  const page = parsePage(searchParams.page);

  const [counts, reportsOnPage, reasonLabel] = await Promise.all([
    safeQuery(countReportsByStatus(), 'report counts'),
    safeQuery(listReportsForModeration(status, page), `reports ${status} page ${page}`),
    getReportReasonLabel(),
  ]);

  const totalPages = Math.max(1, Math.ceil((counts?.[status] ?? 0) / REPORTS_PER_PAGE));

  return (
    <>
      <h1 className="text-[24px] font-bold leading-8 text-brand-ink">Reports</h1>

      <nav aria-label="Report status" className="mt-6">
        <ul className="flex flex-wrap items-center gap-1 border-b border-brand-border">
          {REPORT_STATUSES.map((item) => (
            <li key={item}>
              <Link
                aria-current={item === status ? 'page' : undefined}
                className={cn(
                  '-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-[14px] font-bold transition',
                  item === status
                    ? 'border-brand-terracotta text-brand-terracotta'
                    : 'border-transparent text-brand-muted hover:text-brand-ink',
                )}
                href={reportsHref(item)}
              >
                {REPORT_STATUS_LABELS[item]}
                {counts && (
                  <span className="rounded-full bg-brand-chip px-2 py-0.5 text-[12px] tabular-nums">
                    {counts[item]}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-6">
        {reportsOnPage === null ? (
          <StateMessage body="The database did not respond. Try again shortly." title="Reports could not be loaded" tone="error" />
        ) : reportsOnPage.length === 0 ? (
          <StateMessage body="Nothing is waiting here." title={`No ${REPORT_STATUS_LABELS[status].toLowerCase()} reports`} />
        ) : (
          <ul className="divide-y divide-brand-border overflow-hidden rounded-[15px] border border-brand-border bg-white" role="list">
            {reportsOnPage.map((report) => (
              <li className="relative px-4 py-3.5 transition hover:bg-brand-sand/40" key={report.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-brand-ink">{reasonLabel(report.reason)}</p>
                    <p className="mt-0.5 truncate text-[13px] text-brand-muted">
                      {describeTarget(report)} · reported by {report.reporterName}
                    </p>
                  </div>
                  <time
                    className="shrink-0 text-[12px] text-brand-muted"
                    dateTime={report.createdAt.toISOString()}
                  >
                    {formatDateTime(report.createdAt, 'en')}
                  </time>
                </div>

                <Link
                  className="absolute inset-0 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-terracotta"
                  href={routes.adminReport(report.id)}
                >
                  <span className="sr-only">Open report: {reasonLabel(report.reason)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <AdminPagination
          hrefForPage={(target) => reportsHref(status, target)}
          page={page}
          totalPages={totalPages}
        />
      </div>
    </>
  );
}
