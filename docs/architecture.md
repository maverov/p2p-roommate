# Architecture

## Core Decision

Stay.bg is a full-stack Next.js application.

The application should optimize for a small, fast-moving product team:

- one primary TypeScript codebase
- one PostgreSQL database
- typed database access through Drizzle
- authentication through Better Auth
- feature-oriented UI and product logic
- server-only concerns kept out of browser bundles

## Stack

| Concern | Decision |
| --- | --- |
| App framework | Next.js App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI primitives | shadcn/ui |
| Database | PostgreSQL |
| ORM | Drizzle |
| Auth | Better Auth |
| Forms | React Hook Form |
| Validation | Zod via `zodResolver` |
| Client server-state | TanStack Query |
| Client UI state | Zustand |
| Localization | next-intl (ICU messages under `locales/`) |

## Localization

Every user-facing string lives in `locales/<locale>/<namespace>.json` and is read through
`getTranslations` (server) or `useTranslations` (client). `locale` decides formatting
(`lib/format.ts`) and routing (`lib/routes.ts`); it never decides wording. Missing keys are
a compile error, and `pnpm i18n:check` gates catalogue integrity in CI. Full guide:
[README.translations.md](README.translations.md).

## Runtime Boundaries

### Server-only

- database connection
- Drizzle schema and queries
- Better Auth server config
- secrets and environment validation
- write operations
- privileged reads

### Client-safe

- presentational components
- form components
- TanStack Query hooks
- Zustand UI state
- browser-only interactions

Server-only modules must not be imported by client components. Prefer explicit files such as `lib/server/*`, `db/*`, and route handlers for privileged work.

## Data Access

Use this order of preference:

1. Server components for initial page data.
2. Server actions for mutations that are tightly coupled to forms.
3. Route handlers for public API surfaces and TanStack Query.
4. TanStack Query for interactive client-side fetching, caching, and refetching.

Do not put database access inside Zustand stores or client components.

## Forms

React Hook Form owns form state and submission ergonomics. Zod owns schema validation and type inference.

```ts
const form = useForm<FormInput>({
  resolver: zodResolver(formSchema),
});
```

Keep form schemas near the feature that owns the form, usually in `features/<feature>/schemas`.
