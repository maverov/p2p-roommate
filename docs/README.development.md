# Web App Development Guide

## Creating shared components

Add app-wide reusable UI under `components/shared/`. Labels come from the message
catalogue and money/dates from `lib/format.ts` — never a literal string or a raw number
with a currency glued on.

```tsx
import { getTranslations } from 'next-intl/server';

import { formatMoneyFromCents } from '@/lib/format';
import type { Locale } from '@/lib/i18n';

interface ListingCardProps {
  title: string;
  monthlyRentCents: number;
  currency: string;
  location: string;
  locale: Locale;
}

export async function ListingCard({
  title,
  monthlyRentCents,
  currency,
  location,
  locale,
}: ListingCardProps) {
  const t = await getTranslations({ locale, namespace: 'listings.common' });

  return (
    <div className="rounded-lg border border-brand-border p-4 shadow-sm transition hover:shadow-md">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-brand-muted">{location}</p>
      <p className="mt-2 text-xl font-bold text-brand-terracotta">
        {formatMoneyFromCents(monthlyRentCents, currency, locale)}
        <span className="text-sm font-medium text-brand-muted">/{t('perMonth')}</span>
      </p>
    </div>
  );
}
```

## Creating pages

Product routes live under `app/[locale]/` and compose from feature and shared components.
Resolve translators with an explicit `locale` so the page stays statically renderable, and
build links with `lib/routes.ts` rather than string literals.

```tsx
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { ListingCard } from '@/components/shared/ListingCard';
import { isLocale, type Locale } from '@/lib/i18n';

export default async function ListingsPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const locale: Locale = params.locale;
  const t = await getTranslations({ locale, namespace: 'listings.search' });

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">{t('heading')}</h1>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* … */}
      </div>
    </main>
  );
}
```

Every page also needs `generateMetadata` built from translation keys — see
[README.seo.md](README.seo.md).

## Working with features

Create self-contained modules in `features/<name>/`:

```text
features/listings/
├── api/
├── components/
├── hooks/
├── store/
├── schemas/
├── types/
└── index.ts
```

Use barrel imports:

```tsx
import { useListings } from '@/features/listings';
```

## Server Data

Prefer server components for initial reads. Use TanStack Query when client-side caching, refetching, or optimistic UI is needed.

```tsx
import { useQuery } from '@tanstack/react-query';

export const useListings = () => {
  return useQuery({
    queryKey: ['listings'],
    queryFn: async () => {
      const response = await fetch('/api/listings');

      if (!response.ok) {
        throw new Error('Failed to load listings');
      }

      return response.json();
    },
  });
};
```

## Backend route handlers

Backend endpoints live under `app/api/`. A route handler should stay small:

1. Parse query params or JSON with a Zod schema.
2. Require a signed-in user if the route changes private data.
3. Call a server repository under `features/<feature>/server/`.
4. Return a consistent JSON response.

```ts
import { apiOk, handleApiRoute, parseSearchParams } from '@/lib/server/api';
import { listListingsQuerySchema } from '@/features/listings/schemas';
import { listPublishedListings } from '@/features/listings/server/repository';

export async function GET(request: Request) {
  return handleApiRoute(async () => {
    const query = parseSearchParams(request, listListingsQuerySchema);
    const listings = await listPublishedListings(query);

    return apiOk(listings);
  });
}
```

Do not import `db`, `auth`, or `serverEnv` into client components. If browser code needs data, call an API route with `fetch`.

For the full beginner guide and endpoint examples, read [README.backend.md](README.backend.md).

## Forms with React Hook Form + Zod

```tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type LoginInput = z.infer<typeof loginSchema>;

export function LoginForm() {
  const t = useTranslations('common.nav');
  const { register, handleSubmit } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      <input {...register('email')} />
      <input {...register('password')} type="password" />
      <button type="submit">{t('signIn')}</button>
    </form>
  );
}
```

React Hook Form owns form state. Zod owns validation rules and inferred TypeScript types.
Client components read copy from `useTranslations` directly — do not pass translated
strings down as props.

## Styling

- Prefer Tailwind utility classes for most UI.
- Use CSS Modules only for complex component-specific styles.

## shadcn/ui

```powershell
pnpm dlx shadcn@latest add button
```

Generated components are placed in `components/ui/`.
