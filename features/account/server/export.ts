import 'server-only';

import { eq, inArray, or } from 'drizzle-orm';

import { db } from '@/db';
import {
  conversationParticipants,
  favorites,
  listingImages,
  listings,
  messages,
  reports,
  reviews,
  savedProfiles,
  session,
  user,
  userBlocks,
  userProfiles,
  viewingRequests,
} from '@/db/schema';

/**
 * Everything stored about one user, for the GDPR right of access (Art. 15) and data
 * portability (Art. 20). Credentials are deliberately absent: no password hash, no
 * session tokens, no verification secrets.
 */
export async function exportUserData(userId: string) {
  const participantRows = await db
    .select({ conversationId: conversationParticipants.conversationId })
    .from(conversationParticipants)
    .where(eq(conversationParticipants.userId, userId));
  const conversationIds = participantRows.map((row) => row.conversationId);

  const ownListings = await db.select().from(listings).where(eq(listings.ownerId, userId));
  const ownListingIds = ownListings.map((listing) => listing.id);

  const [
    [account],
    [profile],
    images,
    savedListingRows,
    savedProfileRows,
    viewings,
    reviewRows,
    reportRows,
    messageRows,
    sessions,
    blockRows,
  ] = await Promise.all([
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        locale: user.locale,
        role: user.role,
        banned: user.banned,
        banReason: user.banReason,
        banExpires: user.banExpires,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(eq(user.id, userId)),
    db.select().from(userProfiles).where(eq(userProfiles.userId, userId)),
    ownListingIds.length
      ? db.select().from(listingImages).where(inArray(listingImages.listingId, ownListingIds))
      : Promise.resolve([]),
    db.select().from(favorites).where(eq(favorites.userId, userId)),
    db.select().from(savedProfiles).where(eq(savedProfiles.userId, userId)),
    db
      .select()
      .from(viewingRequests)
      .where(or(eq(viewingRequests.requesterId, userId), eq(viewingRequests.ownerId, userId))),
    db
      .select()
      .from(reviews)
      .where(or(eq(reviews.reviewerId, userId), eq(reviews.targetUserId, userId))),
    db.select().from(reports).where(eq(reports.reporterId, userId)),
    // Both sides of every thread the user is in: the conversation is their data too.
    conversationIds.length
      ? db.select().from(messages).where(inArray(messages.conversationId, conversationIds))
      : Promise.resolve([]),
    db
      .select({
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
      })
      .from(session)
      .where(eq(session.userId, userId)),
    // Only the user's own blocks: who blocked them is the other person's data.
    db.select().from(userBlocks).where(eq(userBlocks.blockerId, userId)),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    account: account ?? null,
    profile: profile ?? null,
    listings: ownListings.map((listing) => ({
      ...listing,
      images: images.filter((image) => image.listingId === listing.id),
    })),
    savedListings: savedListingRows,
    savedProfiles: savedProfileRows,
    viewingRequests: viewings,
    reviews: {
      written: reviewRows.filter((review) => review.reviewerId === userId),
      received: reviewRows.filter((review) => review.targetUserId === userId),
    },
    reportsFiled: reportRows,
    conversations: conversationIds.map((conversationId) => ({
      conversationId,
      messages: messageRows.filter((message) => message.conversationId === conversationId),
    })),
    sessions,
    blockedUsers: blockRows,
  };
}
