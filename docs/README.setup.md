# Web App Setup

## Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL for local database work

Verify:

```powershell
node --version
pnpm --version
```

## Local setup

```powershell
cd C:\Users\PC\Desktop\p2p-roommate
pnpm install
```

Create `.env.local` when database and auth are wired:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/stay_bg
BETTER_AUTH_SECRET=replace-with-a-local-secret
BETTER_AUTH_URL=http://localhost:3000
```

## Run the app

```powershell
pnpm dev
```

Open `http://localhost:3000`.

## Scripts

```bash
pnpm dev          # Development server
pnpm build        # Production build
pnpm start        # Start built app
pnpm lint         # ESLint
pnpm type-check   # TypeScript checks
```
