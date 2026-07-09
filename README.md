# P2P Roommate Finder - Stay.bg

Stay.bg is a full-stack Next.js application for roommate and rental discovery in Bulgaria.

## Target Stack

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
├── lib/              # Auth, env, query client, area data, shared infrastructure
├── locales/          # Translation dictionaries
├── public/           # Static assets
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

Run backend checks before opening a pull request:

```powershell
pnpm type-check
pnpm lint
pnpm build
```
