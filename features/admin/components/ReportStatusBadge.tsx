import type { ReportStatus } from '@/lib/labels';
import { cn } from '@/utils';

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  OPEN: 'Open',
  REVIEWING: 'In review',
  RESOLVED: 'Resolved',
  DISMISSED: 'Dismissed',
};

const STATUS_STYLES: Record<ReportStatus, string> = {
  OPEN: 'bg-red-100 text-red-700',
  REVIEWING: 'bg-amber-100 text-amber-700',
  RESOLVED: 'bg-green-100 text-green-700',
  DISMISSED: 'bg-zinc-100 text-zinc-600',
};

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span
      className={cn(
        'inline-block shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-medium',
        STATUS_STYLES[status],
      )}
    >
      {REPORT_STATUS_LABELS[status]}
    </span>
  );
}
