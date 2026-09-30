# Web App Operations

## Troubleshooting

### `next is not recognized`

```powershell
pnpm install
pnpm dev
```

### Port 3000 already in use

```powershell
pnpm dev -- -p 3001
```

### TypeScript errors in IDE

```powershell
pnpm type-check
```

### `MISSING_MESSAGE` or a key rendered instead of text

A translation key is missing from the locale being rendered. Run:

```powershell
pnpm i18n:check
```

It reports which locale is missing which key. Note this should not normally reach
runtime — `pnpm type-check` catches missing and misspelled keys at build time.

### Dates or prices render differently on server and client

The time zone is pinned to `APP_TIME_ZONE` (`Europe/Sofia`, `lib/i18n.ts`) precisely to
prevent this: `lib/format.ts`, `i18n/request.ts`, both `NextIntlClientProvider`s, and the
email translator all use it. If it reappears, check for a `new Date()` formatted without
going through `lib/format.ts`.

### Tailwind classes not applied

1. Restart dev server.
2. Confirm global stylesheet import in the root layout.

### Startup fails with a Zod error about `DATABASE_URL` or `BETTER_AUTH_SECRET`

`lib/server/env.ts` validates the server environment on first use. Check `.env.local`
against `.env.example`; `BETTER_AUTH_SECRET` must be at least 32 characters, and
`DATABASE_POOL_MAX`, if set, an integer from 1 to 100.

### `pnpm db:*` hits the wrong database

`drizzle.config.ts` uses the same precedence as Next.js: a `DATABASE_URL` set in the
environment (CI, a deploy shell) wins, then `.env.local`, then `.env`. Check for a stale
`DATABASE_URL` exported in your shell.

### No verification or password-reset email arrives

Without `RESEND_API_KEY` and `EMAIL_FROM`, `pnpm dev` prints each email, link included,
to the dev server console instead of sending it. In a production build (`pnpm start`, or
a deploy) the send throws instead and the error lands in the server log; nothing is
printed. If both are set, check that the `EMAIL_FROM` domain is verified in Resend.

### Photo upload says uploads are not set up

`POST /api/uploads` returned `503 UPLOADS_NOT_CONFIGURED`: `BLOB_READ_WRITE_TOKEN` is not
set. See [README.setup.md](README.setup.md#photo-uploads).

### A request fails with `429 RATE_LIMITED`

A per-user limit in `RATE_LIMITS` (`lib/server/rate-limit.ts`) was hit. The response's
`Retry-After` header (and `error.details.retryAfterSeconds`) says when the window resets.
Counters live in the `api_rate_limit` table; deleting a user's rows there resets them.
Better Auth's own limiter for `/api/auth/*` keeps its counters in `rate_limit`.

### Seed photos do not show under `pnpm start`

`picsum.photos` is on the image allowlist (`lib/image-hosts.json`) outside production
only. A production build rejects those URLs, in both `next/image` and the CSP.

## Deployment

CI (`.github/workflows/ci.yml`) runs `type-check`, `lint`, `i18n:check`, `test`,
migrations from an empty Postgres 16 database, `db:check`, an unmigrated-schema check,
and a production build. Run the same set locally before deploying:

```powershell
pnpm type-check
pnpm lint
pnpm i18n:check
pnpm test
pnpm build
```

Apply migrations to the production database before starting the new build:

```powershell
pnpm db:migrate
pnpm start
```

`db:migrate` takes `DATABASE_URL` from the environment when it is set there, so it can
run from the deploy's shell. Migration `0007` converts any BGN listing to EUR at the
fixed rate (1 EUR = 1.95583 BGN) and then adds the `listing_currency_eur` check; a
listing in any other currency makes it fail, so convert those by hand first. `0008` adds
the rate-limit tables and `user.locale`, and `0009` drops the saved-search table.

Never run `pnpm db:seed` against production: seed accounts share a public password, and
the script refuses non-local hosts unless `ALLOW_REMOTE_SEED=1` is set.

Set production variables in `.env.production.local` (or the host's environment):

```env
DATABASE_URL=postgresql://user:password@host:5432/database
BETTER_AUTH_SECRET=replace-with-a-high-entropy-secret
BETTER_AUTH_URL=https://your-app-url
NEXT_PUBLIC_APP_URL=https://your-app-url
RESEND_API_KEY=re_...
EMAIL_FROM="Stay.bg <noreply@your-verified-domain>"
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

`NEXT_PUBLIC_APP_URL` is inlined at build time, so set it before `pnpm build`. Without it,
canonical URLs, the sitemap, and JSON-LD point at `http://localhost:3000`, and
notification email links fall back to `BETTER_AUTH_URL`. Verification and reset links are
always built from `BETTER_AUTH_URL`, so it must be the public URL.

Email is required in production: without `RESEND_API_KEY` and `EMAIL_FROM`, every send
throws, so nobody can verify an address or reset a password. On serverless hosts, point
`DATABASE_URL` at a connection pooler and lower `DATABASE_POOL_MAX` (default 10; e.g. 1),
since every instance opens its own pool.

A production build also turns on `Strict-Transport-Security` and the CSP's
`upgrade-insecure-requests`, drops the development-only image hosts, and enables Better
Auth's rate limiter (Better Auth leaves it off in development). The per-user API limits
apply in every environment.

## Open before launch

- Real favicon, Apple touch icon, logo, and OG image assets (see
  [README.seo.md](README.seo.md#known-gap-icons-and-og-image-are-missing)).
- Final legal text: `/privacy` and `/terms` hold the agreed section structure with
  placeholder text and stay `noindex` until legal review.
- Hosting, monitoring, and database backup decisions.
- Resend: verify the sending domain used in `EMAIL_FROM`.
- Vercel Blob: create the store and set `BLOB_READ_WRITE_TOKEN`.
- A connection pooler for production Postgres.
- Home-page testimonials are placeholder content.
- Footer links to pages that do not exist yet: find a room, help centre, safety tips,
  about us, contact.
