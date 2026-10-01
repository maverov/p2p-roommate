import 'server-only';

import { and, count, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';

import { db } from '@/db';
import { listingImages, listings, savedProfiles, user, userProfiles } from '@/db/schema';
import { assertNotBlocked } from '@/features/blocks/server/repository';
import { toCompatibilityProfile } from '@/features/compatibility/score';
import { compatibilityColumns } from '@/features/compatibility/server/repository';
import { getUserReviewSummary } from '@/features/reviews/server/repository';
import { isCityId, isNeighborhoodInCity } from '@/lib/areas';
import type { ProfileTrait } from '@/lib/labels';
import { ApiError } from '@/lib/server/api';

import { parseProfileTraits, parseRoommatePreferences, type UpdateProfileInput } from '../schemas';

export type PublicProfilesFilters = {
  citySlug?: string;
  q?: string;
  /** Only published "room wanted" posts. */
  lookingForRoom?: boolean;
  /** Profiles carrying every one of these tags. */
  traits?: ProfileTrait[];
  page: number;
  perPage: number;
};

/**
 * Paginated list of public profiles for the find-roommate page.
 * Only returns users who have a `user_profile` row so anonymous
 * accounts (no bio, no city) stay invisible.
 */
export async function listPublicProfiles(filters: PublicProfilesFilters) {
  const conditions: ReturnType<typeof eq>[] = [];

  if (filters.citySlug) {
    conditions.push(eq(userProfiles.citySlug, filters.citySlug));
  }

  if (filters.lookingForRoom) {
    conditions.push(eq(userProfiles.lookingForRoom, true));
  }

  if (filters.traits?.length) {
    conditions.push(sql`${userProfiles.traits} @> ${JSON.stringify(filters.traits)}::jsonb`);
  }

  if (filters.q) {
    conditions.push(
      or(
        ilike(userProfiles.displayName, `%${filters.q}%`),
        ilike(user.name, `%${filters.q}%`),
        ilike(userProfiles.bio, `%${filters.q}%`),
      ) as ReturnType<typeof eq>,
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const offset = (filters.page - 1) * filters.perPage;

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        profileUserId: user.id,
        name: userProfiles.displayName,
        image: userProfiles.avatarUrl,
        bio: userProfiles.bio,
        joinedAt: userProfiles.joinedAt,
        isVerified: userProfiles.isVerified,
        ...compatibilityColumns,
      })
      .from(userProfiles)
      .innerJoin(user, eq(user.id, userProfiles.userId))
      .where(where)
      .orderBy(desc(userProfiles.joinedAt))
      .limit(filters.perPage)
      .offset(offset),
    db
      .select({ value: count() })
      .from(userProfiles)
      .innerJoin(user, eq(user.id, userProfiles.userId))
      .where(where),
  ]);

  return {
    items: rows.map((row) => {
      const compatibility = toCompatibilityProfile(row);

      return {
        profileUserId: row.profileUserId,
        name: row.name,
        image: row.image,
        citySlug: row.citySlug,
        bio: row.bio,
        joinedAt: row.joinedAt,
        isVerified: row.isVerified,
        traits: compatibility.traits,
        /** The published "room wanted" post, if any. */
        roomWanted: compatibility.lookingForRoom
          ? {
              budgetMinCents: compatibility.preferences.budgetMinCents,
              budgetMaxCents: compatibility.preferences.budgetMaxCents,
              moveInDate: compatibility.moveInDate,
              stayMonths: compatibility.stayMonths,
              wantedNeighborhoods: compatibility.wantedNeighborhoods,
            }
          : null,
        /** For scoring against the viewer on the server; not rendered as is. */
        compatibility,
      };
    }),
    page: filters.page,
    perPage: filters.perPage,
    total: totalRows[0]?.value ?? 0,
  };
}

export async function getPublicProfile(userId: string) {
  const [profile] = await db
    .select({
      user: {
        id: user.id,
        name: user.name,
        image: user.image,
      },
      profile: userProfiles,
    })
    .from(user)
    .leftJoin(userProfiles, eq(user.id, userProfiles.userId))
    .where(eq(user.id, userId))
    .limit(1);

  if (!profile) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User was not found.');
  }

  const [activeListingCountRows, reviewSummary] = await Promise.all([
    db
      .select({ value: count() })
      .from(listings)
      .where(and(eq(listings.ownerId, userId), eq(listings.status, 'PUBLISHED'))),
    getUserReviewSummary(userId),
  ]);

  return {
    userId: profile.user.id,
    displayName: profile.profile?.displayName ?? profile.user.name,
    avatarUrl: profile.profile?.avatarUrl ?? profile.user.image,
    bio: profile.profile?.bio ?? null,
    citySlug: profile.profile?.citySlug ?? null,
    neighborhoodSlug: profile.profile?.neighborhoodSlug ?? null,
    isVerified: profile.profile?.isVerified ?? false,
    emailVerified: profile.profile?.emailVerified ?? false,
    phoneVerified: profile.profile?.phoneVerified ?? false,
    identityVerified: profile.profile?.identityVerified ?? false,
    traits: parseProfileTraits(profile.profile?.traits),
    languages: profile.profile?.languages ?? [],
    roommatePreferences: profile.profile?.roommatePreferences ?? {},
    lookingForRoom: profile.profile?.lookingForRoom ?? false,
    moveInDate: profile.profile?.moveInDate ?? null,
    stayMonths: profile.profile?.stayMonths ?? null,
    wantedNeighborhoods: profile.profile?.wantedNeighborhoods ?? [],
    joinedAt: profile.profile?.joinedAt ?? null,
    activeListingCount: activeListingCountRows[0]?.value ?? 0,
    reviews: reviewSummary,
  };
}

export async function updateOwnProfile(userId: string, input: UpdateProfileInput) {
  const displayName = input.displayName ?? (await getFallbackDisplayName(userId));
  const wantedNeighborhoods = await resolveWantedNeighborhoods(userId, input);
  const changes = {
    ...input,
    ...(wantedNeighborhoods !== undefined && { wantedNeighborhoods }),
  };
  const now = new Date();

  const [profile] = await db
    .insert(userProfiles)
    .values({
      userId,
      displayName,
      // The badge copy starts from the account: an address confirmed before the profile
      // existed (email sign-up, or Google) would otherwise never show as verified.
      emailVerified: sql<boolean>`(SELECT ${user.emailVerified} FROM ${user} WHERE ${user.id} = ${userId})`,
      ...changes,
    })
    .onConflictDoUpdate({
      target: userProfiles.userId,
      // `input` carries `displayName` only when the caller sent one. Setting the
      // fallback here too would reset a custom display name on every partial update.
      set: {
        ...changes,
        updatedAt: now,
      },
    })
    .returning();

  return profile;
}

/**
 * Wanted neighbourhoods only mean something inside the profile's city, which this update
 * may or may not change. A new list is checked against the city the update leaves in
 * place; a city change without a new list drops the old city's neighbourhoods.
 * `undefined` means "leave the column alone".
 */
async function resolveWantedNeighborhoods(
  userId: string,
  input: UpdateProfileInput,
): Promise<string[] | undefined> {
  if (input.wantedNeighborhoods === undefined && input.citySlug === undefined) {
    return undefined;
  }

  const [existing] = await db
    .select({
      citySlug: userProfiles.citySlug,
      wantedNeighborhoods: userProfiles.wantedNeighborhoods,
    })
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  const citySlug = input.citySlug !== undefined ? input.citySlug : (existing?.citySlug ?? null);
  const requested = input.wantedNeighborhoods;

  if (!isCityId(citySlug)) {
    if (requested?.length) {
      throw new ApiError(400, 'INVALID_NEIGHBORHOOD', 'Choose a city before its neighbourhoods.');
    }

    return [];
  }

  if (requested) {
    const unknown = requested.filter((slug) => !isNeighborhoodInCity(citySlug, slug));

    if (unknown.length > 0) {
      throw new ApiError(400, 'INVALID_NEIGHBORHOOD', 'Unknown neighbourhood for this city.', {
        neighborhoods: unknown,
      });
    }

    return [...new Set(requested)];
  }

  return (existing?.wantedNeighborhoods ?? []).filter((slug) =>
    isNeighborhoodInCity(citySlug, slug),
  );
}

/** The signed-in user's own profile for the settings form, including private fields. */
export async function getEditableProfile(userId: string) {
  const [row] = await db
    .select({
      name: user.name,
      email: user.email,
      locale: user.locale,
      profile: userProfiles,
    })
    .from(user)
    .leftJoin(userProfiles, eq(user.id, userProfiles.userId))
    .where(eq(user.id, userId))
    .limit(1);

  if (!row) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User was not found.');
  }

  return {
    email: row.email,
    locale: row.locale,
    displayName: row.profile?.displayName ?? row.name,
    bio: row.profile?.bio ?? null,
    phoneNumber: row.profile?.phoneNumber ?? null,
    citySlug: row.profile?.citySlug ?? null,
    neighborhoodSlug: row.profile?.neighborhoodSlug ?? null,
    avatarUrl: row.profile?.avatarUrl ?? null,
    publicContactAllowed: row.profile?.publicContactAllowed ?? false,
    traits: parseProfileTraits(row.profile?.traits),
    languages: row.profile?.languages ?? [],
    roommatePreferences: row.profile?.roommatePreferences ?? {},
    lookingForRoom: row.profile?.lookingForRoom ?? false,
    moveInDate: row.profile?.moveInDate ?? null,
    stayMonths: row.profile?.stayMonths ?? null,
    wantedNeighborhoods: row.profile?.wantedNeighborhoods ?? [],
  };
}

export type EditableProfile = Awaited<ReturnType<typeof getEditableProfile>>;

export async function listProfileListings(profileUserId: string) {
  const rows = await db
    .select({
      listing: listings,
    })
    .from(listings)
    .where(and(eq(listings.ownerId, profileUserId), eq(listings.status, 'PUBLISHED')))
    .orderBy(desc(listings.publishedAt), desc(listings.createdAt));

  const listingIds = rows.map((row) => row.listing.id);

  if (listingIds.length === 0) {
    return [];
  }

  const images = await db
    .select()
    .from(listingImages)
    .where(inArray(listingImages.listingId, listingIds));

  const imagesByListingId = new Map<string, typeof images>();

  for (const image of images) {
    const imagesForListing = imagesByListingId.get(image.listingId) ?? [];
    imagesForListing.push(image);
    imagesByListingId.set(image.listingId, imagesForListing);
  }

  return rows.map((row) => ({
    ...row.listing,
    images: imagesByListingId.get(row.listing.id) ?? [],
  }));
}

export async function saveProfile(userId: string, profileUserId: string) {
  if (userId === profileUserId) {
    throw new ApiError(400, 'CANNOT_SAVE_SELF', 'You cannot save your own profile.');
  }

  await getPublicProfile(profileUserId);

  await db.insert(savedProfiles).values({ userId, profileUserId }).onConflictDoNothing();

  return { saved: true };
}

export async function unsaveProfile(userId: string, profileUserId: string) {
  await db
    .delete(savedProfiles)
    .where(and(eq(savedProfiles.userId, userId), eq(savedProfiles.profileUserId, profileUserId)));
}

/** Whether the viewer already saved this profile — drives the header button. */
export async function isProfileSaved(userId: string, profileUserId: string) {
  const [row] = await db
    .select({ profileUserId: savedProfiles.profileUserId })
    .from(savedProfiles)
    .where(and(eq(savedProfiles.userId, userId), eq(savedProfiles.profileUserId, profileUserId)))
    .limit(1);

  return Boolean(row);
}

export async function listSavedProfiles(userId: string) {
  return db
    .select({
      profileUserId: savedProfiles.profileUserId,
      savedAt: savedProfiles.createdAt,
      name: user.name,
      image: user.image,
      profile: userProfiles,
    })
    .from(savedProfiles)
    .innerJoin(user, eq(savedProfiles.profileUserId, user.id))
    .leftJoin(userProfiles, eq(savedProfiles.profileUserId, userProfiles.userId))
    .where(eq(savedProfiles.userId, userId))
    .orderBy(desc(savedProfiles.createdAt));
}

export async function getProfilePhoneForViewer(viewerId: string, profileUserId: string) {
  const [profile] = await db
    .select({
      phoneNumber: userProfiles.phoneNumber,
      publicContactAllowed: userProfiles.publicContactAllowed,
    })
    .from(userProfiles)
    .where(eq(userProfiles.userId, profileUserId))
    .limit(1);

  if (!profile?.phoneNumber) {
    throw new ApiError(404, 'PHONE_NOT_FOUND', 'Phone number is not available.');
  }

  if (viewerId !== profileUserId) {
    if (!profile.publicContactAllowed) {
      throw new ApiError(403, 'PHONE_PRIVATE', 'Phone number is private.');
    }

    await assertNotBlocked(viewerId, profileUserId);
  }

  return { phoneNumber: profile.phoneNumber };
}

async function getFallbackDisplayName(userId: string) {
  const [existingUser] = await db
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!existingUser) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User was not found.');
  }

  return existingUser.name;
}
