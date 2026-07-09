import 'server-only';

import { and, count, desc, eq, inArray } from 'drizzle-orm';

import { db } from '@/db';
import {
  listingImages,
  listings,
  savedProfiles,
  user,
  userProfiles,
} from '@/db/schema';
import { ApiError } from '@/lib/server/api';
import { getUserReviewSummary } from '@/features/reviews/server/repository';

import type { UpdateProfileInput } from '../schemas';

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
    responseTimeMinutes: profile.profile?.responseTimeMinutes ?? 120,
    responseRate: profile.profile?.responseRate ?? 0,
    successfulRentals: profile.profile?.successfulRentals ?? 0,
    traits: profile.profile?.traits ?? [],
    languages: profile.profile?.languages ?? [],
    roommatePreferences: profile.profile?.roommatePreferences ?? {},
    joinedAt: profile.profile?.joinedAt ?? null,
    activeListingCount: activeListingCountRows[0]?.value ?? 0,
    reviews: reviewSummary,
  };
}

export async function updateOwnProfile(userId: string, input: UpdateProfileInput) {
  const displayName = input.displayName ?? (await getFallbackDisplayName(userId));
  const now = new Date();

  const [profile] = await db
    .insert(userProfiles)
    .values({
      userId,
      displayName,
      ...input,
    })
    .onConflictDoUpdate({
      target: userProfiles.userId,
      set: {
        ...input,
        displayName,
        updatedAt: now,
      },
    })
    .returning();

  return profile;
}

export async function listProfileListings(profileUserId: string) {
  const rows = await db
    .select({
      listing: listings,
    })
    .from(listings)
    .where(
      and(eq(listings.ownerId, profileUserId), eq(listings.status, 'PUBLISHED')),
    )
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

  await db
    .insert(savedProfiles)
    .values({ userId, profileUserId })
    .onConflictDoNothing();

  return { saved: true };
}

export async function unsaveProfile(userId: string, profileUserId: string) {
  await db
    .delete(savedProfiles)
    .where(
      and(
        eq(savedProfiles.userId, userId),
        eq(savedProfiles.profileUserId, profileUserId),
      ),
    );
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

export async function getProfilePhoneForViewer(
  viewerId: string,
  profileUserId: string,
) {
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

  if (!profile.publicContactAllowed && viewerId !== profileUserId) {
    throw new ApiError(403, 'PHONE_PRIVATE', 'Phone number is private.');
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
