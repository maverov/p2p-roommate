import {
  apiCreated,
  apiOk,
  getCurrentUser,
  handleApiRoute,
  parseJsonBody,
  parseSearchParams,
  requireCurrentUser,
} from '@/lib/server/api';
import { apiContactMasker } from '@/lib/server/contact-visibility';
import { createListingInputSchema, listListingsQuerySchema } from '@/features/listings/schemas';
import { createListing, listPublishedListings } from '@/features/listings/server/repository';
import { enforceRateLimit } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return handleApiRoute(async () => {
    const query = parseSearchParams(request, listListingsQuerySchema);
    const [listings, viewer] = await Promise.all([
      listPublishedListings(query),
      getCurrentUser(request),
    ]);
    const mask = apiContactMasker(Boolean(viewer));

    return apiOk({ ...listings, items: listings.items.map(mask.listing) });
  });
}

export async function POST(request: Request) {
  return handleApiRoute(async () => {
    const user = await requireCurrentUser(request);
    await enforceRateLimit('createListing', user.id);
    const input = await parseJsonBody(request, createListingInputSchema);
    const listing = await createListing(user.id, input);

    return apiCreated(listing);
  });
}
