# Web Frontend Operations

## Troubleshooting

### `next is not recognized`

```powershell
npm install
npm run dev
```

### Port 3000 already in use

```powershell
npm run dev -- -p 3001
```

### TypeScript errors in IDE

```powershell
npm run type-check
```

### Tailwind classes not applied

1. Restart dev server.
2. Confirm global stylesheet import in the root layout.

### React Hook Form resolver errors

```powershell
npm install @hookform/resolvers
```

## Deployment

```powershell
npm run build
npm run start
```

Set production variables in `.env.production.local`, including:

```env
NEXT_PUBLIC_API_URL=https://your-api-url
```
