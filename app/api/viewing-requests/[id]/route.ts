import { updateViewingRequestInputSchema } from '@/features/viewing-requests/schemas';
import { updateViewingRequest } from '@/features/viewing-requests/server/repository';
import { apiOk, handleApiRoute, parseJsonBody, requireCurrentUser } from '@/lib/server/api';
import { notifyViewingRequestStatus } from '@/features/notifications/server/notify';
import { runInBackground } from '@/lib/server/background';
import { enforceRateLimit } from '@/lib/server/rate-limit';

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
    await enforceRateLimit('updateViewingRequest', user.id);
    const input = await parseJsonBody(request, updateViewingRequestInputSchema);
    const viewingRequest = await updateViewingRequest(params.id, user.id, input);

    runInBackground(
      notifyViewingRequestStatus(viewingRequest.id, input.status),
      'notify viewing request status',
    );

    return apiOk(viewingRequest);
  });
}
