# Project P2P Roommate Finder - Stay.bg (placeholder name)

> A contract-first, polyglot monorepo — the frontend and backend are fully decoupled through an OpenAPI specification.

### Tech Stack
- Next.js 14 (App Router)
- React 19
- Tailwind v4 + CSS Modules
- shadcn/ui (Radix UI primitives)
- TanStack Query v5 (server state)
- Zustand (client state)
- React Hook Form + Zod (forms)
- TypeScript
- pnpm workspace (monorepo with Spring Boot backend)

---

## Project Structure

```
stay-bg/
│
├── apps/
│   ├── api/                        # Spring Boot 3 · Gradle · Java 21
│   │                               # Owns all business logic, persistence, and auth.
│   │                               # Completely unaware of the frontend's existence.
│   │                               # Can be replaced with any other backend (e.g. NestJS)
│   │                               # without touching any other part of this repo.
│   │
│   └── web/                        # Next.js 14 · TanStack Query · TypeScript
│                                   # SSR for SEO-critical pages (listing pages, search).
│                                   # TanStack Query handles all client-side server state,
│                                   # caching, and background refetching.
│                                   # Completely unaware of what technology runs the API.
│
├── packages/
│   │
│   ├── api-contract/               # The single source of truth for the API.
│   │   ├── openapi.yaml            # Hand-authored OpenAPI 3.1 spec. Every endpoint,
│   │   │                           # request body, and response shape is defined here
│   │   │                           # before any code is written (API-First / Contract-First).
│   │   │                           # Neither the frontend nor the backend is built against
│   │   │                           # each other — both are built against this file.
│   │   ├── package.json            # Owns the codegen scripts.
│   │   └── codegen.config.ts       # Orval config — points at openapi.yaml, outputs to
│   │                               # generated-types/. Run manually or in CI.
│   │
│   └── generated-types/            # Auto-generated. Never edited by hand.
│       ├── package.json            # Makes this importable as a workspace package.
│       ├── index.ts                # Generated TypeScript types (User, Listing, etc.)
│       └── hooks/                  # Generated TanStack Query hooks (useGetListings, etc.)
│                                   # NOTE: all files inside src/ are gitignored.
│                                   # The package exists in source control; its contents do not.
│                                   # Regenerated at build time and in CI.
│
├── infra/
│   ├── docker-compose.yml          # Local development environment.
│   │                               # Runs MongoDB, Redis, and the API together.
│   │                               # Single command to get a full local stack running.
│   └── ...                         # Terraform / k8s configs added here as the project scales.
│
├── docs/                           # Architecture decision records (ADRs), API usage guides,
│                                   # onboarding docs. Kept in the repo so docs and code
│                                   # are versioned together.
│
├── Makefile                        # The single entry point for any engineer on any machine.
│                                   # Abstracts over the polyglot nature of the repo —
│                                   # no need to know Gradle vs pnpm vs Docker commands.
│                                   # Key targets: generate | dev | build | lint | test
│
├── pnpm-workspace.yaml             # Declares pnpm workspaces for the JS side only:
│                                   # apps/web and packages/*
│                                   # Gradle manages apps/api independently.
│
├── .gitignore
└── README.md
```

---

## Architectural Patterns

### 1. Contract-First Design (API-First)
The `openapi.yaml` is written before any backend or frontend code. Both sides are independently built against the contract — not against each other. This means:
- Frontend and backend teams can work fully in parallel
- The backend can be replaced without the frontend knowing (and vice versa)
- The contract is the only thing that needs to be agreed on across teams

### 2. Polyglot Monorepo
The backend (Java) and frontend (TypeScript) live in one repository but are fully decoupled at the code level. They share infrastructure configuration, the API contract, and tooling — nothing else.

### 3. Generated Code as a Package
`generated-types/` is treated as a first-class package that can be imported by `apps/web`. The generation step is automated, not manual. The distinction is important: **the package is in source control, the generated files are not**.

---

## Key Principle

Neither `apps/api` nor `apps/web` has a direct dependency on the other.  
They only depend on `packages/api-contract`.  
Everything else follows from this.

---

## Getting Started

```bash
make generate   # Generate TS types + hooks from openapi.yaml
make dev        # Start api + web + infra concurrently
make build      # Production build for both apps
make test       # Run all tests across all apps
```