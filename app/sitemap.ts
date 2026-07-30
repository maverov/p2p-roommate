import { MetadataRoute } from 'next';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseURL = appUrl;
  const locales = ['bg', 'en'];

  // Static pages for each locale
  const staticPages = locales.map(locale => ({
    url: `${baseURL}/${locale}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 1,
  }));

  // Hardcoded sample listings (in production, fetch from DB)
  const listingPages = [
    { id: '1', lastModified: new Date('2024-07-20') },
    { id: '2', lastModified: new Date('2024-07-19') },
    { id: '3', lastModified: new Date('2024-07-18') },
    { id: '4', lastModified: new Date('2024-07-17') },
    { id: '5', lastModified: new Date('2024-07-16') },
  ];

  const listingUrls = listingPages.map(listing => ({
    url: `${baseURL}/listings/${listing.id}`,
    lastModified: listing.lastModified,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Additional important pages
  const additionalPages = [
    {
      url: `${baseURL}/bg`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
    {
      url: `${baseURL}/en`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
  ];

  return [...staticPages, ...listingUrls, ...additionalPages];
}
