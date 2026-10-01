import 'server-only';

import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lte,
  ne,
  or,
  sql,
} from 'drizzle-orm';

import { db } from '@/db';
import { favorites, listingImages, listings, user, userProfiles } from '@/db/schema';
import { approximate } from '@/lib/map';
import { ApiError } from '@/lib/server/api';

import type {
  CreateListingInput,
  ListingSort,
  ListListingsQuery,
  UpdateListingInput,
} from '../schemas';

type ListingRow = typeof listings.$inferSelect;
type ListingImageRow = typeof listingImages.$inferSelect;
type OwnerRow = Pick<typeof user.$inferSelect, 'id' | 'name' | 'image'>;

export type ListingDTO = ListingRow & {
  images: ListingImageRow[];
  owner: OwnerRow;
};

/**
 * The name and photo the listing page shows for its owner: the profile's, falling back to
 * the account's. Needs `userProfiles` left-joined on the owner.
 */
const publicOwnerColumns = {
  id: user.id,
  name: sql<string>`coalesce(${userProfiles.displayName}, ${user.name})`,
  image: sql<string | null>`coalesce(${userProfiles.avatarUrl}, ${user.image})`,
};

export async function listPublishedListings(filters: ListListingsQuery) {
  const where = buildPublishedListingWhere(filters);
  const offset = (filters.page - 1) * filters.perPage;

  const [rows, totalRows] = await Promise.all([
    db
      .select({ listing: listings, owner: publicOwnerColumns })
      .from(listings)
      .innerJoin(user, eq(listings.ownerId, user.id))
      .leftJoin(userProfiles, eq(userProfiles.userId, listings.ownerId))
      .where(where)
      .orderBy(...buildListingOrderBy(filters.sort))
      .limit(filters.perPage)
      .offset(offset),
    db.select({ value: count() }).from(listings).where(where),
  ]);

  const items = await attachImages(rows);

  return {
    items,
    page: filters.page,
    perPage: filters.perPage,
    total: totalRows[0]?.value ?? 0,
  };
}

export async function getPublishedListingById(id: string) {
  const [row] = await db
    .select({
      listing: listings,
      owner: {
        id: user.id,
        name: user.name,
        image: user.image,
      },
    })
    .from(listings)
    .innerJoin(user, eq(listings.ownerId, user.id))
    .where(and(eq(listings.id, id), eq(listings.status, 'PUBLISHED')))
    .limit(1);

  if (!row) {
    return null;
  }

  const [listing] = await attachImages([row]);

  return listing;
}

export async function createListing(ownerId: string, input: CreateListingInput) {
  assertStayRange(input.minStayMonths, input.maxStayMonths);
  const listingId = crypto.randomUUID();
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx.insert(listings).values({
      ...input,
      id: listingId,
      ownerId,
      currency: input.currency.toUpperCase(),
      publishedAt: input.status === 'PUBLISHED' ? now : undefined,
    });

    if (input.images.length > 0) {
      await tx.insert(listingImages).values(
        input.images.map((image, index) => ({
          id: crypto.randomUUID(),
          listingId,
          url: image.url,
          alt: image.alt,
          sortOrder: image.sortOrder ?? index,
        })),
      );
    }
  });

  return getOwnedListingOrThrow(listingId, ownerId);
}

export async function updateListing(
  listingId: string,
  ownerId: string,
  input: UpdateListingInput,
) {
  const existing = await getOwnedListingOrThrow(listingId, ownerId);
  const { images, ...listingInput } = input;
  assertStayRange(
    input.minStayMonths !== undefined ? input.minStayMonths : existing.minStayMonths,
    input.maxStayMonths !== undefined ? input.maxStayMonths : existing.maxStayMonths,
  );
  const now = new Date();
  const nextStatus = listingInput.status ?? existing.status;
  const shouldPublish =
    nextStatus === 'PUBLISHED' && existing.publishedAt === null;

  await db.transaction(async (tx) => {
    await tx
      .update(listings)
      .set({
        ...listingInput,
        currency: listingInput.currency?.toUpperCase(),
        publishedAt: shouldPublish ? now : existing.publishedAt,
        updatedAt: now,
      })
      .where(and(eq(listings.id, listingId), eq(listings.ownerId, ownerId)));

    if (images) {
      await tx.delete(listingImages).where(eq(listingImages.listingId, listingId));

      if (images.length > 0) {
        await tx.insert(listingImages).values(
          images.map((image, index) => ({
            id: crypto.randomUUID(),
            listingId,
            url: image.url,
            alt: image.alt,
            sortOrder: image.sortOrder ?? index,
          })),
        );
      }
    }
  });

  return getOwnedListingOrThrow(listingId, ownerId);
}

/** A 400 instead of the `listing_stay_order` constraint's 500. */
function assertStayRange(min: number | null | undefined, max: number | null | undefined) {
  if (min != null && max != null && min > max) {
    throw new ApiError(
      400,
      'INVALID_STAY_RANGE',
      'The minimum stay cannot be longer than the maximum stay.',
    );
  }
}

export async function archiveListing(listingId: string, ownerId: string) {
  await getOwnedListingOrThrow(listingId, ownerId);

  await db
    .update(listings)
    .set({
      status: 'ARCHIVED',
      updatedAt: new Date(),
    })
    .where(and(eq(listings.id, listingId), eq(listings.ownerId, ownerId)));
}

export async function getOwnedListingOrThrow(id: string, ownerId: string) {
  const [row] = await db
    .select({
      listing: listings,
      owner: {
        id: user.id,
        name: user.name,
        image: user.image,
      },
    })
    .from(listings)
    .innerJoin(user, eq(listings.ownerId, user.id))
    .where(and(eq(listings.id, id), eq(listings.ownerId, ownerId)))
    .limit(1);

  if (!row) {
    throw new ApiError(404, 'LISTING_NOT_FOUND', 'Listing was not found.');
  }

  const [listing] = await attachImages([row]);

  return listing;
}

export async function listSavedListings(userId: string) {
  const rows = await db
    .select({
      listing: listings,
      owner: {
        id: user.id,
        name: user.name,
        image: user.image,
      },
      savedAt: favorites.createdAt,
    })
    .from(favorites)
    .innerJoin(listings, eq(favorites.listingId, listings.id))
    .innerJoin(user, eq(listings.ownerId, user.id))
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt));

  const items = await attachImages(
    rows.map((row) => ({ listing: row.listing, owner: row.owner })),
  );

  const savedAtByListingId = new Map(
    rows.map((row) => [row.listing.id, row.savedAt]),
  );

  return items.map((item) => ({
    ...item,
    savedAt: savedAtByListingId.get(item.id) ?? null,
  }));
}

/** Published listing counts per city, for the home page city tiles. */
export async function countPublishedListingsByCity() {
  const rows = await db
    .select({ citySlug: listings.citySlug, value: count() })
    .from(listings)
    .where(eq(listings.status, 'PUBLISHED'))
    .groupBy(listings.citySlug);

  return new Map(rows.map((row) => [row.citySlug, row.value]));
}

/**
 * Published listing ids for the sitemap, newest first so a cap drops the oldest.
 * Ordering by `published_at` walks `listing_status_published_idx` instead of sorting.
 */
export async function listPublishedListingsForSitemap(limit: number) {
  return db
    .select({ id: listings.id, updatedAt: listings.updatedAt })
    .from(listings)
    .where(eq(listings.status, 'PUBLISHED'))
    .orderBy(desc(listings.publishedAt))
    .limit(limit);
}

/**
 * Which of the given listings the viewer has already saved.
 *
 * One query for a whole result page instead of a favourite lookup per card,
 * which is what keeps the search grid at a constant number of round trips.
 */
export async function getSavedListingIds(userId: string, listingIds: string[]) {
  if (listingIds.length === 0) {
    return new Set<string>();
  }

  const rows = await db
    .select({ listingId: favorites.listingId })
    .from(favorites)
    .where(
      and(eq(favorites.userId, userId), inArray(favorites.listingId, listingIds)),
    );

  return new Set(rows.map((row) => row.listingId));
}

/**
 * All listings owned by `ownerId`, any status, newest-first.
 * Used for the owner's /my-listings dashboard.
 */
export async function listOwnListings(ownerId: string) {
  const rows = await db
    .select({
      listing: listings,
      owner: {
        id: user.id,
        name: user.name,
        image: user.image,
      },
    })
    .from(listings)
    .innerJoin(user, eq(listings.ownerId, user.id))
    .where(eq(listings.ownerId, ownerId))
    .orderBy(desc(listings.updatedAt), desc(listings.createdAt));

  return attachImages(rows);
}

export async function listSimilarListings(listingId: string, limit = 6) {
  const source = await getPublishedListingById(listingId);

  if (!source) {
    throw new ApiError(404, 'LISTING_NOT_FOUND', 'Listing was not found.');
  }

  const conditions = [
    eq(listings.status, 'PUBLISHED'),
    eq(listings.citySlug, source.citySlug),
    eq(listings.propertyType, source.propertyType),
    ne(listings.id, listingId),
  ];

  if (source.neighborhoodSlug) {
    conditions.push(eq(listings.neighborhoodSlug, source.neighborhoodSlug));
  }

  const rows = await db
    .select({
      listing: listings,
      owner: {
        id: user.id,
        name: user.name,
        image: user.image,
      },
    })
    .from(listings)
    .innerJoin(user, eq(listings.ownerId, user.id))
    .where(and(...conditions))
    .orderBy(desc(listings.publishedAt), desc(listings.createdAt))
    .limit(limit);

  return attachImages(rows);
}

async function attachImages(
  rows: Array<{ listing: ListingRow; owner: OwnerRow }>,
): Promise<ListingDTO[]> {
  const listingIds = rows.map((row) => row.listing.id);

  if (listingIds.length === 0) {
    return [];
  }

  const images = await db
    .select()
    .from(listingImages)
    .where(inArray(listingImages.listingId, listingIds))
    .orderBy(asc(listingImages.sortOrder), asc(listingImages.createdAt));

  const imagesByListingId = new Map<string, ListingImageRow[]>();

  for (const image of images) {
    const listingImagesForId = imagesByListingId.get(image.listingId) ?? [];
    listingImagesForId.push(image);
    imagesByListingId.set(image.listingId, listingImagesForId);
  }

  return rows.map((row) => ({
    ...row.listing,
    owner: row.owner,
    images: imagesByListingId.get(row.listing.id) ?? [],
  }));
}

/**
 * `id` is the final tiebreaker on every sort so pagination is deterministic —
 * without it Postgres may return the same row on two different pages.
 */
function buildListingOrderBy(sort: ListingSort) {
  switch (sort) {
    case 'price-asc':
      return [asc(listings.monthlyRentCents), asc(listings.id)];
    case 'price-desc':
      return [desc(listings.monthlyRentCents), asc(listings.id)];
    default:
      return [desc(listings.publishedAt), desc(listings.createdAt), asc(listings.id)];
  }
}

/** Past this many pins a map is unreadable: the answer is a narrower search, not more pins. */
export const MAP_MARKER_LIMIT = 500;

/**
 * The search results as map markers: the same filters and order as the list, only the
 * fields a marker needs, and coordinates rounded (`approximate`) so the exact point
 * never leaves the server. `total` counts every match, pinned or not.
 */
export async function listPublishedListingsForMap(filters: ListListingsQuery) {
  const where = buildPublishedListingWhere(filters);

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        id: listings.id,
        title: listings.title,
        monthlyRentCents: listings.monthlyRentCents,
        currency: listings.currency,
        citySlug: listings.citySlug,
        neighborhoodSlug: listings.neighborhoodSlug,
        latitude: listings.latitude,
        longitude: listings.longitude,
      })
      .from(listings)
      .where(and(where, isNotNull(listings.latitude), isNotNull(listings.longitude)))
      .orderBy(...buildListingOrderBy(filters.sort))
      .limit(MAP_MARKER_LIMIT),
    db.select({ value: count() }).from(listings).where(where),
  ]);

  return {
    items: rows.map(({ latitude, longitude, ...row }) => ({
      ...row,
      latitude: approximate(latitude!),
      longitude: approximate(longitude!),
    })),
    total: totalRows[0]?.value ?? 0,
  };
}

/** The `where` for a listing search; area pages reuse it so their counts match the search. */
export function buildPublishedListingWhere(filters: ListListingsQuery) {
  const conditions = [eq(listings.status, 'PUBLISHED')];

  if (filters.citySlug) {
    conditions.push(eq(listings.citySlug, filters.citySlug));
  }

  if (filters.neighborhoodSlug?.length) {
    conditions.push(inArray(listings.neighborhoodSlug, filters.neighborhoodSlug));
  }

  if (filters.propertyType?.length) {
    conditions.push(inArray(listings.propertyType, filters.propertyType));
  }

  if (filters.roommatePreference) {
    conditions.push(eq(listings.roommatePreference, filters.roommatePreference));
  }

  if (filters.roomType?.length) {
    conditions.push(inArray(listings.roomType, filters.roomType));
  }

  if (filters.stayMonths !== undefined) {
    // A missing bound means the owner did not set one, so it admits any stay.
    conditions.push(
      or(isNull(listings.minStayMonths), lte(listings.minStayMonths, filters.stayMonths))!,
      or(isNull(listings.maxStayMonths), gte(listings.maxStayMonths, filters.stayMonths))!,
    );
  }

  if (filters.minRentCents !== undefined) {
    conditions.push(gte(listings.monthlyRentCents, filters.minRentCents));
  }

  if (filters.maxRentCents !== undefined) {
    conditions.push(lte(listings.monthlyRentCents, filters.maxRentCents));
  }

  if (filters.bedroomCount !== undefined) {
    conditions.push(gte(listings.bedroomCount, filters.bedroomCount));
  }

  if (filters.maxOccupants !== undefined) {
    conditions.push(gte(listings.maxOccupants, filters.maxOccupants));
  }

  if (filters.availableFrom) {
    conditions.push(
      or(
        isNull(listings.availableFrom),
        lte(listings.availableFrom, filters.availableFrom),
      )!,
    );
  }

  if (filters.isVerified !== undefined) {
    conditions.push(eq(listings.isVerified, filters.isVerified));
  }

  if (filters.isFurnished !== undefined) {
    conditions.push(eq(listings.isFurnished, filters.isFurnished));
  }

  if (filters.internetIncluded !== undefined) {
    conditions.push(eq(listings.internetIncluded, filters.internetIncluded));
  }

  if (filters.utilitiesIncluded !== undefined) {
    conditions.push(eq(listings.utilitiesIncluded, filters.utilitiesIncluded));
  }

  if (filters.petsAllowed !== undefined) {
    conditions.push(eq(listings.petsAllowed, filters.petsAllowed));
  }

  if (filters.nearMetro !== undefined) {
    conditions.push(eq(listings.nearMetro, filters.nearMetro));
  }

  if (filters.roommateFriendly !== undefined) {
    conditions.push(eq(listings.roommateFriendly, filters.roommateFriendly));
  }

  if (filters.privateBathroom !== undefined) {
    conditions.push(eq(listings.privateBathroom, filters.privateBathroom));
  }

  if (filters.couplesAllowed !== undefined) {
    conditions.push(eq(listings.couplesAllowed, filters.couplesAllowed));
  }

  if (filters.smokingAllowed !== undefined) {
    conditions.push(eq(listings.smokingAllowed, filters.smokingAllowed));
  }

  if (filters.q) {
    conditions.push(
      or(
        ilike(listings.title, `%${filters.q}%`),
        ilike(listings.description, `%${filters.q}%`),
      )!,
    );
  }

  return and(...conditions);
}
