import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { LegalDocument, legalMetadata } from '@/features/legal/components/LegalDocument';
import { isLocale } from '@/lib/i18n';

type TermsPageProps = {
  params: { locale: string };
};

export async function generateMetadata({ params }: TermsPageProps): Promise<Metadata> {
  return legalMetadata('terms', isLocale(params.locale) ? params.locale : 'bg');
}

export default function TermsPage({ params }: TermsPageProps) {
  if (!isLocale(params.locale)) notFound();

  return <LegalDocument kind="terms" locale={params.locale} />;
}
