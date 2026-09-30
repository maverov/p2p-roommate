import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Banknote,
  FileSignature,
  Flag,
  KeyRound,
  MessagesSquare,
  Phone,
  ScrollText,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';

import { isLocale, openGraphLocale, type Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import { getMessages, type Messages } from '@/locales';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

type SafetySection = keyof Messages['safety']['sections'];

/** Page order, and one icon per section: a section added to the copy without one is a compile error. */
const SECTION_ICONS: Record<SafetySection, LucideIcon> = {
  money: Banknote,
  scams: TriangleAlert,
  viewings: KeyRound,
  ownership: ScrollText,
  contract: FileSignature,
  platform: MessagesSquare,
  report: Flag,
};

const SECTIONS = Object.keys(SECTION_ICONS) as SafetySection[];

type SafetyPageProps = {
  params: { locale: string };
};

export async function generateMetadata({ params }: SafetyPageProps): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : 'bg';
  const t = await getTranslations({ locale, namespace: 'safety' });
  const url = `${appUrl}${routes.safety(locale)}`;

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: {
      canonical: url,
      languages: {
        'bg-BG': `${appUrl}${routes.safety('bg')}`,
        'en-US': `${appUrl}${routes.safety('en')}`,
      },
    },
    openGraph: {
      // Open Graph titles bypass the layout's `%s | Stay.bg` template.
      title: `${t('metaTitle')} | Stay.bg`,
      description: t('metaDescription'),
      url,
      type: 'article',
      locale: openGraphLocale[locale],
    },
  };
}

export default async function SafetyPage({ params }: SafetyPageProps) {
  if (!isLocale(params.locale)) notFound();

  const locale: Locale = params.locale;
  const t = await getTranslations({ locale, namespace: 'safety' });
  // Each section's points are a list, which an ICU message cannot express, so they
  // are read from the typed catalogue in the order the copy gives them.
  const { sections } = getMessages(locale).safety;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 lg:px-6">
      <h1 className="text-[28px] font-bold leading-9 text-brand-ink">{t('title')}</h1>
      <p className="mt-2 text-[15px] leading-7 text-brand-muted">{t('intro')}</p>

      <div className="mt-8 grid gap-4">
        {SECTIONS.map((id) => {
          const Icon = SECTION_ICONS[id];

          return (
            <section
              aria-labelledby={`safety-${id}`}
              className="rounded-[15px] border border-brand-border bg-white p-5"
              key={id}
            >
              <h2
                className="flex items-center gap-2.5 text-[17px] font-bold text-brand-ink"
                id={`safety-${id}`}
              >
                <Icon aria-hidden="true" className="shrink-0 text-brand-terracotta" size={20} />
                {t(`sections.${id}.title`)}
              </h2>

              <ul className="mt-3 list-disc space-y-2 pl-5 text-[14px] leading-6 text-brand-muted marker:text-brand-terracotta/60">
                {Object.values(sections[id].points).map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>

              {id === 'contract' && (
                <Link
                  className="mt-3 inline-block text-[14px] font-bold text-brand-terracotta hover:underline"
                  href={routes.templates(locale)}
                >
                  {t('templatesLink')} →
                </Link>
              )}
            </section>
          );
        })}

        <section
          aria-labelledby="safety-emergency"
          className="rounded-[15px] border border-red-200 bg-red-50 p-5"
        >
          <h2 className="text-[17px] font-bold text-red-800" id="safety-emergency">
            {t('emergency.title')}
          </h2>
          <p className="mt-2 text-[14px] leading-6 text-red-900">{t('emergency.body')}</p>
          <a
            className="mt-4 inline-flex items-center gap-2 rounded-[10px] bg-red-600 px-4 py-2.5 text-[14px] font-bold text-white transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            href="tel:112"
          >
            <Phone aria-hidden="true" size={16} strokeWidth={2} />
            {t('emergency.call')}
          </a>
        </section>
      </div>
    </main>
  );
}
