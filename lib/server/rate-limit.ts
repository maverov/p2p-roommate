import 'server-only';

import { sql } from 'drizzle-orm';

import { db } from '@/db';
import { apiRateLimits } from '@/db/schema';
import { ApiError } from '@/lib/server/api';

export type RateLimitRule = { limit: number; windowSeconds: number };

/**
 * Per-user limits for the write endpoints: high enough that a person using the site
 * never meets them, low enough that a script cannot message every owner or flood the
 * report queue. Keyed by user id, since every write route requires a session.
 */
export const RATE_LIMITS = {
  startConversation: { limit: 10, windowSeconds: 60 * 60 },
  sendMessage: { limit: 30, windowSeconds: 60 },
  createListing: { limit: 10, windowSeconds: 24 * 60 * 60 },
  updateListing: { limit: 60, windowSeconds: 60 * 60 },
  requestViewing: { limit: 10, windowSeconds: 60 * 60 },
  updateViewingRequest: { limit: 60, windowSeconds: 60 * 60 },
  report: { limit: 10, windowSeconds: 60 * 60 },
  review: { limit: 10, windowSeconds: 60 * 60 },
  favorite: { limit: 120, windowSeconds: 60 },
  block: { limit: 30, windowSeconds: 60 * 60 },
  updateProfile: { limit: 30, windowSeconds: 60 * 60 },
  upload: { limit: 60, windowSeconds: 60 * 60 },
  dataExport: { limit: 5, windowSeconds: 60 * 60 },
} as const satisfies Record<string, RateLimitRule>;

export type RateLimitBucket = keyof typeof RATE_LIMITS;

/** Whole seconds until the window resets, never less than 1 (a `Retry-After: 0` invites a hot loop). */
export function retryAfterSeconds(resetAt: Date, now: Date = new Date()): number {
  return Math.max(1, Math.ceil((resetAt.getTime() - now.getTime()) / 1000));
}

/**
 * Counts one request against `bucket` for `subject` and throws a 429 past the limit.
 *
 * Fixed window in Postgres, so it holds across serverless instances with no extra
 * infrastructure: a single upsert either starts a fresh window or increments the
 * current one, atomically, so concurrent requests cannot slip past the limit.
 */
export async function enforceRateLimit(bucket: RateLimitBucket, subject: string) {
  const { limit, windowSeconds } = RATE_LIMITS[bucket];
  const nextReset = sql`now() + make_interval(secs => ${windowSeconds}::double precision)`;
  const expired = sql`${apiRateLimits.resetAt} <= now()`;

  const [row] = await db
    .insert(apiRateLimits)
    .values({ key: `${bucket}:${subject}`, count: 1, resetAt: nextReset })
    .onConflictDoUpdate({
      target: apiRateLimits.key,
      set: {
        count: sql`CASE WHEN ${expired} THEN 1 ELSE ${apiRateLimits.count} + 1 END`,
        resetAt: sql`CASE WHEN ${expired} THEN ${nextReset} ELSE ${apiRateLimits.resetAt} END`,
      },
    })
    .returning({ count: apiRateLimits.count, resetAt: apiRateLimits.resetAt });

  if (row && row.count > limit) {
    const retryAfter = retryAfterSeconds(row.resetAt);

    throw new ApiError(
      429,
      'RATE_LIMITED',
      'Too many requests. Try again later.',
      { retryAfterSeconds: retryAfter },
      { 'Retry-After': String(retryAfter) },
    );
  }
}
