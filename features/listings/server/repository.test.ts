import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';

const { results, conditions } = vi.hoisted(() => ({
  results: [] as unknown[][],
  conditions: [] as unknown[],
}));
vi.mock('@/db', () => ({
  db: {
    select: () => {
      const rows = results.shift();
      const query: Record<string, unknown> = {};
      for (const method of [
        'from',
        'innerJoin',
        'leftJoin',
        'where',
        'orderBy',
        'limit',
        'offset',
      ]) {
        query[method] = () => query;
      }
      query.where = (condition: unknown) => {
        conditions.push(condition);
        return query;
      };
      query.then = (resolve: (value: unknown) => unknown) => Promise.resolve(rows).then(resolve);
      return query;
    },
  },
}));
vi.mock('@/lib/server/api', () => ({ ApiError: class extends Error {} }));
vi.mock('@/features/reviews/server/repository', () => ({ getUserReviewSummary: vi.fn() }));
vi.mock('@/features/blocks/server/repository', () => ({ assertNotBlocked: vi.fn() }));
vi.mock('@/features/compatibility/server/repository', () => ({ compatibilityColumns: {} }));

import { listListingsQuerySchema } from '../schemas';
import {
  getPublicProfile,
  listProfileListings,
  listPublicProfiles,
  listSavedProfiles,
  getProfilePhoneForViewer,
} from '@/features/profiles/server/repository';
import {
  getOwnedListingOrThrow,
  getPublishedListingById,
  listOwnListings,
  listPublishedListings,
  listSavedListings,
  listSimilarListings,
} from './repository';

const listing = {
  id: 'listing',
  ownerId: 'owner',
  addressLine: '12 Private Street',
  latitude: 42.697743,
  longitude: 23.321912,
  citySlug: 'sofia',
  propertyType: 'ROOM',
  neighborhoodSlug: null,
};
const row = { listing, owner: { id: 'owner', name: 'Owner', image: null } };
const expectPublic = (value: unknown) =>
  expect(value).toMatchObject({
    addressLine: null,
    latitude: 42.698,
    longitude: 23.322,
  });

beforeEach(() => {
  results.length = 0;
  conditions.length = 0;
});

describe('listing read boundaries', () => {
  it('sanitizes published details for anonymous and signed-in public callers', async () => {
    results.push([row], []);
    expectPublic(await getPublishedListingById('listing'));
  });
  it('sanitizes search results', async () => {
    results.push([row], [{ value: 1 }], []);
    const result = await listPublishedListings(listListingsQuerySchema.parse({}));
    expectPublic(result.items[0]);
  });
  it('sanitizes saved listings even though the viewer is signed in', async () => {
    results.push([row], []);
    expectPublic((await listSavedListings('viewer'))[0]);
  });
  it('sanitizes similar listings', async () => {
    results.push([row], [], [row], []);
    expectPublic((await listSimilarListings('listing'))[0]);
  });
  it('sanitizes listings attached to a public profile', async () => {
    results.push([row], []);
    expectPublic((await listProfileListings('owner'))[0]);
  });
  it('preserves the precise location for owner editing and management', async () => {
    results.push([row], [], [row], []);
    expect(await getOwnedListingOrThrow('listing', 'owner')).toMatchObject(listing);
    expect((await listOwnListings('owner'))[0]).toMatchObject(listing);
  });
});

describe('public profile query boundaries', () => {
  function expectBanFilter(condition: unknown) {
    const query = new PgDialect().sqlToQuery(condition as SQL);
    expect(query.sql).toContain('"user"."banned" =');
    expect(query.sql).toContain('"user"."ban_expires" <=');
  }
  it('filters both the directory and its pagination count', async () => {
    results.push([], [{ value: 0 }]);
    expect((await listPublicProfiles({ page: 1, perPage: 10 })).total).toBe(0);
    expect(conditions).toHaveLength(2);
    conditions.forEach(expectBanFilter);
  });
  it('makes a filtered profile unavailable by direct id', async () => {
    results.push([]);
    await expect(getPublicProfile('banned')).rejects.toThrow();
    expectBanFilter(conditions[0]);
  });
  it('filters saved profiles and public profile listings', async () => {
    results.push([], []);
    expect(await listSavedProfiles('viewer')).toEqual([]);
    expect(await listProfileListings('banned')).toEqual([]);
    conditions.forEach(expectBanFilter);
  });
  it('does not expose a banned profile phone via its separate endpoint', async () => {
    results.push([]);
    await expect(getProfilePhoneForViewer('viewer', 'banned')).rejects.toThrow();
    expectBanFilter(conditions[0]);
  });
});
