import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Handshake,
  LifeBuoy,
  Mail,
  Newspaper,
  Phone,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react';

import { CARD, CompanyPage } from '@/features/company/components/company-ui';
import { CONTACT_EMAILS, type ContactChannel } from '@/lib/company';
import { isLocale, type Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';

const CHANNELS: ReadonlyArray<{ id: ContactChannel; icon: LucideIcon }> = [
  { id: 'support', icon: LifeBuoy },
  { id: 'safety', icon: ShieldAlert },
  { id: 'press', icon: Newspaper },
  { id: 'partners', icon: Handshake },
];

type ContactPageProps = {
  params: { locale: string };
};

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : 'bg';
  const t = await getTranslations({ locale, namespace: 'company.contact' });

  return pageMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    locale,
    path: routes.contact,
  });
}

export default async function ContactPage({ params }: ContactPageProps) {
  if (!isLocale(params.locale)) notFound();

  const locale: Locale = params.locale;
  const t = await getTranslations({ locale, namespace: 'company.contact' });
  const tSafety = await getTranslations({ locale, namespace: 'safety.emergency' });

  return (
    <CompanyPage intro={t('intro')} locale={locale} path={routes.contact} title={t('title')}>
      <div className="grid gap-4 sm:grid-cols-2">
        {CHANNELS.map((channel) => (
          <section
            aria-labelledby={`contact-${channel.id}`}
            className={`${CARD} flex flex-col p-6`}
            key={channel.id}
          >
            <channel.icon
              aria-hidden="true"
              className="text-brand-olive"
              size={24}
              strokeWidth={1.8}
            />
            <h2
              className="mt-3 text-[17px] font-bold leading-6 text-brand-ink"
              id={`contact-${channel.id}`}
            >
              {t(`channels.${channel.id}.title`)}
            </h2>
            <p className="mt-1.5 flex-1 text-[14px] leading-6 text-brand-muted">
              {t(`channels.${channel.id}.body`)}
            </p>

            <a
              className="mt-4 inline-flex items-center gap-2 self-start text-[15px] font-bold text-brand-terracotta hover:underline"
              href={`mailto:${CONTACT_EMAILS[channel.id]}`}
            >
              <Mail aria-hidden="true" size={16} strokeWidth={2} />
              {CONTACT_EMAILS[channel.id]}
            </a>

            {channel.id === 'press' && (
              <Link
                className="mt-2 self-start text-[14px] font-semibold text-brand-ink hover:text-brand-terracotta"
                href={routes.press(locale)}
              >
                {t('channels.press.link')} →
              </Link>
            )}
          </section>
        ))}
      </div>

      <section
        aria-labelledby="contact-before"
        className="mt-10 rounded-[15px] bg-brand-sand p-6 sm:p-8"
      >
        <h2 className="text-[18px] font-bold text-brand-ink" id="contact-before">
          {t('before.heading')}
        </h2>
        <p className="mt-1 text-[14px] leading-6 text-brand-ink/80">{t('before.body')}</p>
        <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          <Link
            className="text-[14px] font-bold text-brand-terracotta hover:underline"
            href={routes.faq(locale)}
          >
            {t('before.faq')} →
          </Link>
          <Link
            className="text-[14px] font-bold text-brand-terracotta hover:underline"
            href={routes.safety(locale)}
          >
            {t('before.safety')} →
          </Link>
        </p>
      </section>

      <section
        aria-labelledby="contact-emergency"
        className="mt-4 rounded-[15px] border border-red-200 bg-red-50 p-6"
      >
        <h2 className="text-[17px] font-bold text-red-800" id="contact-emergency">
          {tSafety('title')}
        </h2>
        <p className="mt-2 text-[14px] leading-6 text-red-900">{tSafety('body')}</p>
        <a
          className="mt-4 inline-flex items-center gap-2 rounded-[10px] bg-red-600 px-4 py-2.5 text-[14px] font-bold text-white transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          href="tel:112"
        >
          <Phone aria-hidden="true" size={16} strokeWidth={2} />
          {tSafety('call')}
        </a>
      </section>
    </CompanyPage>
  );
}
