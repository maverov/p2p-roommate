import { createViewingRequestInputSchema } from '@/features/viewing-requests/schemas';
import { createViewingRequest } from '@/features/viewing-requests/server/repository';
import { apiCreated, handleApiRoute, parseJsonBody, requireCurrentUser } from '@/lib/server/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ListingViewingRequestsRouteContext = {
  params: {
    id: string;
  };
};

export async function POST(
  request: Request,
  { params }: ListingViewingRequestsRouteContext,
) {
  return handleApiRoute(async () => {
    const user = await requireCurrentUser(request);
    const input = await parseJsonBody(request, createViewingRequestInputSchema);
    const viewingRequest = await createViewingRequest(params.id, user.id, input);

    return apiCreated(viewingRequest);
  });
}
