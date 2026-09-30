import { listSimilarListings } from '@/features/listings/server/repository';
import { apiOk, getCurrentUser, handleApiRoute, parseSearchParams } from '@/lib/server/api';
import { apiContactMasker } from '@/lib/server/contact-visibility';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const similarListingsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(6),
});

type SimilarListingsRouteContext = {
  params: {
    id: string;
  };
};

export async function GET(request: Request, { params }: SimilarListingsRouteContext) {
  return handleApiRoute(async () => {
    const query = parseSearchParams(request, similarListingsQuerySchema);
    const [listings, viewer] = await Promise.all([
      listSimilarListings(params.id, query.limit),
      getCurrentUser(request),
    ]);

    return apiOk({ items: listings.map(apiContactMasker(Boolean(viewer)).listing) });
  });
}
