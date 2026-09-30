import { banUserInputSchema } from '@/features/admin/schemas';
import { banUser } from '@/features/admin/server/users';
import { requireAdminApiUser } from '@/lib/server/admin';
import { apiOk, handleApiRoute, parseJsonBody } from '@/lib/server/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AdminBanRouteContext = {
  params: {
    id: string;
  };
};

export async function POST(request: Request, { params }: AdminBanRouteContext) {
  return handleApiRoute(async () => {
    await requireAdminApiUser(request);
    const input = await parseJsonBody(request, banUserInputSchema);
    const result = await banUser(params.id, input, request.headers);

    return apiOk(result);
  });
}
