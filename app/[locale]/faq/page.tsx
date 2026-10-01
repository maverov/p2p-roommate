import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

import {
  CompanyPage,
  ExploreMore,
  PRIMARY_BUTTON,
  SECTION_HEADING,
} from '@/features/company/components/company-ui';
import { isLocale, type Locale } from '@/lib/i18n';
import { FAQJsonLd } from '@/lib/jsonld';
import { routes } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { getMessages, type Messages } from '@/locales';

type FaqGroup = keyof Messages['company']['faq']['groups'];

type FaqPageProps = {
  params: { locale: string };
};

export async function generateMetadata({ params }: FaqPageProps): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : 'bg';
  const t = await getTranslations({ locale, namespace: 'company.faq' });

  return pageMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    locale,
    path: routes.faq,
  });
}

export default async function FaqPage({ params }: FaqPageProps) {
  if (!isLocale(params.locale)) notFound();

  const locale: Locale = params.locale;
  const t = await getTranslations({ locale, namespace: 'company.faq' });
  // The questions are lists, which an ICU message cannot express, so they come from the
  // typed catalogue in the order the copy gives them.
  const { groups } = getMessages(locale).company.faq;
  const groupIds = Object.keys(groups) as FaqGroup[];
  const itemsOf = (group: FaqGroup) => Object.entries(groups[group].items);

  return (
    <CompanyPage intro={t('intro')} locale={locale} path={routes.faq} title={t('title')}>
      <FAQJsonLd faqs={groupIds.flatMap((group) => itemsOf(group).map(([, item]) => item))} />

      <div className="grid gap-12">
        {groupIds.map((group) => (
          <section aria-labelledby={`faq-${group}`} key={group}>
            <h2 className={SECTION_HEADING} id={`faq-${group}`}>
              {t(`groups.${group}.heading`)}
            </h2>

            <div className="mt-5 grid gap-3">
              {itemsOf(group).map(([id, item]) => (
                <details
                  className="group rounded-[12px] border border-brand-border bg-white open:border-brand-terracotta/40"
                  key={id}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-[12px] px-5 py-4 text-[15px] font-bold leading-6 text-brand-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terracotta [&::-webkit-details-marker]:hidden">
                    {item.question}
                    <ChevronDown
                      aria-hidden="true"
                      className="shrink-0 text-brand-muted transition group-open:rotate-180"
                      size={18}
                    />
                  </summary>
                  <p className="px-5 pb-5 text-[14px] leading-6 text-brand-muted">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section
        aria-labelledby="faq-still-stuck"
        className="mt-14 flex flex-col items-start gap-4 rounded-[15px] bg-brand-sand p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
      >
        <div>
          <h2 className="text-[18px] font-bold text-brand-ink" id="faq-still-stuck">
            {t('stillStuck.heading')}
          </h2>
          <p className="mt-1 text-[14px] leading-6 text-brand-ink/80">{t('stillStuck.body')}</p>
        </div>
        <Link className={PRIMARY_BUTTON} href={routes.contact(locale)}>
          {t('stillStuck.cta')}
        </Link>
      </section>

      <ExploreMore className="mt-16" current="faq" locale={locale} />
    </CompanyPage>
  );
}
