# Web Frontend Development Guide

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

## API + server state

```tsx
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const useListings = () =>
  useQuery({
    queryKey: ['listings'],
    queryFn: () => api.get('/listings'),
  });
```

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

## Styling

- Prefer Tailwind utility classes for most UI.
- Use CSS Modules only for complex component-specific styles.

## shadcn/ui

```powershell
npx shadcn-ui@latest add button
```

Generated components are placed in `components/ui/`.
