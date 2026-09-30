import type { Route } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

import type { Locale } from '@/lib/i18n';
import { cn } from '@/utils';

export function AreaPageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-brand-cream text-brand-ink">
      <div className="mx-auto w-full max-w-[1400px] px-6 pb-16 pt-6 lg:px-10">{children}</div>
    </main>
  );
}

export function Breadcrumbs({ items }: { items: Array<{ name: string; href: Route }> }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-[13px] text-brand-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li className="flex items-center gap-1.5" key={item.href}>
              {isLast ? (
                <span aria-current="page" className="text-brand-ink">
                  {item.name}
                </span>
              ) : (
                <>
                  <Link className="hover:text-brand-terracotta" href={item.href}>
                    {item.name}
                  </Link>
                  <span aria-hidden="true">/</span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

type AreaLink = { href: Route; label: string; count: number | null };

/** Links to area pages, each with its listing count when it has any (`null`: counts failed). */
export async function AreaLinks({
  items,
  locale,
  stacked = false,
}: {
  items: AreaLink[];
  locale: Locale;
  /** A column, as in the city page's groups; otherwise chips that wrap. */
  stacked?: boolean;
}) {
  const t = await getTranslations({ locale, namespace: 'areas' });

  return (
    <ul className={stacked ? 'grid gap-1.5' : 'flex flex-wrap gap-2'}>
      {items.map((item) => (
        <li key={item.href}>
          <Link
            className={cn(
              'inline-flex items-baseline gap-1.5 text-[14px] transition hover:text-brand-terracotta',
              stacked
                ? item.count
                  ? 'font-semibold text-brand-ink'
                  : 'text-brand-muted'
                : 'rounded-full border border-brand-border bg-white px-3 py-1.5 text-brand-ink hover:border-brand-terracotta',
            )}
            href={item.href}
          >
            {item.label}
            {/* Empty areas show no count: a column of "no listings yet" is noise. */}
            {item.count ? (
              <span className="text-[12px] font-normal text-brand-muted">
                {t('listingCount', { count: item.count })}
              </span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
