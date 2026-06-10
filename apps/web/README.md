# P2P Roommate - Web Frontend

Performance-first Next.js 14 frontend for the P2P rental platform.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS v4 + CSS Modules
- **Components:** shadcn/ui (Radix UI primitives)
- **State Management:**
  - **Server State:** TanStack Query v5
  - **Client State:** Zustand
- **Forms:** React Hook Form + Zod validation
- **Language:** TypeScript 5

## Quick Start Setup Guide

### Prerequisites

Before starting, make sure you have:
- **Node.js 18+** — [Download here](https://nodejs.org)
- **npm** (comes with Node.js)
- **Git** (optional, for version control)

Verify installation:
```powershell
node --version
npm --version
```

---

### Step 1: Navigate to Project

```powershell
cd C:\Users\PC\Desktop\p2p-roommate\apps\web
```

---

### Step 2: Install Dependencies

```powershell
npm install
```

This installs all required packages (~500MB, takes 2-5 minutes).

**If you get an error about React versions**, don't worry — the package.json is already fixed. Just run:
```powershell
npm install --legacy-peer-deps
```

---

### Step 3: Set Up Environment Variables

Create `.env.local` file:

```powershell
copy .env.example .env.local
```

Edit `.env.local` and add your API endpoint:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

(We'll assume your backend runs on port 3001. Adjust as needed.)

---

### Step 4: Start the Development Server

```powershell
npm run dev
```

You'll see:
```
> @p2p-roommate/web@0.1.0 dev
> next dev

  ▲ Next.js 14.2.35
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 2.5s
```

---

### Step 5: Open in Browser

Click or visit:
```
http://localhost:3000
```

You should see a blank page with "P2P Roommate Platform" text.

**Congratulations! Your app is running.** ✅

---

## Project Structure

```
apps/web/
├── app/                      # Pages & routing (Next.js App Router)
│   ├── (auth)/              # Route group: /login, /signup
│   ├── (marketing)/         # Route group: /about, /pricing
│   ├── (platform)/          # Route group: /listings, /messages
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page (/)
│
├── features/                 # Domain-driven features
│   └── auth/                # Example: auth feature
│       ├── api/             # TanStack Query hooks
│       ├── components/      # Auth-specific components
│       ├── hooks/           # Auth-specific hooks
│       ├── store/           # Auth-specific Zustand store
│       ├── schemas/         # Zod validation schemas
│       ├── types/           # TypeScript types
│       └── index.ts         # Public API (barrel export)
│
├── components/              # Shared components
│   ├── ui/                  # shadcn/ui primitives (Button, Input, etc.)
│   └── shared/              # App-wide components (Navbar, Footer, etc.)
│
├── hooks/                   # App-wide hooks (useDebounce, useMediaQuery)
├── stores/                  # Global Zustand stores (theme, auth session)
├── lib/                     # Third-party wrappers
│   ├── api.ts              # API client
│   └── queryClient.ts      # TanStack Query setup
├── utils/                   # Pure utility functions
├── types/                   # App-wide TypeScript types
├── config/                  # Constants, env validation, feature flags
├── styles/                  # Global CSS
│   └── globals.css         # Imports Tailwind + global styles
│
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── next.config.js           # Next.js config
├── tailwind.config.ts       # Tailwind config
├── postcss.config.js        # PostCSS config
└── .env.example             # Environment variables template
```

---

## Creating Your First Component

### Example: Create a Listing Card Component

**Step 1:** Create file:
```
apps/web/components/shared/ListingCard.tsx
```

**Step 2:** Add content:
```typescript
interface ListingCardProps {
  title: string;
  price: number;
  location: string;
}

export function ListingCard({ title, price, location }: ListingCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-gray-600 text-sm">{location}</p>
      <p className="text-xl font-bold text-blue-600 mt-2">${price}/month</p>
    </div>
  );
}
```

**Step 3:** Test it on a page (create next).

---

## Creating Your First Page

### Example: Create a Listings Page Using Your Component

**Step 1:** Create folder and file:
```
apps/web/app/(platform)/listings/page.tsx
```

**Step 2:** Add content:
```typescript
import { ListingCard } from '@/components/shared/ListingCard';

export default function ListingsPage() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">Available Listings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        <ListingCard 
          title="Cozy Apartment" 
          price={1200} 
          location="Downtown" 
        />
        <ListingCard 
          title="Modern Studio" 
          price={950} 
          location="Midtown" 
        />
        <ListingCard 
          title="Spacious Loft" 
          price={1500} 
          location="Waterfront" 
        />
      </div>
    </main>
  );
}
```

**Step 3:** Visit in browser:
```
http://localhost:3000/listings
```

You should see three listing cards with Tailwind styling applied.

---

## Available Scripts

```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint to check code quality
npm run type-check   # Check TypeScript types
```

---

## Styling with Tailwind

Tailwind is already configured. Use utility classes in JSX:

```typescript
// Example: Creating a styled button
export function MyButton() {
  return (
    <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
      Click me
    </button>
  );
}
```

### For Complex Styles (CSS Modules)

Create `Component.module.css`:
```css
.container {
  display: flex;
  gap: 1rem;
}

.title {
  font-size: 2rem;
  font-weight: bold;
}
```

Use in component:
```typescript
import styles from './Component.module.css';

export function Component() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Title</h1>
    </div>
  );
}
```

---

## Adding shadcn/ui Components

shadcn/ui provides pre-built, accessible components.

### Install shadcn/ui

```powershell
npm install -D shadcn-ui@latest
npx shadcn-ui@latest init
```

When prompted:
- Style: Default
- Base color: Slate
- CSS variables: Yes

### Add Components

```powershell
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add dialog
```

Components are copied into `components/ui/`. You own the code.

### Use in Your App

```typescript
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function LoginForm() {
  return (
    <div>
      <Input placeholder="Email" />
      <Button>Sign In</Button>
    </div>
  );
}
```

---

## Working with Features

Each feature is self-contained. Example: `auth` feature.

### Feature Structure
```
features/auth/
├── api/index.ts          # useLogin(), useSignup(), useUser()
├── components/           # LoginForm.tsx, SignupForm.tsx
├── hooks/               # useAuthSession() (auth-only hooks)
├── store/               # useAuthStore (auth UI state)
├── schemas/             # loginSchema, signupSchema (Zod)
├── types/               # User, AuthSession
└── index.ts             # Public API (export only what's needed)
```

### Creating a New Feature

```powershell
# 1. Create folders
mkdir features/listings/api
mkdir features/listings/components
mkdir features/listings/hooks
mkdir features/listings/store
mkdir features/listings/schemas
mkdir features/listings/types

# 2. Create files...
```

### Importing from Features

```typescript
// ✅ Correct (through public API)
import { useListings, Listing } from '@/features/listings';

// ❌ Wrong (importing private implementation)
import { useListings } from '@/features/listings/api';
```

---

## API Integration

### Making API Calls

The API client is pre-configured in `lib/api.ts`:

```typescript
import { api } from '@/lib/api';

// GET request
const listings = await api.get('/listings');

// POST request
const newListing = await api.post('/listings', {
  title: 'Cozy Apartment',
  price: 1200,
});
```

### Using TanStack Query (for server state)

In `features/listings/api/index.ts`:

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const useListings = () =>
  useQuery({
    queryKey: ['listings'],
    queryFn: () => api.get('/listings'),
  });

export const useCreateListing = () =>
  useMutation({
    mutationFn: (data) => api.post('/listings', data),
  });
```

Use in components:

```typescript
import { useListings } from '@/features/listings';

export function ListingsPage() {
  const { data, isLoading } = useListings();
  
  if (isLoading) return <p>Loading...</p>;
  
  return (
    <div>
      {data?.map(listing => (
        <ListingCard key={listing.id} {...listing} />
      ))}
    </div>
  );
}
```

---

## Forms with React Hook Form + Zod

### Define Schema

In `features/auth/schemas/index.ts`:

```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be 6+ characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;
```

### Create Form Component

In `features/auth/components/LoginForm.tsx`:

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '../schemas';
import { useLogin } from '../api';

export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useLogin();

  const onSubmit = (data: LoginInput) => {
    loginMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <input
          {...register('email')}
          placeholder="Email"
          className="w-full border px-3 py-2 rounded"
        />
        {errors.email && <p className="text-red-600 text-sm">{errors.email.message}</p>}
      </div>

      <div>
        <input
          {...register('password')}
          type="password"
          placeholder="Password"
          className="w-full border px-3 py-2 rounded"
        />
        {errors.password && <p className="text-red-600 text-sm">{errors.password.message}</p>}
      </div>

      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">
        Sign In
      </button>
    </form>
  );
}
```

---

## Troubleshooting

### Issue: `npm run dev` fails with "next is not recognized"
**Solution:**
```powershell
npm install
npm run dev
```

### Issue: Port 3000 already in use
**Solution:**
```powershell
npm run dev -- -p 3001
```

Starts on port 3001 instead.

### Issue: TypeScript errors in IDE
**Solution:**
```powershell
npm run type-check
```

This shows all TypeScript errors.

### Issue: Tailwind classes not working
**Solution:**
1. Restart dev server: `npm run dev`
2. Make sure `styles/globals.css` is imported in `app/layout.tsx`

### Issue: React Hook Form not validating
**Solution:**
1. Install resolvers: `npm install @hookform/resolvers`
2. Import `zodResolver` correctly:
```typescript
import { zodResolver } from '@hookform/resolvers/zod';
```

---

## Performance Best Practices

1. **Use Server Components by default** — Faster initial load
2. **Use Client Components only when needed** (`'use client'`) — For interactivity
3. **TanStack Query caching** — Reduces API calls automatically
4. **Code splitting** — Each route loads only needed code
5. **Images** — Use Next.js `<Image>` component for optimization

---

## Deployment

### Build for Production
```powershell
npm run build
npm run start
```

### Environment Variables for Production
Create `.env.production.local` with your production API URL.

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [React Hook Form Documentation](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [shadcn/ui Components](https://ui.shadcn.com/)

---

## Team Guidelines

- **Two-person team:** Each developer owns 1-2 features
- **Never modify `app/` with business logic** — Routing only
- **Import features through barrel exports** (`index.ts`)
- **Keep API data in TanStack Query** — Never in Zustand
- **Keep UI state in Zustand** — Not in TanStack Query

---

## Getting Help

If something is broken:
1. Check the troubleshooting section above
2. Run `npm install` to ensure dependencies are installed
3. Run `npm run type-check` to see TypeScript errors
4. Check the browser console for error messages (F12)

---

**Ready to build?** Start by creating a page or component. Good luck! 🚀
