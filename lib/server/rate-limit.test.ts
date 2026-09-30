import { describe, expect, it, vi } from 'vitest';

// The limiter itself is an SQL upsert; only its pure helper is unit-tested here.
vi.mock('@/db', () => ({ db: {} }));
vi.mock('@/lib/server/api', () => ({ ApiError: class extends Error {} }));

const { retryAfterSeconds } = await import('./rate-limit');

describe('retryAfterSeconds', () => {
  const now = new Date('2026-01-01T12:00:00.000Z');

  it('rounds a partial second up', () => {
    expect(retryAfterSeconds(new Date(now.getTime() + 1_200), now)).toBe(2);
  });

  it('is never below 1, even for a window that already reset', () => {
    expect(retryAfterSeconds(now, now)).toBe(1);
    expect(retryAfterSeconds(new Date(now.getTime() - 5_000), now)).toBe(1);
  });
});
