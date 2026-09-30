import type { Metadata, Route } from 'next';
import Link from 'next/link';

import { StateMessage } from '@/components/shared/StateMessage';
import { getAdminStats } from '@/features/admin/server/stats';
import { routes } from '@/lib/routes';
import { requireAdminUser } from '@/lib/server/admin';
import { safeQuery } from '@/lib/server/safe';
import { cn } from '@/utils';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default async function AdminDashboardPage() {
  await requireAdminUser();

  const stats = await safeQuery(getAdminStats(), 'admin stats');

  return (
    <>
      <h1 className="text-[24px] font-bold leading-8 text-brand-ink">Dashboard</h1>

      {stats === null ? (
        <div className="mt-6">
          <StateMessage
            body="The database did not respond. Try again shortly."
            title="Stats could not be loaded"
            tone="error"
          />
        </div>
      ) : (
        <dl className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            highlight={stats.openReports > 0}
            href={routes.adminReports()}
            label="Open reports"
            value={stats.openReports}
          />
          <StatCard label="Users" value={stats.users} />
          <StatCard label="Banned users" value={stats.bannedUsers} />
          <StatCard label="Published listings" value={stats.publishedListings} />
        </dl>
      )}
    </>
  );
}

type StatCardProps = {
  highlight?: boolean;
  href?: Route;
  label: string;
  value: number;
};

function StatCard({ highlight = false, href, label, value }: StatCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-[15px] border bg-white p-4 shadow-[0_8px_24px_rgba(75,55,35,0.06)]',
        href && 'transition hover:border-brand-terracotta',
        highlight ? 'border-brand-terracotta' : 'border-brand-border',
      )}
    >
      <dt className="text-[13px] font-medium text-brand-muted">{label}</dt>
      <dd className="mt-1 text-[28px] font-bold leading-9 tabular-nums text-brand-ink">
        {value.toLocaleString('en')}
      </dd>
      {href && (
        <Link className="absolute inset-0 rounded-[15px]" href={href}>
          <span className="sr-only">View {label.toLowerCase()}</span>
        </Link>
      )}
    </div>
  );
}
