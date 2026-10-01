import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  BODY_TEXT,
  CompanyPage,
  ExploreMore,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
  SECTION_HEADING,
} from '@/features/company/components/company-ui';
import { WhyStayCards } from '@/features/company/components/WhyStayCards';
import { isLocale, type Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';

const FACTS = ['cities', 'languages', 'commission'] as const;

type AboutPageProps = {
  params: { locale: string };
};

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : 'bg';
  const t = await getTranslations({ locale, namespace: 'company.about' });

  return pageMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    locale,
    path: routes.about,
  });
}

export default async function AboutPage({ params }: AboutPageProps) {
  if (!isLocale(params.locale)) notFound();

  const locale: Locale = params.locale;
  const t = await getTranslations({ locale, namespace: 'company' });

  return (
    <CompanyPage
      intro={t('about.intro')}
      locale={locale}
      path={routes.about}
      title={t('about.title')}
    >
      <section aria-labelledby="about-why">
        <h2 className={SECTION_HEADING} id="about-why">
          {t('why.heading')}
        </h2>
        <WhyStayCards className="mt-5" locale={locale} />
      </section>

      <section
        aria-labelledby="about-sharing"
        className="mt-16 grid items-center gap-8 md:grid-cols-2 md:gap-12"
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-[15px] bg-brand-border md:aspect-[4/5]">
          <Image
            alt={t('about.sharing.imageAlt')}
            className="object-cover"
            fill
            quality={85}
            sizes="(min-width: 1024px) 460px, (min-width: 768px) 45vw, 100vw"
            src="/images/landing/plovdiv.jpg"
          />
        </div>

        <div>
          <h2 className={SECTION_HEADING} id="about-sharing">
            {t('about.sharing.heading')}
          </h2>
          <p className={`mt-4 ${BODY_TEXT}`}>{t('about.sharing.p1')}</p>
          <p className={`mt-3 ${BODY_TEXT}`}>{t('about.sharing.p2')}</p>
        </div>
      </section>

      <section aria-labelledby="about-mission" className="mt-16 max-w-3xl">
        <h2 className={SECTION_HEADING} id="about-mission">
          {t('about.mission.heading')}
        </h2>
        <p className={`mt-4 ${BODY_TEXT}`}>{t('about.mission.p1')}</p>
        <p className={`mt-3 ${BODY_TEXT}`}>{t('about.mission.p2')}</p>
      </section>

      <section
        aria-labelledby="about-facts"
        className="mt-16 rounded-[15px] bg-brand-sand px-6 py-8 sm:px-10"
      >
        <h2 className="sr-only" id="about-facts">
          {t('about.facts.heading')}
        </h2>
        <dl className="grid gap-8 sm:grid-cols-3">
          {FACTS.map((fact) => (
            // The number reads first on screen; the label stays first for screen readers.
            <div className="flex flex-col-reverse gap-2" key={fact}>
              <dt className="text-[14px] leading-6 text-brand-ink">
                {t(`about.facts.${fact}.label`)}
              </dt>
              <dd className="font-serif text-[44px] font-medium leading-none text-brand-terracotta">
                {t(`about.facts.${fact}.value`)}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section
        aria-labelledby="about-cta"
        className="mt-16 flex flex-col items-start gap-5 rounded-[15px] border border-brand-border bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
      >
        <h2
          className="font-serif text-[24px] font-medium leading-tight text-brand-ink"
          id="about-cta"
        >
          {t('about.cta.heading')}
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link className={PRIMARY_BUTTON} href={routes.listings(locale)}>
            {t('about.cta.rooms')}
          </Link>
          <Link className={SECONDARY_BUTTON} href={routes.findRoommate(locale)}>
            {t('about.cta.roommates')}
          </Link>
        </div>
      </section>

      <ExploreMore className="mt-16" current="about" locale={locale} />
    </CompanyPage>
  );
}
