import type { Metadata } from 'next';

import { openGraphLocale, type Locale } from '@/lib/i18n';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

type PageMetadataInput = {
  title: string;
  description: string;
  locale: Locale;
  /** The page's path in any locale; gives the canonical URL and the hreflang alternates. */
  path: (locale: Locale) => string;
  type?: 'website' | 'article';
};

/**
 * What every indexable content page declares: title, description, canonical URL with its
 * hreflang alternates, and share tags. A page's `openGraph` and `twitter` replace the root
 * layout's whole objects, so the share image is repeated here.
 */
export function pageMetadata({
  description,
  locale,
  path,
  title,
  type = 'website',
}: PageMetadataInput): Metadata {
  const url = `${appUrl}${path(locale)}`;
  // Social titles bypass the layout's `%s | Stay.bg` template.
  const socialTitle = `${title} | Stay.bg`;
  const image = `${appUrl}/og-image.png`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        'bg-BG': `${appUrl}${path('bg')}`,
        'en-US': `${appUrl}${path('en')}`,
      },
    },
    openGraph: {
      title: socialTitle,
      description,
      url,
      siteName: 'Stay.bg',
      images: [{ url: image, width: 1200, height: 630 }],
      type,
      locale: openGraphLocale[locale],
    },
    twitter: { card: 'summary_large_image', title: socialTitle, description, images: [image] },
  };
}
