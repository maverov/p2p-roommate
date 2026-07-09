import { listReviewsQuerySchema } from '@/features/reviews/schemas';
import { listListingReviews } from '@/features/reviews/server/repository';
import { apiOk, handleApiRoute, parseSearchParams } from '@/lib/server/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ListingReviewsRouteContext = {
  params: {
    id: string;
  };
};

export async function GET(request: Request, { params }: ListingReviewsRouteContext) {
  return handleApiRoute(async () => {
    const query = parseSearchParams(request, listReviewsQuerySchema);
    const reviews = await listListingReviews(params.id, query);

    return apiOk(reviews);
  });
}
