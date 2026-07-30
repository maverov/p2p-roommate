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

The time zone is pinned in `i18n/request.ts` (`Europe/Sofia`) precisely to prevent
this. If it reappears, check for a `new Date()` formatted without going through
`lib/format.ts`.

### Tailwind classes not applied

1. Restart dev server.
2. Confirm global stylesheet import in the root layout.

### React Hook Form resolver errors

```powershell
pnpm add @hookform/resolvers
```

## Deployment

Run the CI checks first — these are what `.github/workflows/ci.yml` enforces on every
pull request:

```powershell
pnpm type-check
pnpm lint
pnpm i18n:check
pnpm build
pnpm start
```

Set production variables in `.env.production.local`, including:

```env
DATABASE_URL=postgresql://user:password@host:5432/database
BETTER_AUTH_SECRET=replace-with-a-high-entropy-secret
BETTER_AUTH_URL=https://your-app-url
```
