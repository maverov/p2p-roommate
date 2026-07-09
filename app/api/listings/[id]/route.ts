import { ApiError, apiNoContent, apiOk, handleApiRoute, parseJsonBody, requireCurrentUser } from '@/lib/server/api';
import { updateListingInputSchema } from '@/features/listings/schemas';
import {
  archiveListing,
  getPublishedListingById,
  updateListing,
} from '@/features/listings/server/repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ListingRouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_request: Request, { params }: ListingRouteContext) {
  return handleApiRoute(async () => {
    const listing = await getPublishedListingById(params.id);

    if (!listing) {
      throw new ApiError(404, 'LISTING_NOT_FOUND', 'Listing was not found.');
    }

    return apiOk(listing);
  });
}

export async function PATCH(request: Request, { params }: ListingRouteContext) {
  return handleApiRoute(async () => {
    const user = await requireCurrentUser(request);
    const input = await parseJsonBody(request, updateListingInputSchema);
    const listing = await updateListing(params.id, user.id, input);

    return apiOk(listing);
  });
}

export async function DELETE(request: Request, { params }: ListingRouteContext) {
  return handleApiRoute(async () => {
    const user = await requireCurrentUser(request);

    await archiveListing(params.id, user.id);

    return apiNoContent();
  });
}
