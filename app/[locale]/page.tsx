import FeaturedListings from '@/components/home/FeaturedListings';
import HeroSection from '@/components/home/HeroSection';
import ListPropertyCta from '@/components/home/ListPropertyCta';
import PopularCities from '@/components/home/PopularCities';
import type { Locale } from '@/lib/i18n';
import { getTranslations } from '@/lib/i18n-server';
import { getNeighborhoodGroupsByCity } from '@/lib/areas';

interface PageProps {
  params: {
    locale: Locale;
  };
}

export default async function HomePage({ params }: PageProps) {
  await getTranslations(params.locale);
  getNeighborhoodGroupsByCity('sofia');

  return (
    <main id="main-content" className="min-h-screen bg-[#20211f] text-zinc-100">
      {/* <header className="self-end" aria-label={t('home.switch_language')}>
        <LocaleSwitcher />
      </header> */}
      {/* <h1 className="text-3xl font-semibold tracking-tight">{t('home.welcome')}</h1> */}
      <HeroSection />
      <PopularCities />
      <FeaturedListings />
      <ListPropertyCta />
    </main>
  );
}
