import { adminUpdateListingInputSchema } from '@/features/admin/schemas';
import { archiveListing, restoreListing } from '@/features/admin/server/listings';
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
    const input = await parseJsonBody(request, adminUpdateListingInputSchema);
    const listing = await (input.status === 'ARCHIVED' ? archiveListing(params.id) : restoreListing(params.id));

    return apiOk(listing);
  });
}
