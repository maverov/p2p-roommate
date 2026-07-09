import { getProfilePhoneForViewer } from '@/features/profiles/server/repository';
import { apiOk, handleApiRoute, requireCurrentUser } from '@/lib/server/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ProfilePhoneRouteContext = {
  params: {
    id: string;
  };
};

export async function GET(request: Request, { params }: ProfilePhoneRouteContext) {
  return handleApiRoute(async () => {
    const user = await requireCurrentUser(request);
    const phone = await getProfilePhoneForViewer(user.id, params.id);

    return apiOk(phone);
  });
}
