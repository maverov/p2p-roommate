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

### Tailwind classes not applied

1. Restart dev server.
2. Confirm global stylesheet import in the root layout.

### React Hook Form resolver errors

```powershell
pnpm add @hookform/resolvers
```

## Deployment

```powershell
pnpm build
pnpm start
```

Set production variables in `.env.production.local`, including:

```env
DATABASE_URL=postgresql://user:password@host:5432/database
BETTER_AUTH_SECRET=replace-with-a-high-entropy-secret
BETTER_AUTH_URL=https://your-app-url
```
