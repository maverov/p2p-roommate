# Web App Development Guide

Use this guide when you are building a new feature for the first time.
It is written as simple steps.

## Creating shared components

Put reusable app-wide components in `components/shared/`.

Simple rules:

- Do not hardcode text users will read.
- Use translations for text.
- Use helpers for money and dates.

```tsx
import { getTranslations } from 'next-intl/server';

import { formatMoneyFromCents } from '@/lib/format';
import type { Locale } from '@/lib/i18n';

type PriceProps = {
  amountCents: number;
  currency: string;
  locale: Locale;
};

export async function Price({ amountCents, currency, locale }: PriceProps) {
  const t = await getTranslations({ locale, namespace: 'listings.common' });

  return (
    <p>
      {formatMoneyFromCents(amountCents, currency, locale)} / {t('perMonth')}
    </p>
  );
}
```

## Creating a new feature

Create a folder in `features/`:

```text
features/your-feature/
├── components/
├── schemas/
├── server/
└── hooks/      (optional)
```

What each folder is for:

- `components/`: UI for this feature
- `schemas/`: request and input validation
- `server/`: database and server logic
- `hooks/`: optional client hooks

Create only the folders the feature needs, and import its modules by path. Only `auth`
has an `index.ts` barrel (see [README.architecture.md](README.architecture.md#feature-modules)).

Step-by-step:

1. Add schema files in `schemas/`.
2. Add server logic in `server/`.
3. If browser code needs this data, add an API route in `app/api/...`.
4. Add UI in `components/` and/or a page in `app/[locale]/...`.
5. Add translation keys in both `bg` and `en`.

## Making backend/API calls

Backend routes live in `app/api/`.

Use this simple pattern:

1. Read and validate input.
2. Check auth if needed.
3. For writes, call `enforceRateLimit(bucket, user.id)` right after the auth check.
4. Call feature server logic.
5. Send emails or other side effects with `runInBackground(...)`, after the write.
6. Return JSON.

```ts
import { apiOk, handleApiRoute, parseSearchParams } from '@/lib/server/api';
import { listListingsQuerySchema } from '@/features/listings/schemas';
import { listPublishedListings } from '@/features/listings/server/repository';

export async function GET(request: Request) {
  return handleApiRoute(async () => {
    const query = parseSearchParams(request, listListingsQuerySchema);
    const data = await listPublishedListings(query);
    return apiOk(data);
  });
}
```

A write route, from `app/api/viewing-requests/[id]/route.ts`:

```ts
export async function PATCH(request: Request, { params }: ViewingRequestRouteContext) {
  return handleApiRoute(async () => {
    const user = await requireCurrentUser(request);
    await enforceRateLimit('updateViewingRequest', user.id);
    const input = await parseJsonBody(request, updateViewingRequestInputSchema);
    const viewingRequest = await updateViewingRequest(params.id, user.id, input);

    runInBackground(
      notifyViewingRequestStatus(viewingRequest.id, input.status),
      'notify viewing request status',
    );

    return apiOk(viewingRequest);
  });
}
```

For full endpoint docs, see [README.backend.md](README.backend.md).

## Sending an email

1. Add the copy to `locales/<locale>/emails.json` for every locale.
2. Add a function to `features/notifications/server/notify.ts`: load the recipient's
   `locale`, get `emailTranslator(emailLocale(recipient.locale))`, and pass the parts to
   `renderEmail`, which builds the HTML and text versions and escapes every value.
3. Call it from the route through `runInBackground`, so a slow or failing provider never
   blocks the response.

Locally, without `RESEND_API_KEY`, the email is printed to the dev server console.

## Photos and images

- Upload photos with `PhotoUploadButton` (or `uploadImage()` from
  `features/uploads/upload-image.ts`), passing the `listings` or `avatars` purpose. It
  checks type and size in the browser, then uploads straight to Vercel Blob.
- Any schema that accepts a user-supplied image URL must refine it with
  `isAllowedImageUrl` (`lib/images.ts`), which accepts uploads (and the seed image host
  outside production) only.
- `next/image` and the CSP accept only the hosts in `lib/image-hosts.json`. An image the
  site itself references from another host goes under `site` there; never widen what
  `isAllowedImageUrl` accepts for that.

## Getting data on pages (recommended first choice)

For first page load, prefer loading data in server components.
This is usually simpler and faster than calling `/api` from the browser for initial data.

## Making network requests from components

For client-side requests, use [api-client.ts](../lib/api-client.ts) with React Query.

```tsx
'use client';

import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

const save = useMutation({
  mutationFn: () => apiClient.post(`/api/listings/${listingId}/favorite`),
});
```

Rules:

- Use `/api/...` routes (relative paths).
- Handle loading and error states in UI.
- Do not hide errors silently.

## Creating pages (useful pattern)

Pages usually live in `app/[locale]/...`.

For page files:

1. Validate locale.
2. Load translations using that locale.
3. Add `generateMetadata` for indexable pages.

```tsx
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { isLocale, type Locale } from '@/lib/i18n';

export default async function ListingsPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const locale: Locale = params.locale;
  const t = await getTranslations({ locale, namespace: 'listings.search' });

  return <h1>{t('heading')}</h1>;
}
```

## Coding guidelines

Keep these in mind:

- Keep route files in `app/` focused on page structure and metadata.
- Keep database/server code in `features/*/server` and `db/*`.
- Do not import server-only files into client components.
- Build links with `lib/routes.ts`.
- Keep user-facing text in translation files.

Related docs:

- [README.architecture.md](README.architecture.md)
- [README.translations.md](README.translations.md)
- [README.accessibility.md](README.accessibility.md)
- [README.seo.md](README.seo.md)
- [README.data-flow.md](README.data-flow.md)

## Forms (React Hook Form + Zod)

Use this for forms with validation. The auth schemas are built from the active
translator, so validation messages come from the catalogue, and their length rules come
from `lib/auth-rules.ts`, the same constants Better Auth enforces on the server.

From `features/auth/components/LoginForm.tsx`:

```tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { createLoginSchema, type LoginInput } from '@/features/auth/schemas';

const t = useTranslations('auth');
const schema = useMemo(() => createLoginSchema(t), [t]);
const form = useForm<LoginInput>({
  defaultValues: { email: '', password: '' },
  resolver: zodResolver(schema),
});
```

## Server data preference

Default choice:

1. Use server components for first page load data.
2. Use TanStack Query for interactive client-side state (refresh, mutations, optimistic UI).

## Styling notes

- Prefer Tailwind utility classes first.
- Use CSS Modules only when a component needs more complex styling.

## Real examples from this codebase (technology by technology)

This section shows **real snippets from this repository** and explains:

- what each snippet is doing;
- where it runs (server or browser);
- when you should copy the same pattern.

### Next.js 14

**Why this matters:** this is how pages define SEO metadata in App Router.
**Runs on:** server.
**Use this pattern when:** you add a new page that should have title/description/canonical/OG tags.

From `app/[locale]/page.tsx`:

```tsx
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'metadata.home' });

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
```

### React 18

**Why this matters:** this shows regular React state (`useState`) combined with an async action.
**Runs on:** browser (`'use client'` component).
**Use this pattern when:** a button changes UI state and then syncs with backend.

From `features/listings/components/SaveListingButton.tsx`:

```tsx
const [saved, setSaved] = useState(initialSaved);

const toggle = useMutation({
  mutationFn: (next: boolean) =>
    next
      ? apiClient.post(`/api/listings/${listingId}/favorite`)
      : apiClient.delete(`/api/listings/${listingId}/favorite`),
  onMutate: (next) => {
    setSaved(next);
    return { previous: !next };
  },
  onError: (_error, _next, context) => {
    setSaved(context?.previous ?? initialSaved);
  },
});
```

### TypeScript

**Why this matters:** shared data shapes make component props predictable and safer.
**Runs on:** compile-time type checking (server + browser code).
**Use this pattern when:** multiple components depend on the same object shape.

From `features/listings/components/ListingCard.tsx`:

```ts
export type ListingCardData = {
  id: string;
  title: string;
  citySlug: string;
  neighborhoodSlug: string | null;
  monthlyRentCents: number;
  currency: string;
  propertyType: 'APARTMENT' | 'HOUSE' | 'STUDIO' | 'ROOM';
  bedroomCount: number;
  sizeSqm: number | null;
  maxOccupants: number;
  isVerified: boolean;
  publishedAt: Date | null;
  images: Array<{ id: string; url: string; alt: string }>;
};
```

### PostgreSQL

**Why this matters:** this is the database connection used by the app.
**Runs on:** server.
**Use this pattern when:** you need DB access through the shared `db` client (not directly in client components).

From `db/index.ts`:

```ts
const client =
  globalForDb.postgresClient ??
  postgres(serverEnv.DATABASE_URL, {
    max: serverEnv.DATABASE_POOL_MAX,
    prepare: false,
  });
```

### Drizzle ORM

**Why this matters:** this demonstrates typed query building (select + join + filter + pagination).
**Runs on:** server.
**Use this pattern when:** reading/writing data in `features/*/server` repository files.

From `features/listings/server/repository.ts`:

```ts
const [rows, totalRows] = await Promise.all([
  db
    .select({
      listing: listings,
      owner: {
        id: user.id,
        name: user.name,
        image: user.image,
      },
    })
    .from(listings)
    .innerJoin(user, eq(listings.ownerId, user.id))
    .where(where)
    .orderBy(...buildListingOrderBy(filters.sort))
    .limit(filters.perPage)
    .offset(offset),
  db.select({ value: count() }).from(listings).where(where),
]);
```

### Better Auth

**Why this matters:** auth is configured once and then exposed as Next.js route handlers.
**Runs on:** server.
**Use this pattern when:** adding/changing auth configuration or wiring auth routes.

From `lib/auth.ts` (abridged):

```ts
export const auth = betterAuth({
  appName: 'Stay.bg',
  baseURL: serverEnv.BETTER_AUTH_URL,
  secret: serverEnv.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: PASSWORD_MIN_LENGTH,
    maxPasswordLength: PASSWORD_MAX_LENGTH,
    // No session until the address is confirmed, so nobody can sign up as someone else.
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: ({ user, url }) => sendPasswordResetEmail(user, url),
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: 24 * 60 * 60,
    sendVerificationEmail: ({ user, url }) => sendVerificationEmail(user, url),
  },
  user: {
    additionalFields: {
      locale: { type: 'string', required: false, defaultValue: defaultLocale, input: true },
    },
    deleteUser: { enabled: true /* beforeDelete / afterDelete remove Blob uploads */ },
  },
  // In memory (the default) every serverless instance would count separately.
  rateLimit: { storage: 'database', window: 60, max: 100 },
  advanced: {
    backgroundTasks: { handler: (promise) => waitUntil(promise) },
  },
  // `nextCookies` must stay last so it can set cookies for every other plugin's responses.
  plugins: [admin(), nextCookies()],
});
```

From `app/api/auth/[...all]/route.ts`:

```ts
export const { GET, POST } = toNextJsHandler(auth);
```

### Zod

**Why this matters:** inputs are validated before data is accepted.
**Runs on:** server (API validation) and sometimes browser (form validation).
**Use this pattern when:** defining request body/query parameter schemas.

From `features/listings/schemas/index.ts`:

```ts
export const listingImageInputSchema = z.object({
  url: z
    .string()
    .url()
    .max(2048)
    .refine(isAllowedImageUrl, 'Upload the photo; external image URLs are not accepted.'),
  alt: z.string().trim().min(1).max(160),
  sortOrder: z.number().int().min(0).max(50).optional(),
});
```

### TanStack Query

**Why this matters:** React Query manages async server state in client components.
**Runs on:** browser.
**Use this pattern when:** you need request status, cache, retries, or optimistic updates.

From `app/providers.tsx`:

```tsx
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

From `features/listings/components/SaveListingButton.tsx`:

```tsx
const toggle = useMutation({
  mutationFn: (next: boolean) =>
    next
      ? apiClient.post(`/api/listings/${listingId}/favorite`)
      : apiClient.delete(`/api/listings/${listingId}/favorite`),
});
```

## Unit tests (Vitest)

Tests sit next to the module they cover (`lib/images.test.ts`,
`features/listings/schemas/index.test.ts`) and run with `pnpm test`. They run in Node
(`vitest.config.mts`), with `@/` resolved and `server-only` replaced by an empty stub
(`test/server-only.ts`), so server modules can be imported directly. There is no test
database: mock `@/db` and test the pure parts, as `lib/server/rate-limit.test.ts` does.

```ts
import { describe, expect, it } from 'vitest';

import { isAllowedImageUrl } from './images';

describe('isAllowedImageUrl', () => {
  it('rejects hosts outside the allowlist', () => {
    expect(isAllowedImageUrl('https://example.com/photo.jpg')).toBe(false);
  });
});
```

## Quick checklist before PR

1. Feature files are in the right place.
2. API input is validated, and new write routes are rate-limited.
3. `bg` and `en` translation keys were added/updated.
4. Loading, empty, and error UI states exist.
5. Run these commands (CI runs all of them, plus the migration checks):
   - `pnpm type-check`
   - `pnpm lint`
   - `pnpm i18n:check`
   - `pnpm test`
   - `pnpm build` (for bigger changes)

## Beginner quick start (copy this flow)

When you add a feature, use this order:

1. Create `features/<feature-name>/`.
2. Add `schemas/` validation.
3. Add `server/` logic.
4. Add or update `app/api/...` route.
5. Build UI in `components/` and page in `app/[locale]/...`.
6. Add translation keys in `locales/bg` and `locales/en`.
7. Run checks (`type-check`, `lint`, `i18n:check`, `test`, `build`).

## Best way to start learning this project

If you are new to the project, use this order:

1. Read [README.md](../README.md) for the big picture, then get the app running with [README.setup.md](README.setup.md).
2. Read [README.architecture.md](README.architecture.md) for the folder layout and rules, and this guide for how features are added.
3. Read [README.data-flow.md](README.data-flow.md) to see how data moves through the app.
4. Open [app/](../app) to understand routes and pages.
5. Open [features/](../features) to see how product logic is organized.
6. Open [components/](../components) to see shared and reusable UI.
7. Read one full feature from start to finish:
   - page in `app/[locale]/...`
   - feature UI in `features/<feature>/components`
   - API route in `app/api/...` if used
   - server logic in `features/<feature>/server`
   - schema in `features/<feature>/schemas`
8. Start with the listings feature, because it shows many common patterns already used in the app.

Good files to study first:

- [app/[locale]/page.tsx](../app/[locale]/page.tsx)
- [components/home/FeaturedListings.tsx](../components/home/FeaturedListings.tsx)
- [features/listings/server/repository.ts](../features/listings/server/repository.ts)
- [features/listings/schemas/index.ts](../features/listings/schemas/index.ts)
- [features/listings/components/SaveListingButton.tsx](../features/listings/components/SaveListingButton.tsx)

Tip: do not try to understand every folder at once. Follow one feature end-to-end first, then the rest of the project will make much more sense.
