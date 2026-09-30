import { createReportInputSchema } from '@/features/reports/schemas';
import { createReport } from '@/features/reports/server/repository';
import { apiCreated, handleApiRoute, parseJsonBody, requireCurrentUser } from '@/lib/server/api';
import { enforceRateLimit } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  return handleApiRoute(async () => {
    const user = await requireCurrentUser(request);
    await enforceRateLimit('report', user.id);
    const input = await parseJsonBody(request, createReportInputSchema);
    const report = await createReport(user.id, input);

    return apiCreated(report);
  });
}
