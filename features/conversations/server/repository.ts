import 'server-only';

import { and, asc, desc, eq, gt, isNull, ne, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { z } from 'zod';

import { db } from '@/db';
import {
  conversationParticipants,
  conversations,
  listings,
  messages,
  user,
  userBlocks,
  userProfiles,
} from '@/db/schema';
import { assertNotBlocked } from '@/features/blocks/server/repository';
import { ApiError } from '@/lib/server/api';

/**
 * Two ways to start a thread:
 * - `{ listingId }` asks a listing's owner about it (the original flow);
 * - `{ recipientId, listingId? }` writes to someone with a "room wanted" post,
 *   optionally about one of the sender's own listings.
 */
export const createConversationInputSchema = z
  .object({
    listingId: z.string().min(1).optional(),
    recipientId: z.string().min(1).optional(),
    message: z.string().trim().min(1).max(2000).optional(),
  })
  .refine((input) => input.listingId || input.recipientId, {
    message: 'Provide a listingId or a recipientId.',
    path: ['listingId'],
  })
  .refine((input) => !input.recipientId || input.message, {
    message: 'A message to a person starts with a message.',
    path: ['message'],
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
  const listing = input.listingId ? await getPublishedListingOrThrow(input.listingId) : null;
  const recipientId = input.recipientId ?? listing!.ownerId;

  if (recipientId === requesterId) {
    throw listing && !input.recipientId
      ? new ApiError(
          400,
          'CANNOT_MESSAGE_OWN_LISTING',
          'You cannot start a conversation with your own listing.',
        )
      : new ApiError(400, 'CANNOT_MESSAGE_SELF', 'You cannot message yourself.');
  }

  if (listing && listing.ownerId !== recipientId && listing.ownerId !== requesterId) {
    throw new ApiError(
      400,
      'LISTING_NOT_RELATED',
      'The listing must belong to you or to the person you are writing to.',
    );
  }

  await assertNotBlocked(requesterId, recipientId);

  // Asking about the recipient's own listing is always allowed. Anything else — a
  // plain message, or offering the sender's listing — needs a "room wanted" post.
  if (!listing || listing.ownerId === requesterId) {
    await assertLookingForRoom(recipientId);
  }

  const listingId = listing?.id ?? null;
  const recipientParticipant = alias(conversationParticipants, 'recipient_participant');

  // One thread per pair of people per listing (or per pair with no listing).
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
    .innerJoin(
      recipientParticipant,
      and(
        eq(recipientParticipant.conversationId, conversations.id),
        eq(recipientParticipant.userId, recipientId),
      ),
    )
    .where(listingId ? eq(conversations.listingId, listingId) : isNull(conversations.listingId))
    .limit(1);

  if (existing) {
    return {
      conversation: await getConversationForUserOrThrow(existing.id, requesterId),
      firstMessageId: null,
    };
  }

  const conversationId = crypto.randomUUID();
  const firstMessageId = input.message ? crypto.randomUUID() : null;
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx.insert(conversations).values({
      id: conversationId,
      listingId,
    });

    await tx.insert(conversationParticipants).values([
      {
        conversationId,
        userId: requesterId,
        lastReadAt: now,
      },
      {
        conversationId,
        userId: recipientId,
      },
    ]);

    if (input.message && firstMessageId) {
      await tx.insert(messages).values({
        id: firstMessageId,
        conversationId,
        senderId: requesterId,
        body: input.message,
      });
    }
  });

  return {
    conversation: await getConversationForUserOrThrow(conversationId, requesterId),
    /** Set only when this call created a message, so the caller knows what to notify about. */
    firstMessageId,
  };
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
  await assertConversationNotBlocked(conversationId, userId);

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

async function getPublishedListingOrThrow(listingId: string) {
  const [listing] = await db
    .select({ id: listings.id, ownerId: listings.ownerId })
    .from(listings)
    .where(and(eq(listings.id, listingId), eq(listings.status, 'PUBLISHED')))
    .limit(1);

  if (!listing) {
    throw new ApiError(404, 'LISTING_NOT_FOUND', 'Listing was not found.');
  }

  return listing;
}

async function assertLookingForRoom(userId: string) {
  const [profile] = await db
    .select({ userId: userProfiles.userId })
    .from(userProfiles)
    .innerJoin(user, eq(user.id, userProfiles.userId))
    .where(
      and(
        eq(userProfiles.userId, userId),
        eq(userProfiles.lookingForRoom, true),
        eq(user.banned, false),
      ),
    )
    .limit(1);

  if (!profile) {
    throw new ApiError(
      403,
      'RECIPIENT_NOT_LOOKING',
      'You can message this person only about one of their listings.',
    );
  }
}

/** A block between the sender and anyone else in the thread closes it to new messages. */
async function assertConversationNotBlocked(conversationId: string, userId: string) {
  const [block] = await db
    .select({ blockerId: userBlocks.blockerId })
    .from(conversationParticipants)
    .innerJoin(
      userBlocks,
      or(
        and(
          eq(userBlocks.blockerId, userId),
          eq(userBlocks.blockedId, conversationParticipants.userId),
        ),
        and(
          eq(userBlocks.blockerId, conversationParticipants.userId),
          eq(userBlocks.blockedId, userId),
        ),
      ),
    )
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        ne(conversationParticipants.userId, userId),
      ),
    )
    .limit(1);

  if (block) {
    throw new ApiError(403, 'USER_BLOCKED', 'You cannot contact this person.');
  }
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
