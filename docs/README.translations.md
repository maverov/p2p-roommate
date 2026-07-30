# Translations (i18n) Guide

The app runs on [next-intl](https://next-intl-docs.vercel.app/) with locale-prefixed
routes (`/bg/...`, `/en/...`) and namespaced ICU message files. **No user-facing string
belongs in a component**, and copy is never branched on the locale — `locale` decides
formatting and routing, the message catalogue decides wording.

## Current setup

| Concern | Location |
| --- | --- |
| Supported locales, `localeTag`, `openGraphLocale` | `lib/i18n.ts` |
| Locale routing middleware | `middleware.ts` |
| Message files | `locales/<locale>/<namespace>.json` |
| Catalogue + `Messages` type | `locales/index.ts` |
| Request config (messages, time zone) | `i18n/request.ts`, wired by `next-intl/plugin` in `next.config.js` |
| Typed keys (`IntlMessages`) | `types/i18n.d.ts` |
| Client provider | `NextIntlClientProvider` in `app/[locale]/layout.tsx` |
| Locale switcher UI | `components/shared/navbar/NavbarClient.tsx` |
| Integrity gate | `scripts/i18n-check.ts` → `pnpm i18n:check` |

Namespaces: `common`, `enums`, `home`, `listings`, `messages`, `metadata`, `profiles`,
`saved`. One file per namespace per locale.

`bg` is the default locale and the source of truth for the key space — product copy is
written there first.

## Keys are type-checked

`locales/index.ts` types every locale as `Record<Locale, Messages>` where `Messages` is
derived from `bg`, and `types/i18n.d.ts` feeds that into next-intl's `IntlMessages`.
Two consequences worth relying on:

- A key missing from `en`, or a typo in a `t('…')` call, is a **compile error** — not a
  runtime `MISSING_MESSAGE` in production.
- Template-literal keys keep that guarantee, because the interpolated union produces a
  union of literal keys:

  ```tsx
  // Renaming the DB enum member breaks the build here, not in the browser.
  tEnums(`propertyType.${listing.propertyType}`);
  ```

  Prefer this over deriving a key by string concatenation, which type-checks against
  nothing. Where a key cannot be derived from the value, use an explicit map:

  ```tsx
  const STATUS_LABEL_KEYS = {
    DRAFT: 'statusDraft',
    PUBLISHED: 'statusPublished',
  } as const;

  t(STATUS_LABEL_KEYS[status]);
  ```

## Server components

Pass the locale explicitly. Reading it from the request would opt the page out of static
rendering; every `[locale]` route is prerendered today and should stay that way.

```tsx
import { getTranslations } from 'next-intl/server';

export default async function SavedPage({ params }: { params: { locale: Locale } }) {
  const t = await getTranslations({ locale: params.locale, namespace: 'saved' });

  return <h1>{t('heading')}</h1>;
}
```

Resolve a translator per component rather than threading one through props —
next-intl memoises the request config, so a second `getTranslations` call is a map
lookup, not a reload. A sub-component that needs copy should be `async` and resolve its
own.

## Client components

Do **not** pass translated strings down as props. Client components read from the
provider directly:

```tsx
'use client';

import { useTranslations } from 'next-intl';

export function SaveListingButton() {
  const t = useTranslations('listings.common');

  return <button>{t('save')}</button>;
}
```

`app/[locale]/layout.tsx` currently sends the whole catalogue for the active locale to
the client (~20 KB). If it grows materially, narrow the `messages` prop to the
namespaces client components actually use.

## Interpolation and plurals

Messages are ICU. Use named arguments; never build a sentence by concatenation.

```json
{
  "resultCount": "{count, plural, one {# резултат} other {# резултата}}",
  "headingIn": "Обяви в {city}",
  "pageOf": "Страница {page} от {total}"
}
```

```tsx
t('resultCount', { count: results.total });
t('headingIn', { city });
t('pageOf', { page, total: totalPages });
```

Bulgarian uses the `one` / `other` CLDR categories. A locale that needs more (`few`,
`many`) adds them in its own file — the placeholder set has to match, the branch set does
not.

## Formatting stays in code

Dates, currency, numbers and OG locale tags are behaviour, not copy. They live in
`lib/format.ts` and `lib/i18n.ts` and are driven off `localeTag` / `openGraphLocale`:

```tsx
formatMoneyFromCents(listing.monthlyRentCents, listing.currency, locale);
formatDate(review.createdAt, locale);
new Intl.ListFormat(localeTag[locale], { style: 'long', type: 'conjunction' });
```

Where a formatted value needs wording around it, the code picks the *unit* and the
catalogue picks the words:

```tsx
const { unit, value } = responseTimeParts(minutes); // 'minutes' | 'hours' | 'days'
tCommon(`duration.${unit}`, { value });             // ICU plural per locale
```

`lib/areas` city and neighbourhood names are locale-aware **data**, not message keys.
They stay out of the catalogue so a TMS never owns the dataset.

## Metadata and SEO

`generateMetadata` reads from the `metadata` namespace and from the page's own
namespace. Titles, descriptions and OG locale all go through keys — see
[README.seo.md](README.seo.md) for the full example.

The root `app/layout.tsx` is the one exception: it sits outside `[locale]` and also
serves `/login` and `/signup`, so it keeps static brand defaults. Localising it would
force dynamic rendering.

## Add a translation key

1. Add it to `locales/bg/<namespace>.json`.
2. Add the same path to every other locale. The compiler will tell you if you forget.
3. Use it with `t('…')`. Run `pnpm i18n:check`.

## Add a locale

1. Add the code to `Locale` in `lib/i18n.ts`, plus its `localeTag` and
   `openGraphLocale` entries.
2. Create `locales/<new-locale>/` with one file per namespace.
3. Add it to `catalogue` in `locales/index.ts`. The compiler then lists every key the
   new locale is missing — work through that list until it type-checks.
4. `pnpm i18n:check && pnpm type-check`.

## Quality gate

`pnpm i18n:check` runs in CI (`.github/workflows/ci.yml`). It **fails** on:

- a key present in `bg` but missing, unknown, or empty in another locale;
- ICU placeholder drift between locales (`{total}` in one, `{pages}` in another) — this
  throws at render time, so it must not reach a merge.

It **warns** on unused keys. That check is a regex scan over call sites, so a key
reached through a lookup table can look unused; failing the build on it would make the
gate untrustworthy. Read the warnings, don't ignore them.

## Translation management (future)

The file layout is already what Phrase, Lokalise and Crowdin ingest:
`locales/<locale>/<namespace>.json`, flat ICU, one directory per language. When adopting
one, push `locales/bg/**` as the source and let the TMS write the other locale
directories. Keep `pnpm i18n:check` as the merge gate on TMS-authored PRs — it is what
catches a translator dropping `{count}`.

## Best practices

1. No user-facing string in a component, and no `locale === 'en' ? … : …` for copy.
2. Key paths mirror the UI: `<namespace>.<section>.<label>`. Keep them stable — renaming
   a key is a retranslation.
3. Add keys to every locale in the same PR.
4. Client components read from the provider; server components resolve their own
   translator with an explicit locale.
5. Interpolate with named ICU arguments. Never concatenate sentence fragments — word
   order differs between languages.
6. Keep formatting in `lib/format.ts`, wording in `locales/`.
