import 'server-only';

import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { listings, user } from '@/db/schema';
import { auth } from '@/lib/auth';
import { isAdmin } from '@/lib/roles';
import { ApiError } from '@/lib/server/api';

import type { BanUserInput } from '../schemas';

const DAY_SECONDS = 24 * 60 * 60;

/**
 * Bans through the Better Auth admin plugin, which signs the user out everywhere
 * and blocks new sign-ins, then pauses their published listings so the account
 * disappears from search. Paused, not archived: once unbanned, they can republish.
 *
 * `headers` must be the acting admin's request headers; the plugin re-checks their role.
 */
export async function banUser(userId: string, input: BanUserInput, headers: Headers) {
  const [target] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!target) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User was not found.');
  }

  if (isAdmin(target)) {
    throw new ApiError(409, 'CANNOT_BAN_ADMIN', 'Admins cannot be banned. Revoke the admin role first.');
  }

  await auth.api.banUser({
    body: {
      userId,
      banReason: input.reason,
      banExpiresIn: input.durationDays === null ? undefined : input.durationDays * DAY_SECONDS,
    },
    headers,
  });

  const paused = await db
    .update(listings)
    .set({ status: 'PAUSED', updatedAt: new Date() })
    .where(and(eq(listings.ownerId, userId), eq(listings.status, 'PUBLISHED')))
    .returning({ id: listings.id });

  return { pausedListingCount: paused.length };
}
