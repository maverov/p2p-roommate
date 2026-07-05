# Web Frontend Architecture

## Core stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- TanStack Query (server state)
- Zustand (client/UI state)
- React Hook Form + Zod

## Project layout

```text
/
├── app/            # Routing and layouts only
├── features/       # Domain feature modules
├── components/     # Shared components (ui/, shared/)
├── hooks/          # App-wide hooks
├── stores/         # Global Zustand stores
├── lib/            # Infrastructure (API, i18n, wrappers)
├── locales/        # Translation JSON files
├── styles/         # Global styles
└── config/         # Constants and flags
```

## Architectural rules

1. Keep `app/` as routing/composition, not business logic.
2. Put feature logic under `features/<feature>/`.
3. Import feature APIs through each feature `index.ts` barrel.
4. Keep server data in TanStack Query, not Zustand.
5. Keep global UI/app state in `stores/`.

## Related docs

- Detailed structure guide: [../STRUCTURE.md](../STRUCTURE.md)
- Development workflows: [README.development.md](README.development.md)
