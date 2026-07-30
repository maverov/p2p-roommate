# Web Frontend Architecture

## Core stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Drizzle ORM
- PostgreSQL
- Better Auth
- TanStack Query (server state)
- Zustand (client/UI state)
- React Hook Form + Zod
- next-intl (locale-prefixed routes, namespaced ICU messages)

## Project layout

```text
/
├── app/            # Routing and layouts only
├── features/       # Domain feature modules
├── components/     # Shared components (ui/, shared/)
├── hooks/          # App-wide hooks
├── stores/         # Global Zustand stores
├── db/             # Drizzle client and schema
├── lib/            # Infrastructure (auth, API helpers, env, i18n, formatting)
├── i18n/           # next-intl request config
├── locales/        # Message catalogue: <locale>/<namespace>.json + index.ts
├── scripts/        # Repo tooling (i18n-check)
├── styles/         # Global styles
└── config/         # Constants and flags
```

## Architectural rules

1. Keep `app/` as routing/composition, not business logic.
2. Put feature logic under `features/<feature>/`.
3. Import feature APIs through each feature `index.ts` barrel.
4. Keep server data in TanStack Query, not Zustand.
5. Keep global UI/app state in `stores/`.
6. Keep database access in server-only modules.
7. Route handlers validate input with Zod before calling Drizzle.
8. Authenticated route handlers use Better Auth session helpers.
9. No user-facing string lives in a component. Copy comes from `locales/` through
   `t('…')`; `locale` decides formatting and routing, never wording. See
   [README.translations.md](README.translations.md).
10. Build URLs with the typed helpers in `lib/routes.ts`, not string literals.

## Backend layout

```text
app/api/                         # HTTP routes
features/<feature>/schemas/      # Zod schemas shared by route handlers
features/<feature>/server/       # Server-only repositories and business rules
lib/server/api.ts                # Shared auth, parsing, and error responses
db/schema.ts                     # Database tables and TypeScript types
```

Route handlers should be thin. They should parse input, check auth, call a repository, and return JSON. Business rules such as "only owners can update listings" belong in server repository functions.

Current backend resources:

- Listings and listing images
- Favorites and saved profiles
- Public user profiles
- Reviews for users and listings
- Saved searches
- Viewing requests
- Conversations and message polling
- Reports

## Related docs

- Detailed structure guide: [../STRUCTURE.md](../STRUCTURE.md)
- Development workflows: [README.development.md](README.development.md)
- Translations: [README.translations.md](README.translations.md)
- Backend API guide: [README.backend.md](README.backend.md)
