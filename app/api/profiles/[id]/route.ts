import { updateProfileInputSchema } from '@/features/profiles/schemas';
import {
  getPublicProfile,
  updateOwnProfile,
} from '@/features/profiles/server/repository';
import {
  ApiError,
  apiOk,
  getCurrentUser,
  handleApiRoute,
  parseJsonBody,
  requireCurrentUser,
} from '@/lib/server/api';
import { apiContactMasker } from '@/lib/server/contact-visibility';
import { enforceRateLimit } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ProfileRouteContext = {
  params: {
    id: string;
  };
};

export async function GET(request: Request, { params }: ProfileRouteContext) {
  return handleApiRoute(async () => {
    const [profile, viewer] = await Promise.all([
      getPublicProfile(params.id),
      getCurrentUser(request),
    ]);

    return apiOk(apiContactMasker(Boolean(viewer)).profile(profile));
  });
}

export async function PATCH(request: Request, { params }: ProfileRouteContext) {
  return handleApiRoute(async () => {
    const user = await requireCurrentUser(request);
    await enforceRateLimit('updateProfile', user.id);

    if (user.id !== params.id) {
      throw new ApiError(403, 'FORBIDDEN', 'You can only update your own profile.');
    }

    const input = await parseJsonBody(request, updateProfileInputSchema);
    const profile = await updateOwnProfile(user.id, input);

    return apiOk(profile);
  });
}
