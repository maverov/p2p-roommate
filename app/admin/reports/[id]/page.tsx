import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { StateMessage } from '@/components/shared/StateMessage';
import { ArchiveListingButton } from '@/features/admin/components/ArchiveListingButton';
import { BanUserForm } from '@/features/admin/components/BanUserForm';
import { ReportDecisionForm } from '@/features/admin/components/ReportDecisionForm';
import { REPORT_STATUS_LABELS, ReportStatusBadge } from '@/features/admin/components/ReportStatusBadge';
import {
  allowedReportTransitions,
  getReportForModeration,
  type ModerationTarget,
} from '@/features/admin/server/reports';
import { getReportReasonLabel } from '@/features/admin/server/labels';
import { formatDateTime } from '@/lib/format';
import { defaultLocale } from '@/lib/i18n';
import { isAdmin } from '@/lib/roles';
import { routes } from '@/lib/routes';
import { requireAdminUser } from '@/lib/server/admin';
import { tryQuery } from '@/lib/server/safe';

export const metadata: Metadata = {
  title: 'Report',
};

const CARD = 'rounded-[15px] border border-brand-border bg-white p-5 shadow-[0_8px_24px_rgba(75,55,35,0.06)]';
const SECTION_TITLE = 'text-[12px] font-bold uppercase tracking-wide text-brand-muted';
const SITE_LINK = 'font-semibold text-brand-terracotta hover:text-brand-terracotta-hover';

const LISTING_STATUS_LABELS = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  PAUSED: 'Paused',
  ARCHIVED: 'Archived',
} as const;

type AdminReportPageProps = {
  params: { id: string };
};

export default async function AdminReportPage({ params }: AdminReportPageProps) {
  const adminUser = await requireAdminUser();
  const outcome = await tryQuery(getReportForModeration(params.id), `report ${params.id}`);

  if (outcome.status === 'missing') {
    notFound();
  }

  if (outcome.status === 'failed') {
    return (
      <>
        <BackLink />
        <div className="mt-4">
          <StateMessage body="The database did not respond. Try again shortly." title="Report could not be loaded" tone="error" />
        </div>
      </>
    );
  }

  const report = outcome.data;
  const reasonLabel = (await getReportReasonLabel())(report.reason);
  const allowedStatuses = allowedReportTransitions(report.status);
  // Someone reported together with their own listing is shown once, under the listing.
  const separateReportedUser =
    report.reportedUser && report.reportedUser.id !== report.listingOwner?.id ? report.reportedUser : null;

  return (
    <>
      <BackLink />

      <div className="mt-4 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className={CARD}>
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-[20px] font-bold leading-7 text-brand-ink">{reasonLabel}</h1>
              <ReportStatusBadge status={report.status} />
            </div>
            <p className="mt-1 text-[13px] text-brand-muted">
              Reported {formatDateTime(report.createdAt, 'en')} by {report.reporter.name} ({report.reporter.email})
            </p>
            <p className="mt-4 whitespace-pre-line text-[14px] leading-6 text-brand-ink">
              {report.details || 'No details were given.'}
            </p>
          </section>

          {report.listing && (
            <section className={CARD}>
              <h2 className={SECTION_TITLE}>Reported listing</h2>
              <p className="mt-2 text-[15px] font-semibold text-brand-ink">{report.listing.title}</p>
              <p className="mt-0.5 text-[13px] text-brand-muted">
                {LISTING_STATUS_LABELS[report.listing.status]} ·{' '}
                <Link
                  className={SITE_LINK}
                  href={routes.listing(defaultLocale, report.listing.id)}
                  rel="noreferrer"
                  target="_blank"
                >
                  View on site
                </Link>
              </p>

              {report.listing.status !== 'ARCHIVED' && (
                <div className="mt-3">
                  <ArchiveListingButton listingId={report.listing.id} />
                </div>
              )}

              {report.listingOwner && (
                <TargetUser adminId={adminUser.id} defaultReason={reasonLabel} label="Owner" target={report.listingOwner} />
              )}
            </section>
          )}

          {separateReportedUser && (
            <section className={CARD}>
              <h2 className={SECTION_TITLE}>Reported user</h2>
              <TargetUser adminId={adminUser.id} defaultReason={reasonLabel} target={separateReportedUser} />
            </section>
          )}

          {!report.listing && !report.reportedUser && (
            <StateMessage
              body="The listing or user in this report has since been deleted."
              title="Nothing left to moderate"
            />
          )}
        </div>

        <aside className={CARD}>
          <h2 className={SECTION_TITLE}>Decision</h2>

          {allowedStatuses.length === 0 ? (
            <div className="mt-2 space-y-2 text-[14px] leading-6">
              <p className="text-brand-ink">
                {REPORT_STATUS_LABELS[report.status]} by {report.resolvedByName ?? 'a former admin'}
                {report.resolvedAt && ` on ${formatDateTime(report.resolvedAt, 'en')}`}
              </p>
              {report.resolutionNote && (
                <p className="whitespace-pre-line text-brand-muted">{report.resolutionNote}</p>
              )}
            </div>
          ) : (
            <div className="mt-3">
              <ReportDecisionForm allowedStatuses={allowedStatuses} reportId={report.id} />
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

function BackLink() {
  return (
    <Link className={`text-[14px] ${SITE_LINK}`} href={routes.adminReports()}>
      ← Reports
    </Link>
  );
}

type TargetUserProps = {
  adminId: string;
  defaultReason: string;
  label?: string;
  target: ModerationTarget;
};

function TargetUser({ adminId, defaultReason, label, target }: TargetUserProps) {
  const targetIsAdmin = isAdmin(target);
  const canBan = !target.banned && !targetIsAdmin && target.id !== adminId;

  return (
    <div className={label ? 'mt-4 border-t border-brand-border pt-4' : 'mt-2'}>
      {label && <p className={SECTION_TITLE}>{label}</p>}

      <p className="mt-1 flex flex-wrap items-center gap-2 text-[15px] font-semibold text-brand-ink">
        <Link className="hover:text-brand-terracotta" href={routes.profile(defaultLocale, target.id)} rel="noreferrer" target="_blank">
          {target.name}
        </Link>
        {target.banned && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[12px] font-medium text-red-700">Banned</span>
        )}
        {targetIsAdmin && (
          <span className="rounded-full bg-brand-chip px-2 py-0.5 text-[12px] font-medium text-brand-ink">Admin</span>
        )}
      </p>
      <p className="text-[13px] text-brand-muted">{target.email}</p>

      {canBan && (
        <div className="mt-3">
          <BanUserForm defaultReason={defaultReason} userId={target.id} userName={target.name} />
        </div>
      )}
    </div>
  );
}
