import { createReviewInputSchema } from '@/features/reviews/schemas';
import { createReview } from '@/features/reviews/server/repository';
import { apiCreated, handleApiRoute, parseJsonBody, requireCurrentUser } from '@/lib/server/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  return handleApiRoute(async () => {
    const user = await requireCurrentUser(request);
    const input = await parseJsonBody(request, createReviewInputSchema);
    const review = await createReview(user.id, input);

    return apiCreated(review);
  });
}
