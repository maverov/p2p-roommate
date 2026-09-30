import { exportUserData } from '@/features/account/server/export';
import { handleApiRoute, requireCurrentUser } from '@/lib/server/api';
import { enforceRateLimit } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Downloads the signed-in user's data as a JSON file (GDPR access and portability). */
export async function GET(request: Request) {
  return handleApiRoute(async () => {
    const user = await requireCurrentUser(request);
    await enforceRateLimit('dataExport', user.id);

    const data = await exportUserData(user.id);
    const filename = `stay-bg-data-${data.exportedAt.slice(0, 10)}.json`;

    return new Response(JSON.stringify(data, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  });
}
