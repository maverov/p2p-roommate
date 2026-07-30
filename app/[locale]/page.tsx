import { getTranslations } from 'next-intl/server';

import FeaturedListings from '@/components/home/FeaturedListings';
import HeroSection from '@/components/home/HeroSection';
import HowItWorks from '@/components/home/HowItWorks';
import ListPropertyCta from '@/components/home/ListPropertyCta';
import PopularCities from '@/components/home/PopularCities';
import Testimonials from '@/components/home/Testimonials';
import { openGraphLocale, type Locale } from '@/lib/i18n';
import { OrganizationJsonLd, BreadcrumbJsonLd } from '@/lib/jsonld';
import type { Metadata } from 'next';

interface PageProps {
  params: {
    locale: Locale;
  };
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'metadata.home' });

  // The root layout's `%s | Stay.bg` template brands `metadata.title`; Open Graph
  // titles bypass that template, so they carry the brand themselves.
  const title = t('title');

  return {
    title,
    description: t('description'),
    alternates: {
      canonical: `${appUrl}/${params.locale}`,
      languages: {
        'bg-BG': `${appUrl}/bg`,
        'en-US': `${appUrl}/en`,
      },
    },
    openGraph: {
      title: t('ogTitle', { title }),
      description: t('ogDescription'),
      url: `${appUrl}/${params.locale}`,
      type: 'website',
      locale: openGraphLocale[params.locale],
    },
  };
}

export default async function HomePage({ params }: PageProps) {
  const t = await getTranslations({ locale: params.locale, namespace: 'metadata.breadcrumb' });

  const breadcrumbItems = [
    { name: t('home'), url: `${appUrl}/${params.locale}` },
    { name: t('findListings'), url: `${appUrl}/${params.locale}/listings` },
  ];

  return (
    <>
      <OrganizationJsonLd appUrl={appUrl} />
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <main id="main-content" className="min-h-screen bg-brand-cream text-brand-ink">
        <HeroSection locale={params.locale} />
        <PopularCities locale={params.locale} />
        <FeaturedListings locale={params.locale} />
        <ListPropertyCta locale={params.locale} />
        <Testimonials locale={params.locale} />
        <HowItWorks locale={params.locale} />
      </main>
    </>
  );
}
