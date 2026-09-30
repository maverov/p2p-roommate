import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PrintButton } from '@/features/templates/components/PrintButton';
import { TemplateDocument } from '@/features/templates/components/TemplateDocument';
import {
  SIGNATURE_REPEAT,
  TEMPLATE_DOCS,
  TEMPLATE_SLUGS,
  templateFromSlug,
  type TemplateContent,
} from '@/features/templates/documents';
import { isLocale, type Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { getMessages } from '@/locales';

type TemplatePageProps = {
  params: { locale: string; slug: string };
};

export const dynamicParams = false;

export function generateStaticParams() {
  return TEMPLATE_DOCS.map((doc) => ({ slug: TEMPLATE_SLUGS[doc] }));
}

function resolve(params: TemplatePageProps['params']) {
  const doc = templateFromSlug(params.slug);

  return isLocale(params.locale) && doc ? { locale: params.locale, doc } : null;
}

export async function generateMetadata({ params }: TemplatePageProps): Promise<Metadata> {
  const found = resolve(params);

  if (!found) notFound();

  const { doc, locale } = found;
  const t = await getTranslations({ locale, namespace: 'templates' });

  return pageMetadata({
    title: t(`docs.${doc}.title`),
    description: t(`docs.${doc}.metaDescription`),
    locale,
    path: (to) => routes.template(to, TEMPLATE_SLUGS[doc]),
    type: 'article',
  });
}

export default async function TemplatePage({ params }: TemplatePageProps) {
  const found = resolve(params);

  if (!found) notFound();

  const { doc } = found;
  const locale: Locale = found.locale;
  const t = await getTranslations({ locale, namespace: 'templates' });
  // Sections, clauses and table rows are ordered lists, which ICU messages cannot
  // express, so the document is read from the typed catalogue as a whole.
  const content: TemplateContent = getMessages(locale).templates.docs[doc];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 lg:px-6 print:max-w-none print:p-0">
      <div className="mb-6 grid gap-4 print:hidden">
        <Link
          className="text-[14px] font-bold text-brand-terracotta hover:underline"
          href={routes.templates(locale)}
        >
          ← {t('back')}
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <PrintButton label={t('print')} />
          <p className="text-[13px] text-brand-muted">{t('printHint')}</p>
        </div>

        <div className="grid gap-2 rounded-[15px] border border-brand-border bg-brand-cream p-4 text-[13px] leading-6 text-brand-muted">
          <p>{t('disclaimer')}</p>
          <p>{t('versionNote')}</p>
        </div>
      </div>

      <TemplateDocument content={content} signatureRepeat={SIGNATURE_REPEAT[doc]} />
    </main>
  );
}
