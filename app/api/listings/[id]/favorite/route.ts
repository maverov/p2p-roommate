import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { favorites } from '@/db/schema';
import { getPublishedListingById } from '@/features/listings/server/repository';
import { ApiError, apiNoContent, apiOk, handleApiRoute, requireCurrentUser } from '@/lib/server/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type FavoriteRouteContext = {
  params: {
    id: string;
  };
};

export async function POST(request: Request, { params }: FavoriteRouteContext) {
  return handleApiRoute(async () => {
    const user = await requireCurrentUser(request);
    const listing = await getPublishedListingById(params.id);

    if (!listing) {
      throw new ApiError(404, 'LISTING_NOT_FOUND', 'Listing was not found.');
    }

    await db
      .insert(favorites)
      .values({
        userId: user.id,
        listingId: params.id,
      })
      .onConflictDoNothing();

    return apiOk({ favorited: true });
  });
}

export async function DELETE(request: Request, { params }: FavoriteRouteContext) {
  return handleApiRoute(async () => {
    const user = await requireCurrentUser(request);

    await db
      .delete(favorites)
      .where(and(eq(favorites.userId, user.id), eq(favorites.listingId, params.id)));

    return apiNoContent();
  });
}
