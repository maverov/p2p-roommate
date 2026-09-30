import { adminUpdateListingInputSchema } from '@/features/admin/schemas';
import { archiveListing } from '@/features/admin/server/listings';
import { requireAdminApiUser } from '@/lib/server/admin';
import { apiOk, handleApiRoute, parseJsonBody } from '@/lib/server/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AdminListingRouteContext = {
  params: {
    id: string;
  };
};

export async function PATCH(request: Request, { params }: AdminListingRouteContext) {
  return handleApiRoute(async () => {
    await requireAdminApiUser(request);
    await parseJsonBody(request, adminUpdateListingInputSchema);
    const listing = await archiveListing(params.id);

    return apiOk(listing);
  });
}
