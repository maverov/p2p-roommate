# SEO Guide: Checklist, Rules, and Examples

Use this guide when adding or changing pages so we keep search visibility strong and consistent.

## Why SEO matters

Good SEO helps the right users discover listings and platform pages from search engines, and it improves click-through rate by showing clear titles, descriptions, and preview cards.

## Checklist (before merging)

1. Every indexable page has a unique `title` and `description`.
2. Canonical URL is set for each page.
3. Localized pages define language alternates (`hreflang` via `alternates.languages`).
4. Noindex is set for pages that should not rank (auth, internal flows, error-like utility pages).
5. `robots.ts` exists and points to sitemap.
6. `sitemap.ts` includes all public indexable routes.
7. Open Graph and Twitter metadata are set and use a real image URL.
8. Headings are semantic (`h1` once per page, then `h2`, `h3`).
9. Important page content is server-rendered, not client-only hidden behind loading states.
10. Structured data (JSON-LD) is added where useful (organization, listing, FAQ).

## Team rules

1. Do not ship a new public route without metadata.
2. Do not reuse the same title/description across different pages.
3. Keep canonical URLs absolute and consistent with `NEXT_PUBLIC_APP_URL`.
4. Keep locale URLs stable (`/bg/...`, `/en/...`) and map alternates correctly.
5. Use one primary `h1` per page.
6. Do not block important pages in `robots`.
7. Keep OG image files real and reachable in production.

## Example: page metadata with canonical + alternates

```tsx
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: { locale: 'bg' | 'en' };
}): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const path = '/listings';

  return {
    title: params.locale === 'bg' ? 'Обяви за наем | Stay.bg' : 'Rental Listings | Stay.bg',
    description:
      params.locale === 'bg'
        ? 'Разгледайте проверени обяви за стаи и апартаменти без посредник.'
        : 'Browse verified room and apartment listings without intermediaries.',
    alternates: {
      canonical: `${baseUrl}/${params.locale}${path}`,
      languages: {
        bg: `${baseUrl}/bg${path}`,
        en: `${baseUrl}/en${path}`,
        'x-default': `${baseUrl}/bg${path}`,
      },
    },
    openGraph: {
      title: params.locale === 'bg' ? 'Обяви за наем | Stay.bg' : 'Rental Listings | Stay.bg',
      description:
        params.locale === 'bg'
          ? 'Проверени обяви без посредник.'
          : 'Verified listings without intermediaries.',
      url: `${baseUrl}/${params.locale}${path}`,
      images: ['/og-image.png'],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      images: ['/og-image.png'],
    },
  };
}
```

## Example: noindex for auth pages

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign in | Stay.bg',
  robots: {
    index: false,
    follow: false,
  },
};
```

## Example: robots configuration

Create `app/robots.ts`:

```tsx
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

## Example: sitemap configuration

Create `app/sitemap.ts`:

```tsx
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const routes = ['', '/bg', '/en', '/bg/listings', '/en/listings'];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: route.includes('/listings') ? 0.8 : 1.0,
  }));
}
```

## Example: JSON-LD structured data

```tsx
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Stay.bg',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
};

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
/>;
```

## Recommended tools

- Google Search Console: https://search.google.com/search-console/about
- Rich Results Test: https://search.google.com/test/rich-results
- Lighthouse SEO audits: https://developer.chrome.com/docs/lighthouse/seo/
- Next.js Metadata API: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
