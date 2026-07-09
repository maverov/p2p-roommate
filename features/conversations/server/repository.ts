import 'server-only';

import { and, asc, desc, eq, gt } from 'drizzle-orm';
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

export const listMessagesQuerySchema = z.object({
  after: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type CreateConversationInput = z.infer<typeof createConversationInputSchema>;
export type CreateMessageInput = z.infer<typeof createMessageInputSchema>;
export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;

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

  if (query.after) {
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
