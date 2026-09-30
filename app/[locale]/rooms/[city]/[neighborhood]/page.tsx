import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { AreaPage, areaMetadata } from '@/features/areas/components/AreaPage';
import { isCityId, isNeighborhoodInCity } from '@/lib/areas';
import { isLocale } from '@/lib/i18n';

type NeighborhoodPageProps = {
  params: { locale: string; city: string; neighborhood: string };
};

function resolve(params: NeighborhoodPageProps['params']) {
  const { city, locale, neighborhood } = params;

  return isLocale(locale) && isCityId(city) && isNeighborhoodInCity(city, neighborhood)
    ? { locale, citySlug: city, neighborhoodSlug: neighborhood }
    : null;
}

export async function generateMetadata({ params }: NeighborhoodPageProps): Promise<Metadata> {
  const area = resolve(params);

  if (!area) notFound();

  return areaMetadata(area);
}

export default function NeighborhoodPage({ params }: NeighborhoodPageProps) {
  const area = resolve(params);

  if (!area) notFound();

  return <AreaPage {...area} />;
}
