import 'server-only';

import { notFound } from 'next/navigation';

import { isAdmin } from '@/lib/roles';
import { ApiError, getCurrentUser } from '@/lib/server/api';
import { getServerUser } from '@/lib/server/session';

/**
 * Guard for admin pages. Everyone else, signed in or not, gets a 404 rather than
 * a login redirect, so the panel's existence is not advertised.
 */
export async function requireAdminUser() {
  const user = await getServerUser();

  if (!user || !isAdmin(user)) {
    notFound();
  }

  return user;
}

/** Guard for admin API routes, with the same 404 so the endpoints are not advertised either. */
export async function requireAdminApiUser(request: Request) {
  const user = await getCurrentUser(request);

  if (!user || !isAdmin(user)) {
    throw new ApiError(404, 'NOT_FOUND', 'Not found.');
  }

  return user;
}
