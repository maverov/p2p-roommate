import { listProfileListings } from '@/features/profiles/server/repository';
import { apiOk, getCurrentUser, handleApiRoute } from '@/lib/server/api';
import { apiContactMasker } from '@/lib/server/contact-visibility';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ProfileListingsRouteContext = {
  params: {
    id: string;
  };
};

export async function GET(
  request: Request,
  { params }: ProfileListingsRouteContext,
) {
  return handleApiRoute(async () => {
    const [listings, viewer] = await Promise.all([
      listProfileListings(params.id),
      getCurrentUser(request),
    ]);

    return apiOk({ items: listings.map(apiContactMasker(Boolean(viewer)).listing) });
  });
}
