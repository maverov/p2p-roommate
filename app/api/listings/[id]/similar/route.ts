import { listSimilarListings } from '@/features/listings/server/repository';
import { apiOk, handleApiRoute, parseSearchParams } from '@/lib/server/api';
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
    const listings = await listSimilarListings(params.id, query.limit);

    return apiOk({ items: listings });
  });
}
