import type { Metadata } from 'next';
import Link from 'next/link';

import { AdminNav } from '@/features/admin/components/AdminNav';
import { defaultLocale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import { requireAdminUser } from '@/lib/server/admin';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · Admin' },
  robots: { index: false, follow: false },
};

/** English-only on purpose: an internal tool for the founders, outside the locale tree. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const adminUser = await requireAdminUser();

  return (
    <div className="min-h-screen bg-brand-sand/40" lang="en">
      <header className="border-b border-brand-border bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 lg:px-6">
          <nav aria-label="Admin" className="flex items-center gap-5 text-[14px] font-semibold">
            <Link className="text-brand-ink hover:text-brand-terracotta" href={routes.admin()}>
              Stay.bg Admin
            </Link>
            <AdminNav items={[{ href: routes.adminReports(), label: 'Reports' }]} />
          </nav>

          <div className="flex items-center gap-4 text-[13px]">
            <span className="hidden text-brand-muted sm:inline">{adminUser.email}</span>
            <Link
              className="font-semibold text-brand-terracotta hover:text-brand-terracotta-hover"
              href={routes.home(defaultLocale)}
            >
              Back to site
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 lg:px-6">{children}</main>
    </div>
  );
}
