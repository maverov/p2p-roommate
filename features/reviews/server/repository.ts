import 'server-only';

import { and, avg, count, desc, eq, or } from 'drizzle-orm';

import { db } from '@/db';
import { listings, reviews, user, viewingRequests } from '@/db/schema';
import { ApiError } from '@/lib/server/api';

import type { CreateReviewInput, ListReviewsQuery } from '../schemas';

export async function createReview(reviewerId: string, input: CreateReviewInput) {
  let reviewerRole: 'TENANT' | 'OWNER';

  if (input.targetType === 'USER') {
    if (input.targetUserId === reviewerId) {
      throw new ApiError(400, 'CANNOT_REVIEW_SELF', 'You cannot review yourself.');
    }

    await assertUserExists(input.targetUserId);
    reviewerRole = await getUserReviewRoleOrThrow(
      reviewerId,
      input.targetUserId,
    );
    await assertReviewDoesNotExist(
      reviewerId,
      input.targetType,
      input.targetUserId,
    );
  } else {
    await assertListingExists(input.listingId);
    await assertAcceptedListingViewingOrThrow(reviewerId, input.listingId);
    reviewerRole = 'TENANT';
    await assertReviewDoesNotExist(
      reviewerId,
      input.targetType,
      input.listingId,
    );
  }

  try {
    const [review] = await db
      .insert(reviews)
      .values({
        id: crypto.randomUUID(),
        reviewerId,
        targetType: input.targetType,
        targetUserId:
          input.targetType === 'USER' ? input.targetUserId : undefined,
        listingId:
          input.targetType === 'LISTING' ? input.listingId : undefined,
        reviewerRole,
        rating: input.rating,
        body: input.body,
      })
      .returning();

    return review;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ApiError(
        409,
        'REVIEW_ALREADY_EXISTS',
        'You have already reviewed this target.',
      );
    }

    throw error;
  }
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

async function assertAcceptedListingViewingOrThrow(
  reviewerId: string,
  listingId: string,
) {
  const [viewingRequest] = await db
    .select({ id: viewingRequests.id })
    .from(viewingRequests)
    .where(
      and(
        eq(viewingRequests.listingId, listingId),
        eq(viewingRequests.requesterId, reviewerId),
        eq(viewingRequests.status, 'ACCEPTED'),
      ),
    )
    .limit(1);

  if (!viewingRequest) {
    throw new ApiError(
      403,
      'REVIEW_NOT_ALLOWED',
      'You can review a listing only after an accepted viewing request.',
    );
  }
}

async function getUserReviewRoleOrThrow(
  reviewerId: string,
  targetUserId: string,
): Promise<'TENANT' | 'OWNER'> {
  const [viewingRequest] = await db
    .select({
      requesterId: viewingRequests.requesterId,
      ownerId: viewingRequests.ownerId,
    })
    .from(viewingRequests)
    .where(
      and(
        eq(viewingRequests.status, 'ACCEPTED'),
        or(
          and(
            eq(viewingRequests.requesterId, reviewerId),
            eq(viewingRequests.ownerId, targetUserId),
          ),
          and(
            eq(viewingRequests.ownerId, reviewerId),
            eq(viewingRequests.requesterId, targetUserId),
          ),
        ),
      ),
    )
    .limit(1);

  if (!viewingRequest) {
    throw new ApiError(
      403,
      'REVIEW_NOT_ALLOWED',
      'You can review a user only after an accepted viewing request together.',
    );
  }

  return viewingRequest.requesterId === reviewerId ? 'TENANT' : 'OWNER';
}

async function assertReviewDoesNotExist(
  reviewerId: string,
  targetType: 'LISTING' | 'USER',
  targetId: string,
) {
  const targetWhere =
    targetType === 'LISTING'
      ? eq(reviews.listingId, targetId)
      : eq(reviews.targetUserId, targetId);

  const [existingReview] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(
      and(
        eq(reviews.reviewerId, reviewerId),
        eq(reviews.targetType, targetType),
        targetWhere,
      ),
    )
    .limit(1);

  if (existingReview) {
    throw new ApiError(
      409,
      'REVIEW_ALREADY_EXISTS',
      'You have already reviewed this target.',
    );
  }
}

function isUniqueViolation(error: unknown): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505'
  );
}
