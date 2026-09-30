# Data Flow Into Components

This diagram shows how request data, translations, and database records flow into
the rendered UI components.

```mermaid
flowchart TD
  %% Request + i18n bootstrap
  A[Browser request /{locale}/...] --> B[app/[locale]/layout.tsx]
  B --> C[getClientMessages(locale)]
  C --> D[locales/{locale}/*.json]
  B --> E[NextIntlClientProvider - client namespaces only]
  B --> F[Navbar/Footer + page children]

  %% Home page server-component data flow
  F --> G[app/[locale]/page.tsx]
  G --> H[FeaturedListings]
  G --> I[PopularCities]
  G --> J[HeroSection]

  H --> K[getTranslations(home.featured)]
  I --> L[getTranslations(home.popularCities)]
  J --> M[getTranslations(home.hero)]
  K --> D
  L --> D
  M --> D

  H --> N[listPublishedListings + getSavedListingIds]
  I --> O[countPublishedListingsByCity]
  N --> P[features/listings/server/repository.ts]
  O --> P
  P --> Q[db/schema.ts + Drizzle ORM]
  Q --> R[(PostgreSQL)]
  R --> Q
  Q --> P
  P --> S[ListingDTO / city counts]
  S --> T[ListingCard + city tiles]

  %% Client mutation path from components
  T --> U[SaveListingButton client component]
  U --> V[React Query mutation + apiClient]
  V --> W[POST/DELETE /api/listings/[id]/favorite]
  W --> X[app/api/listings/[id]/favorite/route.ts]
  X --> Y[requireCurrentUser + enforceRateLimit + getPublishedListingById]
  Y --> P
  X --> Z[favorites table write]
  Z --> Q
  X --> AA[JSON response]
  AA --> V
  V --> AB[Optimistic UI state update]
```

## Quick reading guide

- **Server-rendered reads** happen in server components (for example
  [FeaturedListings.tsx](../components/home/FeaturedListings.tsx))
  before HTML is returned.
- **Translations** come from [locales/](../locales)
  via [layout.tsx](../app/[locale]/layout.tsx), which sends only the client namespaces
  (`getClientMessages`) to the browser, and `getTranslations` on the server.
- **Database access** is centralized in
  [repository.ts](../features/listings/server/repository.ts)
  and executed through Drizzle.
- **Interactive actions** from client components use API routes, then update local
  UI state (optimistic heart toggle in
  [SaveListingButton.tsx](../features/listings/components/SaveListingButton.tsx)).
