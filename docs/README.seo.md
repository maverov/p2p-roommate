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
9. Render JSON-LD through `lib/jsonld.tsx`, which escapes user text (see below).

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
also serves the auth pages and `/admin`, so localizing it would force dynamic rendering. Its
`%s | Stay.bg` title template brands every page title below it — but Open Graph and
Twitter titles bypass that template, so spell the brand out there.

## Rule: filtered and tabbed URLs are not indexable

Query-string permutations are near-duplicates of the clean index. Set
`robots: { index: false, follow: true }` when any filter or tab is active:

```tsx
robots: Object.keys(searchParams).length > 0 ? { index: false, follow: true } : undefined,
```

## Example: noindex for auth pages

`app/(auth)/layout.tsx` sets `robots` once for every auth page, and each page still takes
its title from the `auth` namespace, in the locale remembered in the `NEXT_LOCALE` cookie:

```tsx
// app/(auth)/layout.tsx
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

// app/(auth)/login/page.tsx
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: getCookieLocale(), namespace: 'auth.login' });

  return { title: t('submit') };
}
```

Signed-in pages (`/settings`, `/saved`, `/messages`, My Listings, Applied Listings, the
listing form) and the draft legal pages (`/privacy`, `/terms`) set
`robots: { index: false }` in their own `generateMetadata`.

## Robots

`app/robots.ts` exists. It allows `/`, disallows `/api`, `/admin`, `/internal` and
`/auth`, blocks `GPTBot` and `ChatGPT-User`, and points at `/sitemap.xml`. `/auth` is not
a route; the auth pages are `/login`, `/signup`, `/forgot-password`, `/reset-password`
and `/verify-email`, which stay out of the index through `robots: { index: false }` in
`app/(auth)/layout.tsx`. Shape:

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

`app/sitemap.ts` lists, once per locale:

- the indexable static pages: home, listings, and find-roommate;
- every published listing (`listPublishedListingsForSitemap`), with `lastModified` taken
  from the row's `updatedAt`.

Every URL is built through `routes.*`, and each entry carries the same `hreflang` set
(`localeTag`) as the page's own `alternates.languages`. The sitemap is regenerated at most
hourly (`revalidate = 3600`). If the listing query fails, it still serves the static
pages instead of returning an error.

When adding an indexable route, add it to `STATIC_PAGES`, or add a repository query for
routes with ids. One sitemap file holds at most 50,000 URLs, so listings are capped
(newest first) to fit. Past that, split the file with `generateSitemaps` and point
`robots.ts` at the index. Public profiles are indexable but not listed yet. `/privacy` and
`/terms` are `noindex` while they hold draft text; add them to `STATIC_PAGES` when the
reviewed text is published.

## Known gap: icons and OG image are missing

`app/layout.tsx` points at `/favicon.ico`, `/favicon-16x16.png`, `/apple-touch-icon.png`
and `/og-image.png`, and listing pages and `lib/jsonld.tsx` fall back to `/og-image.png`;
`OrganizationJsonLd` also references `/logo.png`. None of these files exist in `public/`
yet, so they all return 404 and share previews have no image. Add real assets (OG image
1200×630) before launch; this is a violation of team rule 7, not a pattern to copy.

## Example: JSON-LD structured data

Render structured data through `JsonLd` (or the typed wrappers such as `ListingJsonLd`) in
`lib/jsonld.tsx`, never with `JSON.stringify` in a hand-written `<script>`. Its
`serializeJsonLd()` escapes `<` as `\u003c`: listing titles and bios are user text, and a
raw `</script>` in one would close the tag and run as HTML. JSON parsers read `\u003c` as
the same character, so the data is unchanged.

```tsx
import { JsonLd } from '@/lib/jsonld';

<JsonLd
  data={{
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Stay.bg',
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  }}
/>;
```

## Recommended tools

- Google Search Console: https://search.google.com/search-console/about
- Rich Results Test: https://search.google.com/test/rich-results
- Lighthouse SEO audits: https://developer.chrome.com/docs/lighthouse/seo/
- Next.js Metadata API: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
