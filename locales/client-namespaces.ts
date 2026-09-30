/**
 * Namespaces that client components under `app/[locale]` read through `useTranslations`.
 * Only these cross to the browser; emails, legal copy, metadata and the like stay on the
 * server. `pnpm i18n:check` fails when a client component reads a namespace not listed here.
 *
 * Kept outside `locales/index.ts` (which is `server-only`) so the check script can import it.
 */
export const CLIENT_NAMESPACES = [
  'common',
  'enums',
  'home',
  'listings',
  'messages',
  'profiles',
  'reviews',
  'settings',
] as const;

export type ClientNamespace = (typeof CLIENT_NAMESPACES)[number];

/** The `(auth)` layout provides its own catalogue: only `auth` reaches those pages. */
export const AUTH_CLIENT_NAMESPACES = ['auth'] as const;
