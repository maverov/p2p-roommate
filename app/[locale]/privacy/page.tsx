import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { LegalDocument, legalMetadata } from '@/features/legal/components/LegalDocument';
import { isLocale } from '@/lib/i18n';

type PrivacyPageProps = {
  params: { locale: string };
};

export async function generateMetadata({ params }: PrivacyPageProps): Promise<Metadata> {
  return legalMetadata('privacy', isLocale(params.locale) ? params.locale : 'bg');
}

export default function PrivacyPage({ params }: PrivacyPageProps) {
  if (!isLocale(params.locale)) notFound();

  return <LegalDocument kind="privacy" locale={params.locale} />;
}
