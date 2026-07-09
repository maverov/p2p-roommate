import {
  createSavedSearchInputSchema,
} from '@/features/saved-searches/schemas';
import {
  createSavedSearch,
  listSavedSearches,
} from '@/features/saved-searches/server/repository';
import { apiCreated, apiOk, handleApiRoute, parseJsonBody, requireCurrentUser } from '@/lib/server/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return handleApiRoute(async () => {
    const user = await requireCurrentUser(request);
    const savedSearches = await listSavedSearches(user.id);

    return apiOk({ items: savedSearches });
  });
}

export async function POST(request: Request) {
  return handleApiRoute(async () => {
    const user = await requireCurrentUser(request);
    const input = await parseJsonBody(request, createSavedSearchInputSchema);
    const savedSearch = await createSavedSearch(user.id, input);

    return apiCreated(savedSearch);
  });
}
