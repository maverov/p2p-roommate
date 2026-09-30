import {
  ApiError,
  apiNoContent,
  apiOk,
  getCurrentUser,
  handleApiRoute,
  parseJsonBody,
  requireCurrentUser,
} from '@/lib/server/api';
import { apiContactMasker } from '@/lib/server/contact-visibility';
import { updateListingInputSchema } from '@/features/listings/schemas';
import {
  archiveListing,
  getPublishedListingById,
  updateListing,
} from '@/features/listings/server/repository';
import { enforceRateLimit } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ListingRouteContext = {
  params: {
    id: string;
  };
};

export async function GET(request: Request, { params }: ListingRouteContext) {
  return handleApiRoute(async () => {
    const [listing, viewer] = await Promise.all([
      getPublishedListingById(params.id),
      getCurrentUser(request),
    ]);

    if (!listing) {
      throw new ApiError(404, 'LISTING_NOT_FOUND', 'Listing was not found.');
    }

    return apiOk(apiContactMasker(Boolean(viewer)).listing(listing));
  });
}

export async function PATCH(request: Request, { params }: ListingRouteContext) {
  return handleApiRoute(async () => {
    const user = await requireCurrentUser(request);
    await enforceRateLimit('updateListing', user.id);
    const input = await parseJsonBody(request, updateListingInputSchema);
    const listing = await updateListing(params.id, user.id, input);

    return apiOk(listing);
  });
}

export async function DELETE(request: Request, { params }: ListingRouteContext) {
  return handleApiRoute(async () => {
    const user = await requireCurrentUser(request);
    await enforceRateLimit('updateListing', user.id);

    await archiveListing(params.id, user.id);

    return apiNoContent();
  });
}
