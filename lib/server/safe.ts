import 'server-only';

import { ApiError } from '@/lib/server/api';

/**
 * Runs a secondary data fetch that must not take the page down with it.
 *
 * Reviews, similar listings and owner stats are all enrichment: if one query
 * fails the page should still render with that section showing an explicit error
 * state, not a 500. `null` is the "this section failed" signal for callers.
 */
export async function safeQuery<T>(promise: Promise<T>, context: string): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    console.error(`[safeQuery] ${context} failed`, error);

    return null;
  }
}

type QueryOutcome<T> =
  | { status: 'ok'; data: T }
  | { status: 'missing' }
  | { status: 'failed' };

/**
 * `safeQuery` for a page's *primary* record, where "this row does not exist" and
 * "the query blew up" must produce different pages — a real 404 versus an error
 * state. Repositories signal the former by throwing a 404 `ApiError`, so a
 * database outage can never masquerade as a deleted profile.
 */
export async function tryQuery<T>(
  promise: Promise<T>,
  context: string,
): Promise<QueryOutcome<T>> {
  try {
    return { status: 'ok', data: await promise };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { status: 'missing' };
    }

    console.error(`[tryQuery] ${context} failed`, error);

    return { status: 'failed' };
  }
}
