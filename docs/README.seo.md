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
8. Titles and descriptions come from translation keys, never from a `locale === 'bg' ? …`
   ternary — see [README.translations.md](README.translations.md).

## Example: page metadata with canonical + alternates

Metadata is localized through the `metadata` namespace (or the page's own namespace),
resolved with an explicit locale so the route stays statically renderable. `routes.*`
builds the paths so the typed route system stays the single source of URL truth, and
`openGraphLocale` maps `bg` → `bg_BG` without branching on copy.

```tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { isLocale, openGraphLocale } from '@/lib/i18n';
import { routes } from '@/lib/routes';

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : 'bg';
  const t = await getTranslations({ locale, namespace: 'listings.search' });
  const tMeta = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: t('heading'),
    description: tMeta('listings.description'),
    alternates: {
      canonical: `${appUrl}${routes.listings(locale)}`,
      languages: {
        'bg-BG': `${appUrl}${routes.listings('bg')}`,
        'en-US': `${appUrl}${routes.listings('en')}`,
      },
    },
    openGraph: {
      title: t('heading'),
      description: tMeta('listings.description'),
      url: `${appUrl}${routes.listings(locale)}`,
      locale: openGraphLocale[locale],
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

The root `app/layout.tsx` keeps static brand defaults: it sits outside `[locale]` and
also serves `/login` and `/signup`, so localizing it would force dynamic rendering. Its
`%s | Stay.bg` title template brands every page title below it — but Open Graph and
Twitter titles bypass that template, so spell the brand out there.

## Rule: filtered and tabbed URLs are not indexable

Query-string permutations are near-duplicates of the clean index. Set
`robots: { index: false, follow: true }` when any filter or tab is active:

```tsx
robots: Object.keys(searchParams).length > 0 ? { index: false, follow: true } : undefined,
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

## Robots

`app/robots.ts` exists. It allows `/`, disallows `/api`, `/admin`, `/internal` and
`/auth`, blocks `GPTBot` and `ChatGPT-User`, and points at `/sitemap.xml`. Shape:

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

## Sitemap

`app/sitemap.ts` exists but is **not production-ready** — a known gap, not a pattern to
copy:

- listing URLs are five hardcoded ids instead of a query against published listings;
- those URLs are `/listings/<id>`, which is not a route — the real one is
  `/<locale>/listings/<id>` (`routes.listing(locale, id)`);
- `/bg` and `/en` are emitted twice.

Fixing it means making `sitemap()` async, reading published listing ids from
`features/listings/server/repository`, and building every URL through `routes.*` so the
typed route helpers stay the single source of URL truth. Shape to aim for:

```tsx
import type { MetadataRoute } from 'next';

import { locales } from '@/lib/i18n';
import { routes } from '@/lib/routes';

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = locales.flatMap((locale) => [
    { url: `${appUrl}${routes.home(locale)}`, changeFrequency: 'weekly' as const, priority: 1 },
    { url: `${appUrl}${routes.listings(locale)}`, changeFrequency: 'daily' as const, priority: 0.9 },
  ]);

  // …plus one entry per published listing, per locale, from the repository.
  return entries.map((entry) => ({ ...entry, lastModified: new Date() }));
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
