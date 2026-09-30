import { getTranslations } from 'next-intl/server';

import type { Locale } from '@/lib/i18n';

/**
 * Section order per document. The headings are the agreed structure; the body of each
 * section is a placeholder until the text comes back from legal review.
 */
const SECTIONS = {
  privacy: [
    'controller',
    'data',
    'purposes',
    'processors',
    'retention',
    'rights',
    'cookies',
    'complaints',
  ],
  terms: [
    'service',
    'accounts',
    'listings',
    'prohibited',
    'moderation',
    'liability',
    'termination',
    'law',
    'contact',
  ],
} as const;

export type LegalDocumentKind = keyof typeof SECTIONS;

type LegalDocumentProps = {
  kind: LegalDocumentKind;
  locale: Locale;
};

export async function LegalDocument({ kind, locale }: LegalDocumentProps) {
  const t = await getTranslations({ locale, namespace: 'legal' });
  // One branch per document keeps every message key checked by the compiler.
  const headings =
    kind === 'privacy'
      ? SECTIONS.privacy.map((section) => t(`privacy.sections.${section}`))
      : SECTIONS.terms.map((section) => t(`terms.sections.${section}`));

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 lg:px-6">
      <p
        className="rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800"
        role="note"
      >
        {t('draftNotice')}
      </p>

      <h1 className="mt-8 text-[28px] font-bold leading-9 text-brand-ink">{t(`${kind}.title`)}</h1>
      <p className="mt-2 text-[15px] text-brand-muted">{t(`${kind}.intro`)}</p>

      <ol className="mt-8 space-y-8">
        {headings.map((heading, index) => (
          <li key={heading}>
            <h2 className="text-[18px] font-semibold text-brand-ink">
              {index + 1}. {heading}
            </h2>
            <p className="mt-2 text-[14px] italic text-brand-muted">{t('placeholder')}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}

export async function legalMetadata(kind: LegalDocumentKind, locale: Locale) {
  const t = await getTranslations({ locale, namespace: 'legal' });

  return {
    title: t(`${kind}.metaTitle`),
    // Drafts stay out of search results until the reviewed text is published.
    robots: { index: false },
  };
}
