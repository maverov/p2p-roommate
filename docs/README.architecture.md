# Architecture

Stay.bg is one full-stack Next.js application: one TypeScript codebase, one PostgreSQL
database, typed database access through Drizzle, and authentication through Better Auth.
Server-only concerns never reach browser bundles.

## Stack

| Concern | Decision |
| --- | --- |
| App framework | Next.js 14 (App Router), React 18 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL |
| ORM and migrations | Drizzle ORM + drizzle-kit |
| Auth | Better Auth (email + password with required email verification, password reset, account deletion; `admin` plugin for roles and bans) |
| Forms | React Hook Form |
| Validation | Zod (via `zodResolver` in forms, directly in route handlers) |
| Client server-state | TanStack Query |
| Localization | next-intl (locale-prefixed routes, namespaced ICU messages) |
| Email | Resend HTTP API, no SDK (`lib/server/email.ts`) |
| File uploads | Vercel Blob client uploads (`@vercel/blob`) |
| Background work | `waitUntil` from `@vercel/functions` (`lib/server/background.ts`) |
| Unit tests | Vitest |
| Package manager | pnpm |

There is no UI component library and no global client store. Client UI state is React
state; add a store only when state genuinely has to be shared between distant components.

## Project layout

```text
/
├── app/
│   ├── [locale]/     # Every product page, under /bg/... or /en/...
│   ├── (auth)/       # /login, /signup, /forgot-password, /reset-password, /verify-email
│   │                 #   — locale-free, so outside [locale]
│   ├── admin/        # Moderation panel — English-only, admin role required
│   ├── api/          # Route handlers (the HTTP API)
│   └── layout.tsx    # Root layout, plus providers, robots, sitemap, error, not-found
├── components/
│   ├── home/         # Landing-page sections
│   ├── shared/       # App-wide components (navbar, Footer, Avatar, Rating, StateMessage)
│   └── ui/           # Small presentational primitives (SquiggleUnderline)
├── db/               # Drizzle client, schema, migrations, seed script
├── docs/             # Engineering docs and the OpenAPI document
├── features/         # Domain modules (see below)
├── hooks/            # App-wide hooks (useDismiss, useRouterRefresh)
├── i18n/             # next-intl request config
├── lib/              # Infrastructure: auth, routes, i18n, formatting, labels, areas, images
│   └── server/       # Server-only helpers: API responses, session, env, admin guards,
│                     #   rate limiting, email, background tasks
├── locales/          # Message catalogue: <locale>/<namespace>.json + index.ts
├── public/           # Static assets
├── scripts/          # Repo tooling: i18n-check, generate-openapi, set-role
├── styles/           # globals.css
├── test/             # Vitest stubs (server-only)
├── types/            # Global type declarations (i18n.d.ts)
└── utils/            # Pure helpers (cn)
```

Features: `account`, `admin`, `auth`, `conversations`, `legal`, `listings`,
`notifications`, `profiles`, `reports`, `reviews`, `uploads`, `viewing-requests`.

Unit tests (`*.test.ts`) sit next to the module they cover and run with `pnpm test`.

## Feature modules

```text
features/<feature>/
├── components/   # UI owned by this feature
├── schemas/      # Zod schemas, shared by forms and route handlers
└── server/       # Server-only repositories and business rules
```

Create only the folders a feature needs. `auth` also has `api/` (TanStack Query hooks over
the Better Auth client), `types/`, and an `index.ts` barrel; no other feature has a barrel,
so import modules by path:

```ts
import { ListingCard } from '@/features/listings/components/ListingCard';
import { listPublishedListings } from '@/features/listings/server/repository';
import { AuthCard, LoginForm } from '@/features/auth';
```

A component used by more than one feature moves to `components/shared/`.

## Runtime boundaries

Server-only — every one of these files starts with `import 'server-only'`, so importing it
from a client component is a build error:

- `db/index.ts` (database client)
- `lib/auth.ts` (Better Auth server config)
- `lib/server/*` (env validation, session, API helpers, admin guards, rate limiting,
  email, background tasks)
- `features/*/server/*` (repositories, notifications, Blob cleanup)
- `locales/index.ts` (message catalogue)

Client-safe: presentational components, forms, TanStack Query hooks, `lib/api-client.ts`,
`lib/auth-client.ts`, `features/uploads/upload-image.ts`, and browser-only interactions.
`locales/client-namespaces.ts` stays outside the server-only catalogue so the i18n check
script can import it.

`lib/auth.ts` is the server config; the browser uses `lib/auth-client.ts`.

## Data access

1. Server components load initial page data by calling `features/*/server` repositories
   directly.
2. Client components mutate through route handlers in `app/api/`, using TanStack Query and
   `lib/api-client.ts` (or `lib/auth-client.ts` for the Better Auth routes under
   `/api/auth`).
3. The app does not use server actions today.

Never put database access in client components.

## Backend layout

```text
app/api/                         # HTTP routes
features/<feature>/schemas/      # Zod schemas shared by route handlers
features/<feature>/server/       # Server-only repositories and business rules
lib/server/api.ts                # Shared auth, parsing, and error responses
lib/server/rate-limit.ts         # Per-user write limits
db/schema.ts                     # Database tables and TypeScript types
```

Route handlers stay thin: check auth, enforce the rate limit, parse input, call a
repository, return JSON.
Business rules such as "only owners can update listings" live in repository functions.
Endpoint reference: [README.backend.md](README.backend.md).

## Admin panel

`/admin` is outside `[locale]` (and excluded from the locale middleware), and it is
English-only by design. Pages call `requireAdminUser()` and admin API routes call
`requireAdminApiUser()` (`lib/server/admin.ts`). Both return a 404 to anyone who is not an
admin, so the panel is not advertised. Admins triage reports, archive listings, and ban
users through the Better Auth `admin` plugin. Grant the role with
`pnpm admin:set-role <email> admin`.

## Security

- **Headers.** `next.config.js` sets a Content Security Policy on every response
  (`default-src 'self'`; `script-src 'self' 'unsafe-inline'`, plus `'unsafe-eval'` in
  development; `img-src` limited to this origin, `data:`, `blob:` and the allowed image
  hosts; `connect-src` limited to this origin, `vercel.com` (the Blob client uploads
  through `vercel.com/api/blob`) and `blob.vercel-storage.com` with its subdomains;
  `frame-ancestors 'none'`; `object-src 'none'`; `upgrade-insecure-requests`
  in production), plus `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy`, `Permissions-Policy`, and HSTS in production.
- **Images.** `lib/image-hosts.json` is the single allowlist: `uploads` (the Vercel Blob
  host), `site` (hosts the site's own pages use, currently `randomuser.me` for the home
  testimonials), and `development` (`picsum.photos`, for seed data, outside production
  only). All of them feed `images.remotePatterns` and the CSP `img-src`. User content is
  held to less: `isAllowedImageUrl()` (`lib/images.ts`), which the listing-image and
  avatar schemas use, accepts only https URLs on the upload host (plus the development
  hosts outside production).
- **Rate limiting.** Non-admin write routes call `enforceRateLimit(bucket, user.id)`
  (`lib/server/rate-limit.ts`): a fixed window per user in the `api_rate_limit` table,
  updated with one atomic upsert, so it holds across serverless instances. Past the limit
  the route returns `429 RATE_LIMITED` with `Retry-After`. Better Auth's own limiter for
  `/api/auth/*` uses `storage: 'database'` (table `rate_limit`).
- **JSON-LD.** `serializeJsonLd()` (`lib/jsonld.tsx`) escapes `<` as `\u003c`, so user
  text in a listing title or bio cannot close the `<script>` tag.
- **Seed.** `db/seed.ts` refuses non-local database hosts unless `ALLOW_REMOTE_SEED=1`,
  because every seed account shares a known password.

## Email and background work

`lib/server/email.ts` sends through the Resend HTTP API (`RESEND_API_KEY`, `EMAIL_FROM`).
Without them, development prints each email to the server console; production throws.
`features/notifications/server/templates.ts` renders HTML + text in the recipient's
`user.locale` from the `emails` namespace, and `notify.ts` decides who gets what:

- email verification and password reset (called by Better Auth);
- a new message, to the other participants, skipped if the same sender already wrote in
  that thread in the previous 15 minutes;
- a new viewing request, to the owner (links to My Listings `#viewing-requests`);
- accepted or declined, to the requester; cancelled, to the owner.

Notifications run after the response through `runInBackground()`
(`lib/server/background.ts`, `waitUntil` from `@vercel/functions`); a failure is logged,
never returned to the caller. Better Auth sends its emails through the same `waitUntil`
(`advanced.backgroundTasks` in `lib/auth.ts`).

## Uploads

Photos go from the browser straight to Vercel Blob. `POST /api/uploads` only issues a
short-lived client token (session required, rate-limited) pinned to a `listings/` or
`avatars/` path, the allowed image types, 10 MB, and a random suffix; the bytes never pass
through this server. `features/uploads/upload-image.ts` and `PhotoUploadButton` are the
client side. When an account is deleted, Better Auth's `deleteUser` hooks remove that
user's uploaded files (`features/uploads/server/blob.ts`).

## `lib/` and `utils/`

- `i18n.ts` — supported locales, `localeTag` (`bg-BG`), `openGraphLocale` (`bg_BG`),
  `APP_TIME_ZONE` (`Europe/Sofia`, used for every formatted date)
- `format.ts` — locale-aware `Intl` formatting (money, dates, ratings, durations)
- `routes.ts` — typed route helpers; build every URL through these
- `labels.ts` — enum value lists; their **labels** live in `locales/*/enums.json`
- `areas/` — cities and neighbourhoods as locale-aware data
- `roles.ts` — admin role constants and `isAdmin()`
- `currency.ts` — `PLATFORM_CURRENCY` (`EUR`), the single currency every price is in
- `images.ts` + `image-hosts.json` — image host allowlist and `IMAGE_UPLOAD` limits
  (10 MB; JPEG, PNG, WebP, AVIF)
- `auth-rules.ts` — password and name length rules shared by `lib/auth.ts` and the forms
- `queryClient.ts`, `api-client.ts`, `auth-client.ts`, `jsonld.tsx`, `fonts.ts`

`utils/` holds pure, locale-blind helpers (`cn()`). Anything a user reads — currency,
dates, ratings, durations — is locale-dependent and belongs in `lib/format.ts`.

## Rules

1. Keep `app/` as routing and composition; put feature logic in `features/<feature>/`.
2. Keep database access in server-only modules.
3. Route handlers validate input with Zod before calling a repository.
4. Authenticated route handlers use `requireCurrentUser` / `requireAdminApiUser`, and
   non-admin write routes call `enforceRateLimit` with a bucket from `RATE_LIMITS`.
5. Keep server data in server components or TanStack Query, never duplicated into client
   state.
6. No user-facing string in a component outside `/admin`. Copy comes from `locales/`
   through `t('…')`; `locale` decides formatting and routing, never wording. See
   [README.translations.md](README.translations.md).
7. Build URLs with `lib/routes.ts`, not string literals.
8. Keep form schemas next to the feature that owns the form, in `features/<feature>/schemas`.

## Related docs

- Setup: [README.setup.md](README.setup.md)
- Operations and deployment: [README.operations.md](README.operations.md)
- Development workflows: [README.development.md](README.development.md)
- Data flow diagram: [README.data-flow.md](README.data-flow.md)
- Backend API guide: [README.backend.md](README.backend.md)
- Translations: [README.translations.md](README.translations.md)
