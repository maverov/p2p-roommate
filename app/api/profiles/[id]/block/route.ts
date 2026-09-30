import { blockUser, unblockUser } from '@/features/blocks/server/repository';
import { apiNoContent, apiOk, handleApiRoute, requireCurrentUser } from '@/lib/server/api';
import { enforceRateLimit } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ProfileBlockRouteContext = {
  params: {
    id: string;
  };
};

export async function POST(request: Request, { params }: ProfileBlockRouteContext) {
  return handleApiRoute(async () => {
    const user = await requireCurrentUser(request);
    await enforceRateLimit('block', user.id);
    const result = await blockUser(user.id, params.id);

    return apiOk(result);
  });
}

export async function DELETE(request: Request, { params }: ProfileBlockRouteContext) {
  return handleApiRoute(async () => {
    const user = await requireCurrentUser(request);
    await enforceRateLimit('block', user.id);

    await unblockUser(user.id, params.id);

    return apiNoContent();
  });
}
