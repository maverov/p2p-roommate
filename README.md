# P2P Roommate Finder - Stay.bg

Stay.bg is a full-stack Next.js application for roommate and rental discovery in Bulgaria.
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Drizzle ORM
- PostgreSQL
- Better Auth
- TanStack Query (server state)
- Zustand (client/UI state)
- React Hook Form + Zod

## Features

**Tenants**

- Search published listings by text, city, neighbourhood, property type, room type, rent, rooms, move-in date, length of stay, roommate preference, and amenities (including private bathroom, couples and smoking); sort by newest or price.
- Switch the results between a list and a map with price pins.
- Browse a landing page per city and neighbourhood (`/rooms`, `/rooms/sofia/lozenets`) with live rent figures, the newest listings, and nearby areas. They are in the sitemap; empty areas are `noindex`.
- Open a listing's photos, details, who already lives there, its approximate location on a map, reviews, owner card, and similar listings.
- Browse roommate profiles by city and lifestyle tags (Find a roommate).
- See a compatibility percentage on listing and roommate cards, worked out from your profile (budget, area, dates, lifestyle tags, preferences) against the listing's household and rules or the other person's profile (`features/compatibility/score.ts`). It only appears when both sides have filled in enough to compare.
- Publish a "room wanted" post (areas, budget, move-in date, length of stay) so owners can find and message you.
- Save listings and profiles to a Saved page.
- Message an owner from a listing; replies arrive by polling.
- Request a viewing at a chosen time, and track or cancel requests on Applied Listings.
- After an accepted viewing has taken place, review the listing and the owner.

**Owners**

- Create and edit listings with up to 12 uploaded photos, each with alt text; the first is the cover.
- Describe the room (type, private bathroom, minimum and maximum stay) and the household (size, ages, occupation, habits), and drop a pin on a map.
- Find people looking for a room and message them, offering one of your listings.
- Keep listings as drafts, publish, pause, or archive them from My Listings.
- Accept or decline viewing requests on My Listings, and review the tenant once the viewing has taken place.

**Accounts and privacy**

- Email and password sign-up with required email verification, and password reset by email.
- Continue with Google or Facebook (each on when its keys are set); Google joins an existing account with the same email.
- Email notifications for new messages and viewing-request updates, in the user's chosen language.
- A settings page for the profile (photo, bio, phone and whether signed-in users may see it, city, languages, lifestyle tags, roommate preferences, "room wanted" post), blocked users, and email language.
- Download all of one's own data as JSON, or delete the account (confirmed with the password).

**Trust and safety**

- Report a listing or a user with a structured reason.
- Block a user: neither side can then message, request a viewing, or see the other's phone number.
- Phone numbers and emails typed into listings and bios are hidden from signed-out visitors.
- A Safety tips page (payments, common scams, viewings, checking ownership, contracts), linked from listings and conversations.
- Printable templates (`/templates`), in Bulgarian and English: a rental agreement, a handover protocol (приемо-предавателен протокол) and house rules. The copy lives in `locales/*/templates.json`.
- Reviews only between people who had an accepted viewing.
- Public profiles with lifestyle tags, listings, and reviews. Verification badges exist but are hidden (`VERIFICATION_BADGES` in `lib/feature-flags.ts`) until there is a way to earn one.
- An admin panel (`/admin`) to triage reports, archive listings, and ban users.
- Per-user rate limits on messaging, listings, viewing requests, reviews, reports, and uploads.

**Languages**

- Bulgarian (default) and English, with locale-prefixed URLs and a language switcher.
- Prices in EUR; dates in Bulgarian time.

## Technology Stack

- Next.js 14 App Router
- React 18
- TypeScript
- Tailwind CSS 4
- Drizzle ORM
- PostgreSQL
- Better Auth
- TanStack Query for client-side server state
- React Hook Form + Zod for forms and validation
- next-intl for localization
- Resend (HTTP API) for transactional email
- Vercel Blob for photo uploads
- Vitest for unit tests
- pnpm

## Project Structure

```text
p2p-roommate/
├── app/              # Routes, layouts, route handlers, admin panel
├── components/       # Shared UI (home sections, shared, ui primitives)
├── db/               # Drizzle client, schema, migrations, seed
├── docs/             # Engineering docs and the OpenAPI document
├── features/         # Domain feature modules
├── hooks/            # App-wide hooks
├── i18n/             # next-intl request config
├── lib/              # Auth, routes, i18n, formatting, area data; lib/server is server-only
├── locales/          # Message catalogue: <locale>/<namespace>.json
├── public/           # Static assets
├── scripts/          # Repo tooling (i18n-check, generate-openapi, set-role)
├── styles/           # Global styles
├── test/             # Vitest stubs (server-only)
├── types/            # Global type declarations
├── utils/            # Pure helpers
└── package.json
```

Full layout and rules: [docs/README.architecture.md](docs/README.architecture.md).

## Architecture

The Next.js app owns the product surface, authentication, persistence, and server-side business logic. Server-only code stays behind App Router route handlers and server components. Browser components do not import database, auth server, or environment modules directly.

PostgreSQL is the system of record. Drizzle owns schema definitions, typed queries, and migrations. Better Auth owns authentication (required email verification, password reset, account deletion), session lifecycle, and admin roles.

Every response carries security headers (a Content Security Policy among them, set in `next.config.js`), and every non-admin write route is rate-limited per user.

Backend functionality is exposed through App Router route handlers under `app/api/`. Read the beginner-friendly backend guide before adding or calling API routes:

- [Backend API guide](docs/README.backend.md)

The backend covers listings, favorites, profiles, saved profiles, reviews, viewing requests, reports, conversations/messages, photo uploads, account data export, email notifications, and admin moderation (reports, listing archiving, user bans).

The OpenAPI 3.1 document for the public and signed-in-user API is at
[`docs/openapi.json`](docs/openapi.json). It can be imported directly into
Swagger UI, Postman, Insomnia, or an OpenAPI client generator. Admin endpoints are
deliberately left out (they return 404 to non-admins); they are documented in the
backend guide. Regenerate it after changing a route, schema, or Better Auth version:

```powershell
pnpm openapi:generate
```

## State And Forms

- Server-rendered data is loaded in server components when possible.
- Interactive client-side server state uses TanStack Query.
- Client-only UI state uses React state.
- Forms use React Hook Form.
- Validation schemas use Zod through `zodResolver`.

## Getting Started

Requires Node.js 22.13+ (the version CI uses), pnpm, and PostgreSQL.

```powershell
pnpm install
Copy-Item .env.example .env.local   # then fill in DATABASE_URL and BETTER_AUTH_SECRET
pnpm db:migrate
pnpm db:seed                        # optional sample data
pnpm dev
```

Open `http://localhost:3000`. Sign-up requires email verification: without
`RESEND_API_KEY`, the dev server prints each email, including the verification link, to
its console. Photo uploads need `BLOB_READ_WRITE_TOKEN`. To use the admin panel at
`/admin`, sign up and then run `pnpm admin:set-role <your-email> admin`. Full
walkthrough: [docs/README.setup.md](docs/README.setup.md).

Run the checks before opening a pull request. CI (`.github/workflows/ci.yml`) runs all of
them, and also applies the migrations to an empty Postgres database and fails if
`db/schema.ts` has changes with no generated migration:

```powershell
pnpm type-check
pnpm lint
pnpm i18n:check
pnpm test
pnpm build
```

## Localization

The app serves `bg` (default) and `en` under `/[locale]/...`. All user-facing copy lives
in `locales/<locale>/<namespace>.json` and is read through `t('…')` — keys are
type-checked, so a missing translation is a build failure rather than a runtime blank.
Emails go out in the recipient's chosen language, and dates are always shown in
`Europe/Sofia` time. The admin panel is the one exception: it is English-only. Start with the
[translations guide](docs/README.translations.md) before adding copy.
