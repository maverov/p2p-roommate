import 'server-only';

import { eq } from 'drizzle-orm';
import { cache } from 'react';

import { db } from '@/db';
import { userProfiles } from '@/db/schema';

import { toCompatibilityProfile, type CompatibilityProfile } from '../score';

/** The columns scoring reads, for queries that return profiles to be scored. */
export const compatibilityColumns = {
  traits: userProfiles.traits,
  roommatePreferences: userProfiles.roommatePreferences,
  citySlug: userProfiles.citySlug,
  lookingForRoom: userProfiles.lookingForRoom,
  moveInDate: userProfiles.moveInDate,
  stayMonths: userProfiles.stayMonths,
  wantedNeighborhoods: userProfiles.wantedNeighborhoods,
};

/** The viewer's side of every score on a page; null without a profile. */
export const getCompatibilityProfile = cache(
  async (userId: string): Promise<CompatibilityProfile | null> => {
    const [row] = await db
      .select(compatibilityColumns)
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    return row ? toCompatibilityProfile(row) : null;
  },
);
