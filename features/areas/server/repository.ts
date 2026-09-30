import 'server-only';

import { and, count, eq, or, sql } from 'drizzle-orm';
import { cache } from 'react';

import { db } from '@/db';
import { listings, user, userProfiles } from '@/db/schema';
import type { CityId } from '@/lib/areas';

export type AreaRef = { citySlug: CityId; neighborhoodSlug?: string };

function publishedIn({ citySlug, neighborhoodSlug }: AreaRef) {
  return and(
    eq(listings.status, 'PUBLISHED'),
    eq(listings.citySlug, citySlug),
    neighborhoodSlug ? eq(listings.neighborhoodSlug, neighborhoodSlug) : undefined,
  );
}

/**
 * Listing count and rent spread for an area page's copy and meta description.
 * `cache`d: the page and its metadata both ask for the same area in one request.
 */
export const getAreaRentStats = cache(async (citySlug: CityId, neighborhoodSlug?: string) => {
  const [row] = await db
    .select({
      count: count(),
      min: sql<number | null>`min(${listings.monthlyRentCents})`,
      median: sql<
        number | null
      >`percentile_cont(0.5) within group (order by ${listings.monthlyRentCents})`,
      max: sql<number | null>`max(${listings.monthlyRentCents})`,
    })
    .from(listings)
    .where(publishedIn({ citySlug, neighborhoodSlug }));

  const cents = (value: number | null | undefined) =>
    value === null || value === undefined ? null : Math.round(Number(value));

  return {
    count: row?.count ?? 0,
    minRentCents: cents(row?.min),
    medianRentCents: cents(row?.median),
    maxRentCents: cents(row?.max),
  };
});

export type AreaRentStats = Awaited<ReturnType<typeof getAreaRentStats>>;

/**
 * Published listings per city and per neighbourhood, in one grouped query: the area
 * links show them, and the sitemap lists only neighbourhoods that have any.
 */
export const getListingCountsByArea = cache(async () => {
  const rows = await db
    .select({
      citySlug: listings.citySlug,
      neighborhoodSlug: listings.neighborhoodSlug,
      value: count(),
    })
    .from(listings)
    .where(eq(listings.status, 'PUBLISHED'))
    .groupBy(listings.citySlug, listings.neighborhoodSlug);

  const cities = new Map<string, number>();
  const neighborhoods = new Map<string, number>();

  for (const row of rows) {
    cities.set(row.citySlug, (cities.get(row.citySlug) ?? 0) + row.value);

    if (row.neighborhoodSlug) {
      neighborhoods.set(areaKey(row.citySlug, row.neighborhoodSlug), row.value);
    }
  }

  return { cities, neighborhoods };
});

export function areaKey(citySlug: string, neighborhoodSlug: string) {
  return `${citySlug}/${neighborhoodSlug}`;
}

/**
 * People with a "room wanted" post for this area: those who named the neighbourhood,
 * plus those happy anywhere in the city (an empty list).
 */
export async function countRoomSeekers({ citySlug, neighborhoodSlug }: AreaRef) {
  const [row] = await db
    .select({ value: count() })
    .from(userProfiles)
    .innerJoin(user, eq(user.id, userProfiles.userId))
    .where(
      and(
        eq(userProfiles.lookingForRoom, true),
        eq(userProfiles.citySlug, citySlug),
        eq(user.banned, false),
        neighborhoodSlug
          ? or(
              sql`${userProfiles.wantedNeighborhoods} @> ${JSON.stringify([neighborhoodSlug])}::jsonb`,
              sql`${userProfiles.wantedNeighborhoods} = '[]'::jsonb`,
            )
          : undefined,
      ),
    );

  return row?.value ?? 0;
}
