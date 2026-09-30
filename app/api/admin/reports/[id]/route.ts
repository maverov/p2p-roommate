import { updateReportInputSchema } from '@/features/admin/schemas';
import { updateReportStatus } from '@/features/admin/server/reports';
import { requireAdminApiUser } from '@/lib/server/admin';
import { apiOk, handleApiRoute, parseJsonBody } from '@/lib/server/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AdminReportRouteContext = {
  params: {
    id: string;
  };
};

export async function PATCH(request: Request, { params }: AdminReportRouteContext) {
  return handleApiRoute(async () => {
    const adminUser = await requireAdminApiUser(request);
    const input = await parseJsonBody(request, updateReportInputSchema);
    const report = await updateReportStatus(params.id, adminUser.id, input);

    return apiOk(report);
  });
}
