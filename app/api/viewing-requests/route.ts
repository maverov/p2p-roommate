import { listViewingRequestsQuerySchema } from '@/features/viewing-requests/schemas';
import { listViewingRequests } from '@/features/viewing-requests/server/repository';
import { apiOk, handleApiRoute, parseSearchParams, requireCurrentUser } from '@/lib/server/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return handleApiRoute(async () => {
    const user = await requireCurrentUser(request);
    const query = parseSearchParams(request, listViewingRequestsQuerySchema);
    const viewingRequests = await listViewingRequests(user.id, query);

    return apiOk({ items: viewingRequests });
  });
}
