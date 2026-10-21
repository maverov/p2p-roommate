import 'server-only';

import { and, avg, count, desc, eq, sql } from 'drizzle-orm';

import { alias } from 'drizzle-orm/pg-core';

import { db } from '@/db';
import {
  conversationParticipants,
  conversations,
  listings,
  messages,
  reviews,
  user,
} from '@/db/schema';
import { ApiError } from '@/lib/server/api';
import { publicUserCondition } from '@/lib/server/public-user';
import { assertNotBlocked } from '@/features/blocks/server/repository';

import type { CreateReviewInput, ListReviewsQuery } from '../schemas';

export async function createReview(reviewerId: string, input: CreateReviewInput) {
  await assertReviewAllowed(reviewerId, input);

  try {
    const [review] = await db
      .insert(reviews)
      .values({
        id: crypto.randomUUID(),
        reviewerId,
        targetType: input.targetType,
        targetUserId: input.targetType === 'USER' ? input.targetUserId : undefined,
        listingId: input.targetType === 'LISTING' ? input.listingId : undefined,
        reviewerRole: 'MEMBER',
        rating: input.rating,
        body: input.body,
      })
      .returning();

    return review;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ApiError(409, 'REVIEW_ALREADY_EXISTS', 'You have already reviewed this target.');
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

export async function listListingReviews(listingId: string, query: ListReviewsQuery) {
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

function normalizeSummary(summary?: { averageRating: string | null; reviewCount: number }) {
  const averageRating = summary?.averageRating
    ? Number(Number(summary.averageRating).toFixed(1))
    : null;

  return {
    averageRating,
    reviewCount: summary?.reviewCount ?? 0,
  };
}

export type ReviewTarget =
  { targetType: 'LISTING'; listingId: string } | { targetType: 'USER'; targetUserId: string };

/** The same eligibility check powers the page action and the write endpoint. */
export async function canReview(reviewerId: string, target: ReviewTarget) {
  try {
    await assertReviewAllowed(reviewerId, target);
    return true;
  } catch (error) {
    if (error instanceof ApiError && [400, 403, 404, 409].includes(error.status)) return false;
    throw error;
  }
}

async function assertReviewAllowed(reviewerId: string, target: ReviewTarget) {
  let otherUserId: string;
  if (target.targetType === 'USER') {
    otherUserId = target.targetUserId;
    const [person] = await db
      .select({ id: user.id })
      .from(user)
      .where(and(eq(user.id, otherUserId), publicUserCondition()))
      .limit(1);
    if (!person) throw new ApiError(404, 'USER_NOT_FOUND', 'User was not found.');
  } else {
    const [listing] = await db
      .select({ ownerId: listings.ownerId })
      .from(listings)
      .innerJoin(user, eq(user.id, listings.ownerId))
      .where(
        and(
          eq(listings.id, target.listingId),
          eq(listings.status, 'PUBLISHED'),
          publicUserCondition(),
        ),
      )
      .limit(1);
    if (!listing) throw new ApiError(404, 'LISTING_NOT_FOUND', 'Listing was not found.');
    otherUserId = listing.ownerId;
  }
  if (reviewerId === otherUserId) {
    throw new ApiError(
      400,
      'CANNOT_REVIEW_SELF',
      'You cannot review yourself or your own listing.',
    );
  }
  await assertNotBlocked(reviewerId, otherUserId);
  if (
    !(await hasMessageExchange(
      reviewerId,
      otherUserId,
      target.targetType === 'LISTING' ? target.listingId : undefined,
    ))
  ) {
    throw new ApiError(
      403,
      'REVIEW_NOT_ALLOWED',
      'Both people must have sent messages in the same conversation before a review.',
    );
  }
  await assertReviewDoesNotExist(
    reviewerId,
    target.targetType,
    target.targetType === 'LISTING' ? target.listingId : target.targetUserId,
  );
}

/** A one-sided enquiry does not qualify. Listing reviews require that listing's thread. */
export async function hasMessageExchange(
  reviewerId: string,
  otherUserId: string,
  listingId?: string,
) {
  const reviewer = alias(conversationParticipants, 'reviewer_participant');
  const recipient = alias(conversationParticipants, 'recipient_participant');
  const [conversation] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .innerJoin(
      reviewer,
      and(eq(reviewer.conversationId, conversations.id), eq(reviewer.userId, reviewerId)),
    )
    .innerJoin(
      recipient,
      and(eq(recipient.conversationId, conversations.id), eq(recipient.userId, otherUserId)),
    )
    .where(
      and(
        listingId ? eq(conversations.listingId, listingId) : undefined,
        sql`exists (select 1 from ${messages} where ${messages.conversationId} = ${conversations.id} and ${messages.senderId} = ${reviewerId})`,
        sql`exists (select 1 from ${messages} where ${messages.conversationId} = ${conversations.id} and ${messages.senderId} = ${otherUserId})`,
      ),
    )
    .limit(1);
  return Boolean(conversation);
}

async function assertReviewDoesNotExist(
  reviewerId: string,
  targetType: 'LISTING' | 'USER',
  targetId: string,
) {
  const targetWhere =
    targetType === 'LISTING' ? eq(reviews.listingId, targetId) : eq(reviews.targetUserId, targetId);

  const [existingReview] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.reviewerId, reviewerId), eq(reviews.targetType, targetType), targetWhere))
    .limit(1);

  if (existingReview) {
    throw new ApiError(409, 'REVIEW_ALREADY_EXISTS', 'You have already reviewed this target.');
  }
}

function isUniqueViolation(error: unknown): error is { code: string } {
  if (typeof error !== 'object' || error === null) return false;
  if ('code' in error && error.code === '23505') return true;
  return 'cause' in error && error.cause !== error && isUniqueViolation(error.cause);
}
