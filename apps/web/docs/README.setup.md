# Web Frontend Setup

## Prerequisites

- Node.js 18+
- npm

Verify:

```powershell
node --version
npm --version
```

## Local setup

```powershell
cd C:\Users\PC\Desktop\p2p-roommate\apps\web
npm install
copy .env.example .env.local
```

Set API URL in `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Run the app

```powershell
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Start built app
npm run lint         # ESLint
npm run type-check   # TypeScript checks
```
