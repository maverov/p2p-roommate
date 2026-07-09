import {
  saveProfile,
  unsaveProfile,
} from '@/features/profiles/server/repository';
import { apiNoContent, apiOk, handleApiRoute, requireCurrentUser } from '@/lib/server/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ProfileFavoriteRouteContext = {
  params: {
    id: string;
  };
};

export async function POST(
  request: Request,
  { params }: ProfileFavoriteRouteContext,
) {
  return handleApiRoute(async () => {
    const user = await requireCurrentUser(request);
    const result = await saveProfile(user.id, params.id);

    return apiOk(result);
  });
}

export async function DELETE(
  request: Request,
  { params }: ProfileFavoriteRouteContext,
) {
  return handleApiRoute(async () => {
    const user = await requireCurrentUser(request);

    await unsaveProfile(user.id, params.id);

    return apiNoContent();
  });
}
