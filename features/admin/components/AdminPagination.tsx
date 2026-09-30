import type { Route } from 'next';
import Link from 'next/link';

import { cn } from '@/utils';

const PAGINATION_LINK =
  'rounded-xl border border-brand-border bg-white px-3 py-1.5 text-[13px] font-semibold text-brand-ink transition hover:border-brand-terracotta hover:text-brand-terracotta';

type AdminPaginationProps = {
  page: number;
  totalPages: number;
  hrefForPage: (page: number) => Route;
};

export function AdminPagination({ hrefForPage, page, totalPages }: AdminPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const label = `Page ${page} of ${totalPages}`;

  return (
    <nav aria-label={label} className="mt-6 flex items-center justify-between gap-4">
      {page > 1 ? (
        <Link className={PAGINATION_LINK} href={hrefForPage(page - 1)} rel="prev">
          Previous
        </Link>
      ) : (
        <span className={cn(PAGINATION_LINK, 'pointer-events-none opacity-45')}>Previous</span>
      )}

      <p className="text-[13px] text-brand-muted">{label}</p>

      {page < totalPages ? (
        <Link className={PAGINATION_LINK} href={hrefForPage(page + 1)} rel="next">
          Next
        </Link>
      ) : (
        <span className={cn(PAGINATION_LINK, 'pointer-events-none opacity-45')}>Next</span>
      )}
    </nav>
  );
}
