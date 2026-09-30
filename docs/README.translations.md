# Translations (i18n) Guide

The app runs on [next-intl](https://next-intl-docs.vercel.app/) with locale-prefixed
routes (`/bg/...`, `/en/...`) and namespaced ICU message files. **No user-facing string
belongs in a component**, and copy is never branched on the locale — `locale` decides
formatting and routing, the message catalogue decides wording.

## Current setup

| Concern | Location |
| --- | --- |
| Supported locales, `localeTag`, `openGraphLocale`, `APP_TIME_ZONE` | `lib/i18n.ts` |
| Locale routing middleware | `middleware.ts` |
| Message files | `locales/<locale>/<namespace>.json` |
| Catalogue + `Messages` type | `locales/index.ts` |
| Namespaces sent to the browser | `locales/client-namespaces.ts` |
| Request config (messages, time zone) | `i18n/request.ts`, wired by `next-intl/plugin` in `next.config.js` |
| Typed keys (`IntlMessages`) | `types/i18n.d.ts` |
| Client providers | `NextIntlClientProvider` in `app/[locale]/layout.tsx` and `app/(auth)/layout.tsx` |
| Locale of the locale-free auth pages | `getCookieLocale()` in `lib/server/locale.ts` |
| Email copy | `emailTranslator()` in `features/notifications/server/templates.ts` |
| Locale switcher UI | `LocaleLinks` in `components/shared/navbar/NavbarClient.tsx` |
| Integrity gate | `scripts/i18n-check.ts` → `pnpm i18n:check` |

Namespaces: `auth`, `common`, `emails`, `enums`, `home`, `legal`, `listings`, `messages`,
`metadata`, `profiles`, `reviews`, `saved`, `settings`. One file per namespace per locale.

`bg` is the default locale and the source of truth for the key space — product copy is
written there first.

**Exception: the admin panel.** `/admin` is an internal, English-only tool that sits
outside `[locale]`. Its UI copy is written inline, and it reads enum labels from the `en`
catalogue (`features/admin/server/labels.ts`). The rules below apply to every
user-facing route.

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
rendering. Pages that read the session, cookies, or `searchParams` render per request
anyway, but keep the explicit locale so a page (or a shared component) that can be static
stays static.

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

A provider sends only some namespaces to the browser:

- `app/[locale]/layout.tsx` sends `CLIENT_NAMESPACES` (`locales/client-namespaces.ts`)
  through `getClientMessages(locale)`: `common`, `enums`, `home`, `listings`, `messages`,
  `profiles`, `reviews`, `settings`. Server-only copy (`emails`, `legal`, `metadata`,
  `saved`) never ships with a page.
- `app/(auth)/layout.tsx` sends `auth` alone.

A client component that reads any other namespace crashes at runtime, and
`pnpm i18n:check` fails on it. When a client component needs a server-only namespace,
add that namespace to `CLIENT_NAMESPACES`, or resolve the copy in a server parent.

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
`lib/format.ts` and `lib/i18n.ts` and are driven off `localeTag` / `openGraphLocale`.
Every date is formatted in `APP_TIME_ZONE` (`Europe/Sofia`), whether it renders on the
server, in the browser, or in an email:

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

The root `app/layout.tsx` is the exception: it sits outside `[locale]` and also
serves the auth pages and `/admin`, so it keeps static brand defaults. Localising it would
force dynamic rendering.

## Auth pages and emails

`/login`, `/signup`, `/forgot-password`, `/reset-password` and `/verify-email` have no
locale segment. They read the `NEXT_LOCALE` cookie that the next-intl middleware sets on
the visitor's last `/<locale>/...` page (`getCookieLocale()`), falling back to `bg`, and
take their copy from the `auth` namespace.

Emails go out in the recipient's `user.locale`: sign-up stores the page's locale, and
`/settings` lets the user change it. Email code runs outside a request, so it translates
with `emailTranslator(locale)`, which is bound to the `emails` namespace:

```ts
const locale = emailLocale(recipient.locale); // stored value, validated, `bg` fallback
const t = emailTranslator(locale);

t('newMessage.subject', { sender: senderName });
```

## Add a translation key

1. Add it to `locales/bg/<namespace>.json`.
2. Add the same path to every other locale. The compiler will tell you if you forget.
3. Use it with `t('…')`. Run `pnpm i18n:check`.

## Add a namespace

1. Create `locales/<locale>/<namespace>.json` for every locale.
2. Import it in `locales/index.ts` and add it to `bg` and to every locale in `catalogue`.
3. If a client component under `[locale]` reads it, add it to `CLIENT_NAMESPACES` in
   `locales/client-namespaces.ts`.

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
  throws at render time, so it must not reach a merge;
- a `'use client'` file that calls `useTranslations` on a namespace its provider does not
  send: anything outside `CLIENT_NAMESPACES`, or anything but `auth` in
  `features/auth/` and `app/(auth)/`.

It **warns** on unused keys. That check is a regex scan over call sites, so a key
reached through a lookup table can look unused; failing the build on it would make the
gate untrustworthy. Read the warnings, don't ignore them. The scan knows
`emailTranslator(...)` returns an `emails` translator, so email keys count as used.

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
4. Client components read from the provider, and only from namespaces it sends; server
   components resolve their own translator with an explicit locale.
5. Interpolate with named ICU arguments. Never concatenate sentence fragments — word
   order differs between languages.
6. Keep formatting in `lib/format.ts`, wording in `locales/`.
