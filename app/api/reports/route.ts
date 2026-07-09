import { createReport, createReportInputSchema } from '@/features/reports/server/repository';
import { apiCreated, handleApiRoute, parseJsonBody, requireCurrentUser } from '@/lib/server/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  return handleApiRoute(async () => {
    const user = await requireCurrentUser(request);
    const input = await parseJsonBody(request, createReportInputSchema);
    const report = await createReport(user.id, input);

    return apiCreated(report);
  });
}
