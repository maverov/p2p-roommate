import { listProfileListings } from '@/features/profiles/server/repository';
import { apiOk, handleApiRoute } from '@/lib/server/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ProfileListingsRouteContext = {
  params: {
    id: string;
  };
};

export async function GET(
  _request: Request,
  { params }: ProfileListingsRouteContext,
) {
  return handleApiRoute(async () => {
    const listings = await listProfileListings(params.id);

    return apiOk({ items: listings });
  });
}
