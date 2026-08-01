# P2P Roommate Finder - Stay.bg

Stay.bg is a full-stack Next.js application for roommate and rental discovery in Bulgaria.

## Technology Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Drizzle ORM
- PostgreSQL
- Better Auth
- TanStack Query for client-side server state
- React Hook Form + Zod for forms and validation
- pnpm

## Project Structure

```text
p2p-roommate/
├── app/              # Routes, layouts, route handlers, server actions
├── components/       # Shared UI and shadcn/ui components
├── db/               # Drizzle client, schema, migrations
├── docs/             # Architecture notes and engineering docs
├── features/         # Domain feature modules
├── i18n/             # next-intl request config
├── lib/              # Auth, env, query client, area data, i18n, formatting
├── locales/          # Message catalogue: <locale>/<namespace>.json
├── public/           # Static assets
├── scripts/          # Repo tooling (i18n-check)
├── stores/           # Client-only UI state
├── styles/           # Global styles
└── package.json
```

## Architecture

The Next.js app owns the product surface, authentication, persistence, and server-side business logic. Server-only code stays behind App Router route handlers, server actions, and server components. Browser components do not import database, auth server, or environment modules directly.

PostgreSQL is the system of record. Drizzle owns schema definitions, typed queries, and migrations. Better Auth owns authentication and session lifecycle.

Backend functionality is exposed through App Router route handlers under `app/api/`. Read the beginner-friendly backend guide before adding or calling API routes:

- [Backend API guide](docs/README.backend.md)

The backend currently covers listings, favorites, profiles, saved profiles, saved searches, reviews, viewing requests, reports, and conversations/messages.

The complete OpenAPI 3.1 document is available at
[`docs/openapi.json`](docs/openapi.json). It can be imported directly into
Swagger UI, Postman, Insomnia, or an OpenAPI client generator. Regenerate it
after changing a route, schema, or Better Auth version:

```powershell
pnpm openapi:generate
```

## State And Forms

- Server-rendered data should be loaded in server components when possible.
- Interactive client-side server state uses TanStack Query.
- Client-only UI state uses Zustand.
- Forms use React Hook Form.
- Validation schemas use Zod through `zodResolver`.

## Getting Started

```powershell
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

Run the checks before opening a pull request — these are the same ones CI runs
(`.github/workflows/ci.yml`):

```powershell
pnpm type-check
pnpm lint
pnpm i18n:check
pnpm build
```

## Localization

The app serves `bg` (default) and `en` under `/[locale]/...`. All user-facing copy lives
in `locales/<locale>/<namespace>.json` and is read through `t('…')` — keys are
type-checked, so a missing translation is a build failure rather than a runtime blank.
Start with the [translations guide](docs/README.translations.md) before adding copy.
