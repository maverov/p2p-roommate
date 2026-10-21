import 'server-only';

import { eq, lte, or } from 'drizzle-orm';

import { user } from '@/db/schema';

/** Expired temporary bans stop hiding profiles without requiring another login. */
export function publicUserCondition(now = new Date()) {
  return or(eq(user.banned, false), lte(user.banExpires, now))!;
}
