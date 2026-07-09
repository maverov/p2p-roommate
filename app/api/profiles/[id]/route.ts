import { updateProfileInputSchema } from '@/features/profiles/schemas';
import {
  getPublicProfile,
  updateOwnProfile,
} from '@/features/profiles/server/repository';
import {
  ApiError,
  apiOk,
  handleApiRoute,
  parseJsonBody,
  requireCurrentUser,
} from '@/lib/server/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ProfileRouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_request: Request, { params }: ProfileRouteContext) {
  return handleApiRoute(async () => {
    const profile = await getPublicProfile(params.id);

    return apiOk(profile);
  });
}

export async function PATCH(request: Request, { params }: ProfileRouteContext) {
  return handleApiRoute(async () => {
    const user = await requireCurrentUser(request);

    if (user.id !== params.id) {
      throw new ApiError(403, 'FORBIDDEN', 'You can only update your own profile.');
    }

    const input = await parseJsonBody(request, updateProfileInputSchema);
    const profile = await updateOwnProfile(user.id, input);

    return apiOk(profile);
  });
}
