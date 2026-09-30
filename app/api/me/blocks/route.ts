import { listBlockedUsers } from '@/features/blocks/server/repository';
import { apiOk, handleApiRoute, requireCurrentUser } from '@/lib/server/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return handleApiRoute(async () => {
    const user = await requireCurrentUser(request);
    const items = await listBlockedUsers(user.id);

    return apiOk({ items });
  });
}
