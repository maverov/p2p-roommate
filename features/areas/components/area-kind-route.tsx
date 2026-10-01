import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { isCityId, type AreaKind } from '@/lib/areas';
import { isLocale } from '@/lib/i18n';

import { AreaPage, areaMetadata } from './AreaPage';

type AreaKindPageProps = {
  params: { locale: string; city: string };
};

/** The page module behind `/{locale}/{kind segment}/{city}`: every kind shares it. */
export function areaKindRoute(kind: AreaKind) {
  async function generateMetadata({ params }: AreaKindPageProps): Promise<Metadata> {
    if (!isLocale(params.locale) || !isCityId(params.city)) notFound();

    return areaMetadata({ locale: params.locale, citySlug: params.city, kind });
  }

  function AreaKindPage({ params }: AreaKindPageProps) {
    if (!isLocale(params.locale) || !isCityId(params.city)) notFound();

    return <AreaPage citySlug={params.city} kind={kind} locale={params.locale} />;
  }

  return { generateMetadata, AreaKindPage };
}
