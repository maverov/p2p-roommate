import type { Metadata, Route } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Handshake,
  KeyRound,
  LifeBuoy,
  ShieldCheck,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react';

import { CARD, CompanyPage, ExploreMore } from '@/features/company/components/company-ui';
import { isLocale, type Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import type { Messages } from '@/locales';
import { cn } from '@/utils';

type Section = keyof Messages['company']['whyUs']['sections'];
type LinkId = keyof Messages['company']['whyUs']['links'];

const LINK_ROUTES: Record<LinkId, (locale: Locale) => Route> = {
  faq: routes.faq,
  safety: routes.safety,
  templates: routes.templates,
  contact: routes.contact,
};

/** Page order, each section's icon and the pages it points to next. */
const SECTIONS: ReadonlyArray<{ id: Section; icon: LucideIcon; links?: LinkId[] }> = [
  { id: 'direct', icon: Handshake },
  { id: 'you', icon: SlidersHorizontal },
  { id: 'safety', icon: ShieldCheck, links: ['safety'] },
  { id: 'meet', icon: KeyRound, links: ['templates'] },
  { id: 'help', icon: LifeBuoy, links: ['faq', 'contact'] },
];

type WhyStayPageProps = {
  params: { locale: string };
};

export async function generateMetadata({ params }: WhyStayPageProps): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : 'bg';
  const t = await getTranslations({ locale, namespace: 'company.whyUs' });

  return pageMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    locale,
    path: routes.whyUs,
  });
}

export default async function WhyStayPage({ params }: WhyStayPageProps) {
  if (!isLocale(params.locale)) notFound();

  const locale: Locale = params.locale;
  const t = await getTranslations({ locale, namespace: 'company.whyUs' });

  return (
    <CompanyPage intro={t('intro')} locale={locale} path={routes.whyUs} title={t('title')}>
      <div className="grid gap-4 md:grid-cols-2">
        {SECTIONS.map((section, index) => (
          <section
            aria-labelledby={`why-${section.id}`}
            className={cn(
              CARD,
              'p-6',
              // An odd count leaves the last card alone on its row; let it span.
              index === SECTIONS.length - 1 && SECTIONS.length % 2 === 1 && 'md:col-span-2',
            )}
            key={section.id}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-olive text-white">
              <section.icon aria-hidden="true" size={22} strokeWidth={1.8} />
            </span>
            <h2
              className="mt-4 text-[19px] font-bold leading-7 text-brand-ink"
              id={`why-${section.id}`}
            >
              {t(`sections.${section.id}.title`)}
            </h2>
            <p className="mt-2 text-[14px] leading-6 text-brand-muted">
              {t(`sections.${section.id}.body`)}
            </p>

            {section.links && (
              <p className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                {section.links.map((link) => (
                  <Link
                    className="text-[14px] font-bold text-brand-terracotta hover:underline"
                    href={LINK_ROUTES[link](locale)}
                    key={link}
                  >
                    {t(`links.${link}`)} →
                  </Link>
                ))}
              </p>
            )}
          </section>
        ))}
      </div>

      <ExploreMore className="mt-16" current="whyUs" locale={locale} />
    </CompanyPage>
  );
}
