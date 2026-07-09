import 'server-only';

import { and, avg, count, desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { listings, reviews, user } from '@/db/schema';
import { ApiError } from '@/lib/server/api';

import type { CreateReviewInput, ListReviewsQuery } from '../schemas';

export async function createReview(reviewerId: string, input: CreateReviewInput) {
  if (input.targetType === 'USER') {
    if (input.targetUserId === reviewerId) {
      throw new ApiError(400, 'CANNOT_REVIEW_SELF', 'You cannot review yourself.');
    }

    await assertUserExists(input.targetUserId);
  }

  if (input.targetType === 'LISTING') {
    await assertListingExists(input.listingId);
  }

  const [review] = await db
    .insert(reviews)
    .values({
      id: crypto.randomUUID(),
      reviewerId,
      targetType: input.targetType,
      targetUserId: input.targetUserId,
      listingId: input.listingId,
      reviewerRole: input.reviewerRole,
      rating: input.rating,
      body: input.body,
    })
    .returning();

  return review;
}

export async function listUserReviews(userId: string, query: ListReviewsQuery) {
  const offset = (query.page - 1) * query.perPage;
  const where = and(
    eq(reviews.targetType, 'USER'),
    eq(reviews.targetUserId, userId),
    eq(reviews.isPublished, true),
  );

  const [items, totalRows, summary] = await Promise.all([
    db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        body: reviews.body,
        reviewerRole: reviews.reviewerRole,
        createdAt: reviews.createdAt,
        reviewer: {
          id: user.id,
          name: user.name,
          image: user.image,
        },
      })
      .from(reviews)
      .innerJoin(user, eq(reviews.reviewerId, user.id))
      .where(where)
      .orderBy(desc(reviews.createdAt))
      .limit(query.perPage)
      .offset(offset),
    db.select({ value: count() }).from(reviews).where(where),
    getUserReviewSummary(userId),
  ]);

  return {
    items,
    page: query.page,
    perPage: query.perPage,
    total: totalRows[0]?.value ?? 0,
    summary,
  };
}

export async function listListingReviews(
  listingId: string,
  query: ListReviewsQuery,
) {
  const offset = (query.page - 1) * query.perPage;
  const where = and(
    eq(reviews.targetType, 'LISTING'),
    eq(reviews.listingId, listingId),
    eq(reviews.isPublished, true),
  );

  const [items, totalRows, summary] = await Promise.all([
    db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        body: reviews.body,
        reviewerRole: reviews.reviewerRole,
        createdAt: reviews.createdAt,
        reviewer: {
          id: user.id,
          name: user.name,
          image: user.image,
        },
      })
      .from(reviews)
      .innerJoin(user, eq(reviews.reviewerId, user.id))
      .where(where)
      .orderBy(desc(reviews.createdAt))
      .limit(query.perPage)
      .offset(offset),
    db.select({ value: count() }).from(reviews).where(where),
    getListingReviewSummary(listingId),
  ]);

  return {
    items,
    page: query.page,
    perPage: query.perPage,
    total: totalRows[0]?.value ?? 0,
    summary,
  };
}

export async function getUserReviewSummary(userId: string) {
  const [summary] = await db
    .select({
      averageRating: avg(reviews.rating),
      reviewCount: count(),
    })
    .from(reviews)
    .where(
      and(
        eq(reviews.targetType, 'USER'),
        eq(reviews.targetUserId, userId),
        eq(reviews.isPublished, true),
      ),
    );

  return normalizeSummary(summary);
}

export async function getListingReviewSummary(listingId: string) {
  const [summary] = await db
    .select({
      averageRating: avg(reviews.rating),
      reviewCount: count(),
    })
    .from(reviews)
    .where(
      and(
        eq(reviews.targetType, 'LISTING'),
        eq(reviews.listingId, listingId),
        eq(reviews.isPublished, true),
      ),
    );

  return normalizeSummary(summary);
}

function normalizeSummary(summary?: {
  averageRating: string | null;
  reviewCount: number;
}) {
  const averageRating = summary?.averageRating
    ? Number(Number(summary.averageRating).toFixed(1))
    : null;

  return {
    averageRating,
    reviewCount: summary?.reviewCount ?? 0,
  };
}

async function assertUserExists(userId?: string) {
  const [existingUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, userId ?? ''))
    .limit(1);

  if (!existingUser) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User was not found.');
  }
}

async function assertListingExists(listingId?: string) {
  const [listing] = await db
    .select({ id: listings.id })
    .from(listings)
    .where(eq(listings.id, listingId ?? ''))
    .limit(1);

  if (!listing) {
    throw new ApiError(404, 'LISTING_NOT_FOUND', 'Listing was not found.');
  }
}
