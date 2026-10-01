import type { Route } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { ArrowRight, CircleHelp, Info, ListChecks, Sparkles, type LucideIcon } from 'lucide-react';

import SquiggleUnderline from '@/components/ui/SquiggleUnderline';
import { Breadcrumbs } from '@/features/areas/components/area-ui';
import type { Locale } from '@/lib/i18n';
import { BreadcrumbJsonLd } from '@/lib/jsonld';
import { routes } from '@/lib/routes';
import { cn } from '@/utils';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const SECTION_HEADING =
  'font-serif text-[26px] font-medium leading-tight tracking-[-0.02em] text-brand-ink';

export const BODY_TEXT = 'text-[15px] leading-7 text-brand-muted';

export const PRIMARY_BUTTON =
  'inline-flex items-center justify-center gap-2 rounded-[10px] bg-brand-terracotta px-5 py-2.5 text-[14px] font-bold text-white transition hover:bg-brand-terracotta-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terracotta';

export const SECONDARY_BUTTON =
  'inline-flex items-center justify-center gap-2 rounded-[10px] border border-brand-border bg-white px-5 py-2.5 text-[14px] font-bold text-brand-ink transition hover:border-brand-terracotta hover:text-brand-terracotta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terracotta';

export const CARD = 'rounded-[15px] border border-brand-border bg-white';

type CompanyPageProps = {
  locale: Locale;
  title: string;
  intro?: string;
  /** The page's own route: the last breadcrumb, in the markup and the structured data. */
  path: (locale: Locale) => Route;
  children: React.ReactNode;
};

/** The frame every About page shares: breadcrumbs, a serif title and the intro. */
export async function CompanyPage({ children, intro, locale, path, title }: CompanyPageProps) {
  const t = await getTranslations({ locale, namespace: 'company' });
  const crumbs = [
    { name: t('breadcrumbHome'), href: routes.home(locale) },
    { name: title, href: path(locale) },
  ];

  return (
    <>
      <BreadcrumbJsonLd
        items={crumbs.map((crumb) => ({ name: crumb.name, url: `${appUrl}${crumb.href}` }))}
      />

      <main className="min-h-screen bg-brand-cream text-brand-ink">
        <div className="mx-auto w-full max-w-5xl px-6 pb-16 pt-6 lg:px-10">
          <Breadcrumbs items={crumbs} />

          <header className="max-w-3xl">
            <h1 className="font-serif text-[34px] font-medium leading-[1.1] tracking-[-0.02em] text-brand-ink sm:text-[42px]">
              {title}
            </h1>
            <SquiggleUnderline />
            {intro && <p className="mt-4 text-[16px] leading-7 text-brand-muted">{intro}</p>}
          </header>

          <div className="mt-10">{children}</div>
        </div>
      </main>
    </>
  );
}

type ExplorePage = 'about' | 'whyUs' | 'howItWorks' | 'faq';

const EXPLORE_PAGES: ReadonlyArray<{
  id: ExplorePage;
  icon: LucideIcon;
  href: (locale: Locale) => Route;
}> = [
  { id: 'about', icon: Info, href: routes.about },
  { id: 'whyUs', icon: Sparkles, href: routes.whyUs },
  { id: 'howItWorks', icon: ListChecks, href: routes.howItWorks },
  { id: 'faq', icon: CircleHelp, href: routes.faq },
];

/** "Find out more": the other About pages, as cards. */
export async function ExploreMore({
  className,
  current,
  locale,
}: {
  className?: string;
  current: ExplorePage;
  locale: Locale;
}) {
  const t = await getTranslations({ locale, namespace: 'company.explore' });

  return (
    <section aria-labelledby="explore-more" className={className}>
      <h2 className={SECTION_HEADING} id="explore-more">
        {t('heading')}
      </h2>

      <ul className="mt-5 grid gap-4 sm:grid-cols-3">
        {EXPLORE_PAGES.filter((page) => page.id !== current).map((page) => (
          <li key={page.id}>
            <Link
              className={cn(
                CARD,
                'group flex h-full flex-col p-5 transition hover:border-brand-terracotta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terracotta',
              )}
              href={page.href(locale)}
            >
              <page.icon
                aria-hidden="true"
                className="text-brand-olive"
                size={22}
                strokeWidth={1.8}
              />
              <span className="mt-3 flex items-center gap-1.5 text-[16px] font-bold text-brand-ink group-hover:text-brand-terracotta">
                {t(`${page.id}.title`)}
                <ArrowRight
                  aria-hidden="true"
                  className="transition group-hover:translate-x-0.5"
                  size={15}
                />
              </span>
              <span className="mt-1 text-[14px] leading-6 text-brand-muted">
                {t(`${page.id}.body`)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
