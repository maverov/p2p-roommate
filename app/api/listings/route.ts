import { apiCreated, apiOk, handleApiRoute, parseJsonBody, parseSearchParams, requireCurrentUser } from '@/lib/server/api';
import { createListingInputSchema, listListingsQuerySchema } from '@/features/listings/schemas';
import { createListing, listPublishedListings } from '@/features/listings/server/repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return handleApiRoute(async () => {
    const query = parseSearchParams(request, listListingsQuerySchema);
    const listings = await listPublishedListings(query);

    return apiOk(listings);
  });
}

export async function POST(request: Request) {
  return handleApiRoute(async () => {
    const user = await requireCurrentUser(request);
    const input = await parseJsonBody(request, createListingInputSchema);
    const listing = await createListing(user.id, input);

    return apiCreated(listing);
  });
}
