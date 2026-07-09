import 'server-only';

import { and, desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { savedSearches } from '@/db/schema';
import { ApiError } from '@/lib/server/api';

import type {
  CreateSavedSearchInput,
  UpdateSavedSearchInput,
} from '../schemas';

export async function listSavedSearches(userId: string) {
  return db
    .select()
    .from(savedSearches)
    .where(eq(savedSearches.userId, userId))
    .orderBy(desc(savedSearches.createdAt));
}

export async function createSavedSearch(
  userId: string,
  input: CreateSavedSearchInput,
) {
  const [savedSearch] = await db
    .insert(savedSearches)
    .values({
      id: crypto.randomUUID(),
      userId,
      name: input.name,
      filters: input.filters,
      notificationsEnabled: input.notificationsEnabled,
    })
    .returning();

  return savedSearch;
}

export async function updateSavedSearch(
  id: string,
  userId: string,
  input: UpdateSavedSearchInput,
) {
  const [savedSearch] = await db
    .update(savedSearches)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(and(eq(savedSearches.id, id), eq(savedSearches.userId, userId)))
    .returning();

  if (!savedSearch) {
    throw new ApiError(404, 'SAVED_SEARCH_NOT_FOUND', 'Saved search was not found.');
  }

  return savedSearch;
}

export async function deleteSavedSearch(id: string, userId: string) {
  await db
    .delete(savedSearches)
    .where(and(eq(savedSearches.id, id), eq(savedSearches.userId, userId)));
}
