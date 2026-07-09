import { updateViewingRequestInputSchema } from '@/features/viewing-requests/schemas';
import { updateViewingRequest } from '@/features/viewing-requests/server/repository';
import { apiOk, handleApiRoute, parseJsonBody, requireCurrentUser } from '@/lib/server/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ViewingRequestRouteContext = {
  params: {
    id: string;
  };
};

export async function PATCH(request: Request, { params }: ViewingRequestRouteContext) {
  return handleApiRoute(async () => {
    const user = await requireCurrentUser(request);
    const input = await parseJsonBody(request, updateViewingRequestInputSchema);
    const viewingRequest = await updateViewingRequest(params.id, user.id, input);

    return apiOk(viewingRequest);
  });
}
