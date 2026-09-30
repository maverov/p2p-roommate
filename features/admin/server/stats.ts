import 'server-only';

import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { listings, reports, user } from '@/db/schema';

export async function getAdminStats() {
  const [openReports, users, bannedUsers, publishedListings] = await Promise.all([
    db.$count(reports, eq(reports.status, 'OPEN')),
    db.$count(user),
    db.$count(user, eq(user.banned, true)),
    db.$count(listings, eq(listings.status, 'PUBLISHED')),
  ]);

  return { openReports, users, bannedUsers, publishedListings };
}
