'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/utils';

type AdminNavItem = {
  href: Route;
  label: string;
};

export function AdminNav({ items }: { items: AdminNavItem[] }) {
  const pathname = usePathname();

  return (
    <ul className="flex items-center gap-1">
      {items.map(({ href, label }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <li key={href}>
            <Link
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'rounded-lg px-3 py-1.5 text-[14px] font-semibold transition',
                isActive ? 'bg-brand-chip text-brand-terracotta' : 'text-brand-muted hover:text-brand-ink',
              )}
              href={href}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
