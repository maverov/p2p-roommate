import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { AreaPage, areaMetadata } from '@/features/areas/components/AreaPage';
import { isCityId } from '@/lib/areas';
import { isLocale } from '@/lib/i18n';

type CityPageProps = {
  params: { locale: string; city: string };
};

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  if (!isLocale(params.locale) || !isCityId(params.city)) notFound();

  return areaMetadata({ locale: params.locale, citySlug: params.city });
}

export default function CityPage({ params }: CityPageProps) {
  if (!isLocale(params.locale) || !isCityId(params.city)) notFound();

  return <AreaPage citySlug={params.city} locale={params.locale} />;
}
