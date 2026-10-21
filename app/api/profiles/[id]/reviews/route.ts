import { listReviewsQuerySchema } from '@/features/reviews/schemas';
import { getPublicProfile } from '@/features/profiles/server/repository';
import { listUserReviews } from '@/features/reviews/server/repository';
import { apiOk, handleApiRoute, parseSearchParams } from '@/lib/server/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ProfileReviewsRouteContext = {
  params: {
    id: string;
  };
};

export async function GET(request: Request, { params }: ProfileReviewsRouteContext) {
  return handleApiRoute(async () => {
    const query = parseSearchParams(request, listReviewsQuerySchema);
    await getPublicProfile(params.id);
    const reviews = await listUserReviews(params.id, query);

    return apiOk(reviews);
  });
}
