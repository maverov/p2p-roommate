import 'server-only';

import { and, desc, eq, or } from 'drizzle-orm';

import { db } from '@/db';
import { listings, user, viewingRequests } from '@/db/schema';
import { ApiError } from '@/lib/server/api';

import type {
  CreateViewingRequestInput,
  ListViewingRequestsQuery,
  UpdateViewingRequestInput,
} from '../schemas';

export async function createViewingRequest(
  listingId: string,
  requesterId: string,
  input: CreateViewingRequestInput,
) {
  const [listing] = await db
    .select({
      id: listings.id,
      ownerId: listings.ownerId,
      status: listings.status,
    })
    .from(listings)
    .where(and(eq(listings.id, listingId), eq(listings.status, 'PUBLISHED')))
    .limit(1);

  if (!listing) {
    throw new ApiError(404, 'LISTING_NOT_FOUND', 'Listing was not found.');
  }

  if (listing.ownerId === requesterId) {
    throw new ApiError(
      400,
      'CANNOT_REQUEST_OWN_LISTING',
      'You cannot request a viewing for your own listing.',
    );
  }

  const [request] = await db
    .insert(viewingRequests)
    .values({
      id: crypto.randomUUID(),
      listingId,
      requesterId,
      ownerId: listing.ownerId,
      requestedStartAt: input.requestedStartAt,
      message: input.message,
    })
    .returning();

  return request;
}

export async function listViewingRequests(
  userId: string,
  query: ListViewingRequestsQuery,
) {
  const roleWhere =
    query.role === 'requester'
      ? eq(viewingRequests.requesterId, userId)
      : query.role === 'owner'
        ? eq(viewingRequests.ownerId, userId)
        : or(
            eq(viewingRequests.requesterId, userId),
            eq(viewingRequests.ownerId, userId),
          );

  return db
    .select({
      id: viewingRequests.id,
      listingId: viewingRequests.listingId,
      requesterId: viewingRequests.requesterId,
      ownerId: viewingRequests.ownerId,
      requestedStartAt: viewingRequests.requestedStartAt,
      message: viewingRequests.message,
      status: viewingRequests.status,
      createdAt: viewingRequests.createdAt,
      updatedAt: viewingRequests.updatedAt,
      listingTitle: listings.title,
      requesterName: user.name,
    })
    .from(viewingRequests)
    .innerJoin(listings, eq(viewingRequests.listingId, listings.id))
    .innerJoin(user, eq(viewingRequests.requesterId, user.id))
    .where(roleWhere)
    .orderBy(desc(viewingRequests.createdAt));
}

export async function updateViewingRequest(
  id: string,
  userId: string,
  input: UpdateViewingRequestInput,
) {
  const [existing] = await db
    .select()
    .from(viewingRequests)
    .where(
      and(
        eq(viewingRequests.id, id),
        or(
          eq(viewingRequests.ownerId, userId),
          eq(viewingRequests.requesterId, userId),
        ),
      ),
    )
    .limit(1);

  if (!existing) {
    throw new ApiError(
      404,
      'VIEWING_REQUEST_NOT_FOUND',
      'Viewing request was not found.',
    );
  }

  if (input.status === 'CANCELLED' && existing.requesterId !== userId) {
    throw new ApiError(
      403,
      'ONLY_REQUESTER_CAN_CANCEL',
      'Only the requester can cancel a viewing request.',
    );
  }

  if (
    ['ACCEPTED', 'DECLINED'].includes(input.status) &&
    existing.ownerId !== userId
  ) {
    throw new ApiError(
      403,
      'ONLY_OWNER_CAN_DECIDE',
      'Only the listing owner can accept or decline a viewing request.',
    );
  }

  const [request] = await db
    .update(viewingRequests)
    .set({
      status: input.status,
      updatedAt: new Date(),
    })
    .where(eq(viewingRequests.id, id))
    .returning();

  return request;
}
