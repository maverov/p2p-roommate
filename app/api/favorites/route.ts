import { listSavedListings } from '@/features/listings/server/repository';
import { listSavedProfiles } from '@/features/profiles/server/repository';
import { apiOk, handleApiRoute, requireCurrentUser } from '@/lib/server/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return handleApiRoute(async () => {
    const user = await requireCurrentUser(request);
    const [listings, profiles] = await Promise.all([
      listSavedListings(user.id),
      listSavedProfiles(user.id),
    ]);

    return apiOk({ listings, profiles });
  });
}
