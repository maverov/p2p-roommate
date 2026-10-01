import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Download, FileImage, Images, Mail, type LucideIcon } from 'lucide-react';

import { Avatar } from '@/components/shared/Avatar';
import {
  BODY_TEXT,
  CARD,
  CompanyPage,
  PRIMARY_BUTTON,
  SECTION_HEADING,
} from '@/features/company/components/company-ui';
import { FeaturedIn } from '@/features/company/components/FeaturedIn';
import { PRESS_ASSETS, PRESS_RELEASES, SPOKESPEOPLE } from '@/features/company/press';
import { CONTACT_EMAILS } from '@/lib/company';
import { formatDate } from '@/lib/format';
import { isLocale, type Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';

const ASSETS: ReadonlyArray<{ id: keyof typeof PRESS_ASSETS; icon: LucideIcon }> = [
  { id: 'logos', icon: FileImage },
  { id: 'photos', icon: Images },
];

type PressPageProps = {
  params: { locale: string };
};

export async function generateMetadata({ params }: PressPageProps): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : 'bg';
  const t = await getTranslations({ locale, namespace: 'company.press' });

  return pageMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    locale,
    path: routes.press,
  });
}

/** Mirrors a classic press office: enquiries, background, spokespeople, releases, assets, coverage. */
export default async function PressPage({ params }: PressPageProps) {
  if (!isLocale(params.locale)) notFound();

  const locale: Locale = params.locale;
  const t = await getTranslations({ locale, namespace: 'company.press' });
  const pressEmail = CONTACT_EMAILS.press;

  return (
    <CompanyPage locale={locale} path={routes.press} title={t('title')}>
      <section aria-labelledby="press-enquiries" className="max-w-3xl">
        <h2 className={SECTION_HEADING} id="press-enquiries">
          {t('enquiries.heading')}
        </h2>
        <p className={`mt-4 ${BODY_TEXT}`}>{t('enquiries.body')}</p>
        <a className={`mt-5 ${PRIMARY_BUTTON}`} href={`mailto:${pressEmail}`}>
          <Mail aria-hidden="true" size={16} strokeWidth={2} />
          {t('enquiries.cta')}
        </a>
        <p className="mt-2 text-[14px] text-brand-muted">{pressEmail}</p>
      </section>

      <section aria-labelledby="press-background" className="mt-14 max-w-3xl">
        <h2 className={SECTION_HEADING} id="press-background">
          {t('background.heading')}
        </h2>
        <p className={`mt-4 ${BODY_TEXT}`}>{t('background.body')}</p>
        <p className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
          <Link
            className="text-[14px] font-bold text-brand-terracotta hover:underline"
            href={routes.about(locale)}
          >
            {t('background.about')} →
          </Link>
          <Link
            className="text-[14px] font-bold text-brand-terracotta hover:underline"
            href={routes.howItWorks(locale)}
          >
            {t('background.howItWorks')} →
          </Link>
        </p>
      </section>

      <section aria-labelledby="press-spokespeople" className="mt-14">
        <h2 className={SECTION_HEADING} id="press-spokespeople">
          {t('spokespeople.heading')}
        </h2>
        <p className={`mt-4 max-w-3xl ${BODY_TEXT}`}>{t('spokespeople.body')}</p>

        {SPOKESPEOPLE.length > 0 && (
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {SPOKESPEOPLE.map((person) => (
              <li className={`${CARD} flex gap-4 p-5`} key={person.name}>
                <Avatar name={person.name} size={72} src={person.photoSrc} />
                <div className="min-w-0">
                  <p className="text-[16px] font-bold text-brand-ink">{person.name}</p>
                  <p className="text-[13px] font-semibold text-brand-terracotta">
                    {person.role[locale]}
                  </p>
                  <p className="mt-2 text-[14px] leading-6 text-brand-muted">
                    {person.bio[locale]}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="press-releases" className="mt-14">
        <h2 className={SECTION_HEADING} id="press-releases">
          {t('releases.heading')}
        </h2>

        {PRESS_RELEASES.length > 0 ? (
          <ul className="mt-5 divide-y divide-brand-border rounded-[15px] border border-brand-border bg-white">
            {PRESS_RELEASES.map((release) => (
              <li key={release.href}>
                <a
                  className="flex flex-col gap-1 px-5 py-4 transition hover:bg-brand-chip sm:flex-row sm:items-baseline sm:gap-6"
                  href={release.href}
                >
                  <time className="shrink-0 text-[13px] text-brand-muted" dateTime={release.date}>
                    {formatDate(release.date, locale)}
                  </time>
                  <span className="text-[15px] font-semibold text-brand-ink">
                    {release.title[locale]}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className={`mt-4 ${BODY_TEXT}`}>{t('releases.empty')}</p>
        )}
      </section>

      <section aria-labelledby="press-assets" className="mt-14">
        <h2 className={SECTION_HEADING} id="press-assets">
          {t('assets.heading')}
        </h2>

        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          {ASSETS.map((asset) => {
            const href = PRESS_ASSETS[asset.id].href;
            const title = t(`assets.${asset.id}.title`);

            return (
              <li className={`${CARD} flex flex-col p-6`} key={asset.id}>
                <asset.icon
                  aria-hidden="true"
                  className="text-brand-olive"
                  size={24}
                  strokeWidth={1.8}
                />
                <h3 className="mt-3 text-[17px] font-bold text-brand-ink">{title}</h3>
                <p className="mt-1.5 flex-1 text-[14px] leading-6 text-brand-muted">
                  {t(`assets.${asset.id}.body`)}
                </p>
                <a
                  className="mt-4 inline-flex items-center gap-2 self-start text-[14px] font-bold text-brand-terracotta hover:underline"
                  // Until the files exist, the press office sends them on request.
                  href={
                    href ??
                    `mailto:${pressEmail}?subject=${encodeURIComponent(`Stay.bg: ${title}`)}`
                  }
                  {...(href ? { download: true } : {})}
                >
                  {href ? (
                    <Download aria-hidden="true" size={16} strokeWidth={2} />
                  ) : (
                    <Mail aria-hidden="true" size={16} strokeWidth={2} />
                  )}
                  {href ? t('assets.download') : t('assets.request')}
                </a>
              </li>
            );
          })}
        </ul>
      </section>

      <FeaturedIn className="mt-14" locale={locale} />
    </CompanyPage>
  );
}
