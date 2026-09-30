import 'server-only';

import { del } from '@vercel/blob';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { listingImages, listings, userProfiles } from '@/db/schema';
import imageHosts from '@/lib/image-hosts.json';
import { serverEnv } from '@/lib/server/env';

const uploadHostSuffix = imageHosts.uploads.replace(/^\*/, '');

const isUpload = (url: string | null): url is string => {
  if (!url) {
    return false;
  }

  try {
    return new URL(url).hostname.endsWith(uploadHostSuffix);
  } catch {
    return false;
  }
};

/** Every photo a user uploaded: their listings' images and their avatar. */
export async function listUserUploads(userId: string): Promise<string[]> {
  const [images, profile] = await Promise.all([
    db
      .select({ url: listingImages.url })
      .from(listingImages)
      .innerJoin(listings, eq(listings.id, listingImages.listingId))
      .where(eq(listings.ownerId, userId)),
    db
      .select({ url: userProfiles.avatarUrl })
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId)),
  ]);

  return [...images, ...profile].map((row) => row.url).filter(isUpload);
}

/** Removes stored files, e.g. after account deletion (GDPR erasure covers photos too). */
export async function deleteUserUploads(urls: string[]) {
  if (urls.length === 0 || !serverEnv.BLOB_READ_WRITE_TOKEN) {
    return;
  }

  await del(urls, { token: serverEnv.BLOB_READ_WRITE_TOKEN });
}
