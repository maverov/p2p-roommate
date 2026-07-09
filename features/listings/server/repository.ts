import 'server-only';

import { and, asc, count, desc, eq, gte, ilike, inArray, lte, ne, or } from 'drizzle-orm';

import { db } from '@/db';
import { favorites, listingImages, listings, user } from '@/db/schema';
import { ApiError } from '@/lib/server/api';

import type {
  CreateListingInput,
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

export async function listPublishedListings(filters: ListListingsQuery) {
  const where = buildPublishedListingWhere(filters);
  const offset = (filters.page - 1) * filters.perPage;

  const [rows, totalRows] = await Promise.all([
    db
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
      .where(where)
      .orderBy(desc(listings.publishedAt), desc(listings.createdAt))
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

function buildPublishedListingWhere(filters: ListListingsQuery) {
  const conditions = [eq(listings.status, 'PUBLISHED')];

  if (filters.citySlug) {
    conditions.push(eq(listings.citySlug, filters.citySlug));
  }

  if (filters.neighborhoodSlug) {
    conditions.push(eq(listings.neighborhoodSlug, filters.neighborhoodSlug));
  }

  if (filters.propertyType) {
    conditions.push(eq(listings.propertyType, filters.propertyType));
  }

  if (filters.roommatePreference) {
    conditions.push(eq(listings.roommatePreference, filters.roommatePreference));
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
    conditions.push(gte(listings.availableFrom, filters.availableFrom));
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
