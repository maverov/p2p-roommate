# Project Structure Guide

## Overview
This is a production-grade Next.js 14 App Router structure optimized for performance, scalability, and team collaboration.

---

## Folder Structure

### `app/`
**Purpose:** Next.js App Router - URL routing ONLY. Zero business logic.

- `(auth)/` - Route group for authentication pages (/login, /signup)
- `(marketing)/` - Route group for marketing pages (/about, /pricing)
- `(platform)/` - Route group for app pages (/listings, /messages, /profile)
- `layout.tsx` - Root layout (wraps all pages)
- `page.tsx` - Home page

**Rule:** App files should be empty shells that import from `features/` or `components/`. No form logic, no hooks, no state management here.

---

### `features/`
**Purpose:** Domain-driven feature modules. Each feature is self-contained and independently deployable.

Structure of each feature:
```
features/[feature]/
  ├── api/              # TanStack Query hooks + mutations (useListings, useCreateListing, etc.)
  ├── components/       # Feature-scoped components (only used in this feature)
  ├── hooks/            # Feature-scoped custom hooks (only used in this feature)
  ├── store/            # Zustand stores for feature UI state
  ├── schemas/          # Zod validation schemas
  ├── types/            # Feature-scoped TypeScript types
  └── index.ts          # Barrel export (PUBLIC API of this feature)
```

**Example: `features/auth/`**
- `api/index.ts` → `useLogin()`, `useSignup()`, `useUser()`
- `schemas/index.ts` → Zod schemas for login/signup forms
- `types/index.ts` → `User`, `AuthSession` types
- `store/index.ts` → `useAuthStore` (UI state: login modal open/closed)
- `index.ts` → Publicly exports what other features can use

**Cross-feature imports (the right way):**
```ts
// ✅ GOOD - import through barrel export
import { useUser, User } from '@/features/auth';

// ❌ BAD - importing from private implementation
import { useUser } from '@/features/auth/api';
```

---

### `components/`
**Purpose:** Shared UI components across the entire app.

- `ui/` - shadcn/ui primitives (Button, Input, Modal, etc.). Copy-pasted from shadcn, never modified directly.
- `shared/` - App-wide composed components built from `ui/` primitives.
  - Examples: `Navbar.tsx`, `Footer.tsx`, `Sidebar.tsx`, `ConfirmDialog.tsx`

**Rule:** If a component is used by 2+ features, it goes in `shared/`. If it's used by only 1 feature, it goes in `features/[feature]/components/`.

---

### `hooks/`
**Purpose:** App-wide stateless hooks that don't belong to any feature.

Examples:
- `useDebounce` - Debounce hook for search inputs
- `useMediaQuery` - Responsive design hook
- `useLocalStorage` - Persist data to localStorage
- `useClickOutside` - Handle clicks outside elements

Export all hooks from `hooks/index.ts` for easy importing:
```ts
import { useDebounce, useMediaQuery } from '@/hooks';
```

---

### `stores/`
**Purpose:** Global Zustand stores for app-wide state.

**What goes here:**
- Theme store (light/dark mode)
- Sidebar visibility
- User session state
- Global modals (confirm, alert)

**What does NOT go here:**
- API data (use TanStack Query in `features/[feature]/api/`)
- Feature UI state (use `features/[feature]/store/`)

Example:
```ts
// stores/theme.ts
export const useThemeStore = create((set) => ({
  theme: 'light',
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
}));

// stores/sidebar.ts
export const useSidebarStore = create((set) => ({
  isOpen: true,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));
```

---

### `lib/`
**Purpose:** Third-party tool configurations and wrappers.

- `queryClient.ts` - TanStack Query client setup (cache, retry logic, staleTime)
- `api.ts` - API client wrapper (fetch/axios instance)
- `env.ts` - Validate environment variables with Zod

These are **invisible to the app** but required by everything.

---

### `utils/`
**Purpose:** Pure utility functions with no side effects.

Examples:
- `cn()` - Combine Tailwind class names
- `formatCurrency()` - Format numbers as currency
- `formatDate()` - Format dates
- `truncateText()` - Truncate strings
- `debounce()` - Debounce function

All utilities are pure functions—no state, no hooks, no side effects.

---

### `types/`
**Purpose:** App-wide TypeScript types not generated from OpenAPI.

Examples:
- `API.ts` - API response types
- `common.ts` - Common types like `Pagination`, `Sort`, `Filter`
- `errors.ts` - Custom error types

Feature-specific types go in `features/[feature]/types/`.

---

### `styles/`
**Purpose:** Global CSS and Tailwind overrides.

- `globals.css` - Global styles, font imports
- `tailwind-base.css` - Tailwind @layer base customizations

---

### `config/`
**Purpose:** Constants, environment validation, feature flags.

- `constants.ts` - App-wide constants (URLs, API endpoints, timeouts)
- `env.ts` - Environment validation with Zod
- `features.ts` - Feature flags

---

## Import Patterns

### ✅ CORRECT

```ts
// From app/ (routing layer)
import LoginForm from '@/features/auth/components/LoginForm';
import { useUser } from '@/features/auth';

// From features/listings/ (components)
import { useListings } from '@/features/listings';
import { cn } from '@/utils';
import { useDebounce } from '@/hooks';

// From lib/ (setup)
import { api } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
```

### ❌ INCORRECT

```ts
// Don't import from private feature implementation
import { useListings } from '@/features/listings/api';

// Don't put business logic in app/
// app/listings/page.tsx should NOT contain useState, useQuery, etc.

// Don't import across features without going through barrel exports
import ListingCard from '@/features/listings/components/ListingCard';

// Don't create circular dependencies
// features/auth should not import from features/listings API
```

---

## Adding a New Feature

1. Create folder: `features/new-feature/`
2. Create subfolders: `api/`, `components/`, `hooks/`, `store/`, `schemas/`, `types/`
3. Create `index.ts` as barrel export
4. Export public API through `index.ts`

Example:
```
features/listings/
├── api/index.ts          → export { useListings, useCreateListing }
├── components/           → ListingCard.tsx, ListingForm.tsx
├── store/index.ts        → export { useListingFiltersStore }
├── schemas/index.ts      → export { listingSchema }
├── types/index.ts        → export { Listing, ListingForm }
└── index.ts              → export everything public
```

---

## Data Flow

### TanStack Query + Features (Server Data)
```
app/(platform)/listings/page.tsx
  ↓
<ListingGrid />
  ↓
import { useListings } from '@/features/listings'
  ↓
features/listings/api/index.ts
  ↓
TanStack Query mutation → api.get('/listings')
  ↓
lib/api.ts (API client)
```

### Zustand + Stores (App State)
```
components/shared/Navbar.tsx
  ↓
import { useThemeStore } from '@/stores'
  ↓
stores/theme.ts (Zustand)
```

### Feature UI State
```
features/auth/components/LoginForm.tsx
  ↓
import { useAuthStore } from '@/features/auth'
  ↓
features/auth/store/index.ts (Feature-scoped Zustand)
```

---

## Performance Tips

1. **Server vs Client:** Keep heavy logic in server components, use `'use client'` only where needed
2. **Code splitting:** Each feature loads independently. Unused features don't increase bundle size
3. **TanStack Query:** Handles caching, deduplication, background fetching
4. **Zustand:** Lightweight, fast re-renders only affected components

---

## Team Workflow

- **Two developers?** Each owns a feature. Makes parallel development clean.
- **Adding a feature?** New folder, no file shuffling. Minimal merge conflicts.
- **Refactoring?** Barrel exports mean you can reorganize internals without breaking imports.

Good luck! 🚀
