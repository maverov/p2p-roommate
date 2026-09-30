import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { TEMPLATE_DOCS, TEMPLATE_SLUGS } from '@/features/templates/documents';
import { isLocale, type Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';

type TemplatesPageProps = {
  params: { locale: string };
};

export async function generateMetadata({ params }: TemplatesPageProps): Promise<Metadata> {
  if (!isLocale(params.locale)) notFound();

  const locale = params.locale;
  const t = await getTranslations({ locale, namespace: 'templates' });

  return pageMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    locale,
    path: routes.templates,
  });
}

export default async function TemplatesPage({ params }: TemplatesPageProps) {
  if (!isLocale(params.locale)) notFound();

  const locale: Locale = params.locale;
  const t = await getTranslations({ locale, namespace: 'templates' });

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 lg:px-6">
      <h1 className="text-[28px] font-bold leading-9 text-brand-ink">{t('title')}</h1>
      <p className="mt-2 text-[15px] leading-7 text-brand-muted">{t('intro')}</p>

      <ul className="mt-8 grid gap-4">
        {TEMPLATE_DOCS.map((doc) => (
          <li
            className="relative rounded-[15px] border border-brand-border bg-white p-5 transition hover:border-brand-terracotta"
            key={doc}
          >
            <h2 className="text-[17px] font-bold text-brand-ink">{t(`docs.${doc}.title`)}</h2>
            <p className="mt-1 text-[14px] leading-6 text-brand-muted">
              {t(`docs.${doc}.summary`)}
            </p>
            <Link
              className="mt-3 inline-block text-[14px] font-bold text-brand-terracotta after:absolute after:inset-0 after:rounded-[15px] hover:underline"
              href={routes.template(locale, TEMPLATE_SLUGS[doc])}
            >
              {t('open')} →
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-8 rounded-[15px] border border-brand-border bg-brand-cream p-4 text-[13px] leading-6 text-brand-muted">
        {t('disclaimer')}
      </p>
    </main>
  );
}
