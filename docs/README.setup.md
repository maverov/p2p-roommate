# Web App Setup

## Prerequisites

- Node.js 22.13+ — the version CI uses. `db:seed` and `admin:set-role` rely on
  `node --env-file-if-exists`, which older Node versions do not support.
- pnpm (the version is pinned in `package.json` → `packageManager`)
- PostgreSQL

Verify:

```powershell
node --version
pnpm --version
```

## Local setup

From the repository root:

```powershell
pnpm install
Copy-Item .env.example .env.local
```

Fill in `.env.local`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/stay_bg
BETTER_AUTH_SECRET=replace-with-a-32-character-minimum-secret
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional
DATABASE_POOL_MAX=10
RESEND_API_KEY=
EMAIL_FROM="Stay.bg <noreply@stay.bg>"
BLOB_READ_WRITE_TOKEN=
```

`lib/server/env.ts` validates the server variables on first use: `DATABASE_URL` and
`BETTER_AUTH_URL` must be URLs, `BETTER_AUTH_SECRET` must be at least 32 characters, and
`DATABASE_POOL_MAX` (connections per server instance, default 10) must be an integer from
1 to 100. The rest are optional. `NEXT_PUBLIC_APP_URL` builds canonical URLs, the
sitemap, JSON-LD, and the links in emails.

A variable already set in the environment wins over both files; after that, `.env.local`
wins over `.env`. Next.js, `drizzle.config.ts`, and the `db:seed` / `admin:set-role`
scripts all follow that precedence.

### Email

Sign-up requires email verification, so you need the emails to finish signing up. Without
`RESEND_API_KEY` and `EMAIL_FROM`, `pnpm dev` prints every email (verification, password
reset, notifications) to its console, links included; open the link from there. This
fallback is development-only: in a production build (`pnpm start`) an unconfigured send
throws instead.

### Photo uploads

Listing photos and avatars upload straight from the browser to Vercel Blob. Without
`BLOB_READ_WRITE_TOKEN`, `POST /api/uploads` returns `503 UPLOADS_NOT_CONFIGURED` and the
forms say uploads are not set up; everything else works. To test uploads, create a Blob
store in Vercel and copy its read/write token.

## Database

```powershell
pnpm db:migrate   # apply db/migrations to DATABASE_URL
pnpm db:seed      # optional: sample users, listings, reviews, conversations
```

The seed is safe to re-run: every row it creates has a `seed-` id prefix, and it deletes
those rows before inserting. Seeded accounts such as `maria@stay.bg` are already verified
and share the password `password123`. Because that password is public, the seed refuses
any `DATABASE_URL` host other than `localhost`, `127.0.0.1`, `[::1]`, or
`host.docker.internal`; set `ALLOW_REMOTE_SEED=1` only for a disposable, non-public
database.

Seed listing photos come from `picsum.photos`, which is on the image allowlist outside
production only, so they show under `pnpm dev` but not under `pnpm build && pnpm start`.

## Run the app

```powershell
pnpm dev
```

Open `http://localhost:3000`.

## Admin access

Sign up and confirm the address (or use a seeded account), then grant yourself the role:

```powershell
pnpm admin:set-role you@example.com admin
```

The role applies on your next page load. Open `http://localhost:3000/admin`.

## Scripts

```bash
pnpm dev               # Development server
pnpm build             # Production build
pnpm start             # Start built app
pnpm lint              # ESLint
pnpm type-check        # TypeScript checks
pnpm test              # Unit tests (Vitest)
pnpm i18n:check        # Message catalogue integrity (missing keys, ICU drift)
pnpm db:generate       # Generate a migration from db/schema.ts changes
pnpm db:migrate        # Apply pending migrations
pnpm db:check          # Check migration consistency
pnpm db:studio         # Browse the database in Drizzle Studio
pnpm db:seed           # Load development sample data
pnpm admin:set-role    # Grant or revoke admin: <email> <admin|user>
pnpm openapi:generate  # Regenerate docs/openapi.json
pnpm analyze           # Bundle analysis build (POSIX shells; see below)
```

`pnpm analyze` sets `ANALYZE=true` with POSIX syntax. In PowerShell run
`$env:ANALYZE='true'; pnpm build` instead.

CI (`.github/workflows/ci.yml`) runs on every push to `main` and every pull request,
against a throwaway Postgres 16 service: `type-check`, `lint`, `i18n:check`, `test`,
`db:migrate` from an empty database, `db:check`, a check that `db:generate` produces no
new migration (a `db/schema.ts` change without its migration fails), and `build`.
