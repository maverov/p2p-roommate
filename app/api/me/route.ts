import { apiOk, getCurrentUser, handleApiRoute } from '@/lib/server/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return handleApiRoute(async () => {
    const user = await getCurrentUser(request);

    return apiOk({ user });
  });
}
