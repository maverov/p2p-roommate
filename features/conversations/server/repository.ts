import 'server-only';

import { and, asc, desc, eq, gt, ne, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { z } from 'zod';

import { db } from '@/db';
import {
  conversationParticipants,
  conversations,
  listings,
  messages,
  user,
} from '@/db/schema';
import { ApiError } from '@/lib/server/api';

export const createConversationInputSchema = z.object({
  listingId: z.string().min(1),
  message: z.string().trim().min(1).max(2000).optional(),
});

export const createMessageInputSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

export const listMessagesQuerySchema = z
  .object({
    after: z.coerce.date().optional(),
    afterId: z.string().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .refine((query) => !query.afterId || query.after, {
    message: 'afterId requires after.',
    path: ['afterId'],
  });

export type CreateConversationInput = z.infer<typeof createConversationInputSchema>;
export type CreateMessageInput = z.infer<typeof createMessageInputSchema>;
export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;

/** Shape returned by `listConversationMessages` — used by the client thread component. */
export type ConversationMessage = {
  id: string;
  body: string;
  senderId: string;
  senderName: string;
  createdAt: Date;
};

/**
 * Bare list used by the REST API — keeps the API response schema stable.
 */
export async function listUserConversations(userId: string) {
  return db
    .select({
      id: conversations.id,
      listingId: conversations.listingId,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
    })
    .from(conversations)
    .innerJoin(
      conversationParticipants,
      eq(conversations.id, conversationParticipants.conversationId),
    )
    .where(eq(conversationParticipants.userId, userId))
    .orderBy(desc(conversations.updatedAt));
}

/**
 * Enriched list for the server-rendered messages page.
 *
 * Joins the other participant's user row, the linked listing title, and
 * derives latest-message preview and unread count via scalar subqueries so
 * the whole thing stays a single round-trip.
 */
export async function listUserConversationsEnriched(userId: string) {
  const myParticipant = alias(conversationParticipants, 'my_participant');
  const otherParticipant = alias(conversationParticipants, 'other_participant');
  const otherUser = alias(user, 'other_user');

  const rows = await db
    .select({
      id: conversations.id,
      listingId: conversations.listingId,
      updatedAt: conversations.updatedAt,
      otherUserId: otherUser.id,
      otherUserName: otherUser.name,
      otherUserImage: otherUser.image,
      listingTitle: listings.title,
      lastMessageBody: sql<string | null>`(
        SELECT body FROM "message" lm
        WHERE lm.conversation_id = ${conversations.id}
        ORDER BY lm.created_at DESC, lm.id DESC
        LIMIT 1
      )`,
      /*
       * Typed as a string, not a Date: Drizzle only runs its timestamp mapper on
       * declared columns, so a raw fragment hands back whatever postgres-js
       * produced. The conversion happens once, below, rather than at each caller.
       */
      lastMessageAt: sql<string | null>`(
        SELECT created_at FROM "message" lm
        WHERE lm.conversation_id = ${conversations.id}
        ORDER BY lm.created_at DESC, lm.id DESC
        LIMIT 1
      )`,
      /*
       * Count only messages from the other party that arrived after the current
       * user last read the thread. A NULL last_read_at means they have never
       * opened the thread, so every incoming message counts as unread.
       */
      unreadCount: sql<number>`(
        SELECT COUNT(*)::int FROM "message" um
        WHERE um.conversation_id = ${conversations.id}
          AND um.sender_id != ${userId}
          AND (${myParticipant.lastReadAt} IS NULL
               OR um.created_at > ${myParticipant.lastReadAt})
      )`,
    })
    .from(conversations)
    .innerJoin(
      myParticipant,
      and(
        eq(myParticipant.conversationId, conversations.id),
        eq(myParticipant.userId, userId),
      ),
    )
    .innerJoin(
      otherParticipant,
      and(
        eq(otherParticipant.conversationId, conversations.id),
        ne(otherParticipant.userId, userId),
      ),
    )
    .innerJoin(otherUser, eq(otherUser.id, otherParticipant.userId))
    .leftJoin(listings, eq(listings.id, conversations.listingId))
    .orderBy(desc(conversations.updatedAt));

  return rows.map((row) => ({
    ...row,
    lastMessageAt: row.lastMessageAt ? new Date(row.lastMessageAt) : null,
  }));
}

export type EnrichedConversation = Awaited<
  ReturnType<typeof listUserConversationsEnriched>
>[number];

/**
 * Full conversation header for the thread view: participant info + listing title.
 */
export async function getConversationDetails(conversationId: string, userId: string) {
  const otherParticipant = alias(conversationParticipants, 'other_participant');
  const otherUser = alias(user, 'other_user');

  const [conversation] = await db
    .select({
      id: conversations.id,
      listingId: conversations.listingId,
      listingTitle: listings.title,
      otherUserId: otherUser.id,
      otherUserName: otherUser.name,
      otherUserImage: otherUser.image,
    })
    .from(conversations)
    .innerJoin(
      conversationParticipants,
      and(
        eq(conversationParticipants.conversationId, conversations.id),
        eq(conversationParticipants.userId, userId),
      ),
    )
    .innerJoin(
      otherParticipant,
      and(
        eq(otherParticipant.conversationId, conversations.id),
        ne(otherParticipant.userId, userId),
      ),
    )
    .innerJoin(otherUser, eq(otherUser.id, otherParticipant.userId))
    .leftJoin(listings, eq(listings.id, conversations.listingId))
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (!conversation) {
    throw new ApiError(404, 'CONVERSATION_NOT_FOUND', 'Conversation was not found.');
  }

  return conversation;
}

export type ConversationDetails = Awaited<ReturnType<typeof getConversationDetails>>;

/** Stamps the current user's last-read timestamp for unread-count bookkeeping. */
export async function markConversationRead(conversationId: string, userId: string) {
  await db
    .update(conversationParticipants)
    .set({ lastReadAt: new Date() })
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId),
      ),
    );
}

export async function createConversation(
  requesterId: string,
  input: CreateConversationInput,
) {
  const [listing] = await db
    .select({
      id: listings.id,
      ownerId: listings.ownerId,
      status: listings.status,
    })
    .from(listings)
    .where(and(eq(listings.id, input.listingId), eq(listings.status, 'PUBLISHED')))
    .limit(1);

  if (!listing) {
    throw new ApiError(404, 'LISTING_NOT_FOUND', 'Listing was not found.');
  }

  if (listing.ownerId === requesterId) {
    throw new ApiError(
      400,
      'CANNOT_MESSAGE_OWN_LISTING',
      'You cannot start a conversation with your own listing.',
    );
  }

  /*
   * Deduplicate: if this requester already has a thread for this listing,
   * return it instead of creating a second one. The combination of listingId +
   * requester-as-participant is a unique key because listings have exactly one
   * owner and a requester can only appear once per listing thread.
   */
  const [existing] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .innerJoin(
      conversationParticipants,
      and(
        eq(conversationParticipants.conversationId, conversations.id),
        eq(conversationParticipants.userId, requesterId),
      ),
    )
    .where(eq(conversations.listingId, input.listingId))
    .limit(1);

  if (existing) {
    return getConversationForUserOrThrow(existing.id, requesterId);
  }

  const conversationId = crypto.randomUUID();
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx.insert(conversations).values({
      id: conversationId,
      listingId: listing.id,
    });

    await tx.insert(conversationParticipants).values([
      {
        conversationId,
        userId: requesterId,
        lastReadAt: now,
      },
      {
        conversationId,
        userId: listing.ownerId,
      },
    ]);

    if (input.message) {
      await tx.insert(messages).values({
        id: crypto.randomUUID(),
        conversationId,
        senderId: requesterId,
        body: input.message,
      });
    }
  });

  return getConversationForUserOrThrow(conversationId, requesterId);
}

export async function listConversationMessages(
  conversationId: string,
  userId: string,
  query: ListMessagesQuery = { limit: 50 },
) {
  await assertConversationParticipant(conversationId, userId);

  const conditions = [eq(messages.conversationId, conversationId)];

  if (query.after && query.afterId) {
    conditions.push(
      or(
        gt(messages.createdAt, query.after),
        and(
          eq(messages.createdAt, query.after),
          gt(messages.id, query.afterId),
        ),
      )!,
    );
  } else if (query.after) {
    conditions.push(gt(messages.createdAt, query.after));
  }

  return db
    .select({
      id: messages.id,
      body: messages.body,
      senderId: messages.senderId,
      senderName: user.name,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .innerJoin(user, eq(messages.senderId, user.id))
    .where(and(...conditions))
    .orderBy(asc(messages.createdAt), asc(messages.id))
    .limit(query.limit);
}

export async function createMessage(
  conversationId: string,
  userId: string,
  input: CreateMessageInput,
) {
  await assertConversationParticipant(conversationId, userId);

  const [message] = await db
    .insert(messages)
    .values({
      id: crypto.randomUUID(),
      conversationId,
      senderId: userId,
      body: input.body,
    })
    .returning();

  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));

  return message;
}

async function getConversationForUserOrThrow(conversationId: string, userId: string) {
  const [conversation] = await db
    .select({
      id: conversations.id,
      listingId: conversations.listingId,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
    })
    .from(conversations)
    .innerJoin(
      conversationParticipants,
      eq(conversations.id, conversationParticipants.conversationId),
    )
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversationParticipants.userId, userId),
      ),
    )
    .limit(1);

  if (!conversation) {
    throw new ApiError(404, 'CONVERSATION_NOT_FOUND', 'Conversation was not found.');
  }

  return conversation;
}

async function assertConversationParticipant(
  conversationId: string,
  userId: string,
) {
  const [participant] = await db
    .select({ conversationId: conversationParticipants.conversationId })
    .from(conversationParticipants)
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId),
      ),
    )
    .limit(1);

  if (!participant) {
    throw new ApiError(403, 'FORBIDDEN', 'You cannot access this conversation.');
  }
}
