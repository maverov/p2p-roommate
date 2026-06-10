# Project Documentation: stay-bg

## Project Structure

The project follows a monorepo structure, organizing backend services, frontend applications, shared packages, and infrastructure definitions.

```text
stay-bg/
├── apps/
│   ├── api/                    # Spring Boot 3, Gradle, Java 21
│   └── web/                    # Next.js 14 + TanStack Query
│
├── packages/
│   ├── api-contract/           # openapi.yaml lives here
│   └── generated-types/        # TS types + TanStack Query hooks (auto-generated from openapi.yaml)
│
├── infra/                      # Docker, docker-compose for local dev
├── docs/
├── pnpm-workspace.yaml         # pnpm manages JS packages only (web + generated-types)
├── .gitignore
└── README.md

# Web Frontend — Tech Stack

| Concern           | Decision                    |
|-------------------|-----------------------------|
| Framework         | Next.js 14 (App Router)     |
| Styling           | Tailwind v4 + CSS Modules   |
| Component Library | shadcn/ui                   |
| Server State      | TanStack Query              |
| Client State      | Zustand                     |
| Forms             | React Hook Form + Zod       |

---

## Rationale

**Next.js 14** — SSR is non-negotiable for listing/search pages. SEO is a primary acquisition channel ("стая под наем София"). App Router adds Server Components and per-route streaming, directly improving TTFB and Core Web Vitals.

**Tailwind v4** — JIT compilation ships only used classes (5–15kb total). CSS Modules kept for complex one-off components (maps, calendars, animations) where utility classes become unwieldy. SCSS rejected: larger bundles, specificity conflicts at scale.

**shadcn/ui** — Components live in the codebase, not in `node_modules`. Full ownership, zero unused overhead, accessibility via Radix UI primitives. Raw Radix rejected: too much time building what shadcn/ui already provides.

**TanStack Query** — Owns all server state. Strict rule: API data never touches Zustand.

**Zustand** — Owns all client state (auth user, UI state, active filters). Redux Toolkit rejected: correct tool, wrong scale for a two-person team.

**React Hook Form + Zod** — Uncontrolled inputs mean no full-tree re-renders on keystroke. Zod schemas are shared between form validation and API contract types.

---

## State Separation Rule
```
TanStack Query  →  anything from/to the server
Zustand         →  anything purely frontend
```
These two never overlap.

```text
apps/web/
├── app/                          # Routing only
│   ├── (auth)/layout.tsx
│   ├── (marketing)/layout.tsx
│   ├── (platform)/layout.tsx
│   ├── layout.tsx
│   └── page.tsx
├── features/
│   └── auth/                     # Example feature (complete structure)
│       ├── api/
│       ├── components/
│       ├── hooks/
│       ├── store/
│       ├── schemas/
│       ├── types/
│       └── index.ts (barrel export)
├── components/
│   ├── ui/
│   └── shared/
├── hooks/index.ts
├── stores/index.ts
├── lib/
│   ├── api.ts                    # API client wrapper
│   └── queryClient.ts            # TanStack Query setup
├── utils/index.ts
├── types/index.ts
├── config/index.ts
├── styles/
└── STRUCTURE.md                  # Complete documentation