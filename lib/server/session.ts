import 'server-only';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';

import { auth } from '@/lib/auth';
import { routes } from '@/lib/routes';

/**
 * Request-scoped session lookup. `cache()` dedupes it so a layout, a page and
 * any number of server components share a single database round-trip.
 */
export const getServerSession = cache(async () =>
  auth.api.getSession({ headers: headers() }),
);

export async function getServerUser() {
  const session = await getServerSession();

  return session?.user ?? null;
}

/**
 * Guard for protected pages. Sends unauthenticated visitors to /login and
 * brings them back to `returnTo` once they are signed in.
 */
export async function requireServerUser(returnTo: string) {
  const user = await getServerUser();

  if (!user) {
    redirect(routes.login(returnTo));
  }

  return user;
}
