import type { Metadata, Route } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Home, KeyRound, UsersRound, type LucideIcon } from 'lucide-react';

import {
  CARD,
  CompanyPage,
  ExploreMore,
  PRIMARY_BUTTON,
  SECTION_HEADING,
} from '@/features/company/components/company-ui';
import { isLocale, type Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { getMessages } from '@/locales';

type Journey = 'seekers' | 'hosts' | 'roommates';

/** One section per journey, each ending in the page where it starts. */
const JOURNEYS: ReadonlyArray<{ id: Journey; icon: LucideIcon; cta: (locale: Locale) => Route }> = [
  { id: 'seekers', icon: Home, cta: (locale) => routes.listings(locale) },
  { id: 'hosts', icon: KeyRound, cta: routes.listProperty },
  { id: 'roommates', icon: UsersRound, cta: (locale) => routes.findRoommate(locale) },
];

type HowItWorksPageProps = {
  params: { locale: string };
};

export async function generateMetadata({ params }: HowItWorksPageProps): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : 'bg';
  const t = await getTranslations({ locale, namespace: 'company.howItWorks' });

  return pageMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    locale,
    path: routes.howItWorks,
  });
}

export default async function HowItWorksPage({ params }: HowItWorksPageProps) {
  if (!isLocale(params.locale)) notFound();

  const locale: Locale = params.locale;
  const t = await getTranslations({ locale, namespace: 'company.howItWorks' });
  // Steps are ordered lists, which an ICU message cannot express, so they come from the
  // typed catalogue in the order the copy gives them.
  const copy = getMessages(locale).company.howItWorks;

  return (
    <CompanyPage intro={t('intro')} locale={locale} path={routes.howItWorks} title={t('title')}>
      <nav aria-label={t('title')} className="flex flex-wrap gap-2">
        {JOURNEYS.map((journey) => (
          <a
            className="flex items-center gap-2 rounded-full border border-brand-border bg-white px-4 py-2 text-[14px] font-semibold text-brand-ink transition hover:border-brand-terracotta hover:text-brand-terracotta"
            href={`#${journey.id}`}
            key={journey.id}
          >
            <journey.icon
              aria-hidden="true"
              className="text-brand-olive"
              size={16}
              strokeWidth={1.9}
            />
            {t(`${journey.id}.heading`)}
          </a>
        ))}
      </nav>

      {JOURNEYS.map((journey) => (
        <section
          aria-labelledby={`${journey.id}-heading`}
          className="mt-14 scroll-mt-24"
          id={journey.id}
          key={journey.id}
        >
          <h2 className={SECTION_HEADING} id={`${journey.id}-heading`}>
            {t(`${journey.id}.heading`)}
          </h2>

          <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(copy[journey.id].steps).map(([id, step], index) => (
              <li className={`${CARD} p-5`} key={id}>
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-olive text-[15px] font-bold text-white"
                >
                  {index + 1}
                </span>
                <h3 className="mt-3 text-[16px] font-bold leading-6 text-brand-ink">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-[14px] leading-6 text-brand-muted">{step.body}</p>
              </li>
            ))}
          </ol>

          <Link className={`mt-5 ${PRIMARY_BUTTON}`} href={journey.cta(locale)}>
            {t(`${journey.id}.cta`)}
          </Link>
        </section>
      ))}

      <ExploreMore className="mt-16" current="howItWorks" locale={locale} />
    </CompanyPage>
  );
}
