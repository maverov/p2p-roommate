import 'server-only';

import { and, desc, eq, or } from 'drizzle-orm';

import { db } from '@/db';
import { user, userBlocks } from '@/db/schema';
import { ApiError } from '@/lib/server/api';

/** Who blocked whom between the viewer and one other person. */
export type BlockState = { blockedByViewer: boolean; blockedViewer: boolean };

export const NO_BLOCK: BlockState = { blockedByViewer: false, blockedViewer: false };

export function isBlocked(state: BlockState) {
  return state.blockedByViewer || state.blockedViewer;
}

export async function blockUser(blockerId: string, blockedId: string) {
  if (blockerId === blockedId) {
    throw new ApiError(400, 'CANNOT_BLOCK_SELF', 'You cannot block yourself.');
  }

  const [target] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, blockedId))
    .limit(1);

  if (!target) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User was not found.');
  }

  await db.insert(userBlocks).values({ blockerId, blockedId }).onConflictDoNothing();

  return { blocked: true };
}

export async function unblockUser(blockerId: string, blockedId: string) {
  await db
    .delete(userBlocks)
    .where(and(eq(userBlocks.blockerId, blockerId), eq(userBlocks.blockedId, blockedId)));
}

export async function getBlockState(viewerId: string, otherId: string): Promise<BlockState> {
  const rows = await db
    .select({ blockerId: userBlocks.blockerId })
    .from(userBlocks)
    .where(
      or(
        and(eq(userBlocks.blockerId, viewerId), eq(userBlocks.blockedId, otherId)),
        and(eq(userBlocks.blockerId, otherId), eq(userBlocks.blockedId, viewerId)),
      ),
    );

  return {
    blockedByViewer: rows.some((row) => row.blockerId === viewerId),
    blockedViewer: rows.some((row) => row.blockerId === otherId),
  };
}

/**
 * Throws when either person blocked the other. The message is the same both ways,
 * so it never tells the blocked person more than that contact is unavailable.
 */
export async function assertNotBlocked(userId: string, otherId: string) {
  if (isBlocked(await getBlockState(userId, otherId))) {
    throw new ApiError(403, 'USER_BLOCKED', 'You cannot contact this person.');
  }
}

/** The people `blockerId` blocked, newest first, for the settings page. */
export async function listBlockedUsers(blockerId: string) {
  return db
    .select({
      userId: user.id,
      name: user.name,
      image: user.image,
      blockedAt: userBlocks.createdAt,
    })
    .from(userBlocks)
    .innerJoin(user, eq(user.id, userBlocks.blockedId))
    .where(eq(userBlocks.blockerId, blockerId))
    .orderBy(desc(userBlocks.createdAt));
}

export type BlockedUser = Awaited<ReturnType<typeof listBlockedUsers>>[number];
