# Web App Development Guide

## Creating shared components

Add app-wide reusable UI under `components/shared/`.

```tsx
interface ListingCardProps {
  title: string;
  price: number;
  location: string;
}

export function ListingCard({ title, price, location }: ListingCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 shadow-sm transition hover:shadow-md">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-gray-600">{location}</p>
      <p className="mt-2 text-xl font-bold text-blue-600">${price}/month</p>
    </div>
  );
}
```

## Creating pages

Add route pages under `app/` route groups and compose from features/shared components.

```tsx
import { ListingCard } from '@/components/shared/ListingCard';

export default function ListingsPage() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">Available Listings</h1>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ListingCard title="Cozy Apartment" price={1200} location="Downtown" />
      </div>
    </main>
  );
}
```

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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type LoginInput = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { register, handleSubmit } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      <input {...register('email')} />
      <input {...register('password')} type="password" />
      <button type="submit">Sign in</button>
    </form>
  );
}
```

React Hook Form owns form state. Zod owns validation rules and inferred TypeScript types.

## Styling

- Prefer Tailwind utility classes for most UI.
- Use CSS Modules only for complex component-specific styles.

## shadcn/ui

```powershell
pnpm dlx shadcn@latest add button
```

Generated components are placed in `components/ui/`.
