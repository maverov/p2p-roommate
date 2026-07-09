import { updateSavedSearchInputSchema } from '@/features/saved-searches/schemas';
import {
  deleteSavedSearch,
  updateSavedSearch,
} from '@/features/saved-searches/server/repository';
import {
  apiNoContent,
  apiOk,
  handleApiRoute,
  parseJsonBody,
  requireCurrentUser,
} from '@/lib/server/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SavedSearchRouteContext = {
  params: {
    id: string;
  };
};

export async function PATCH(request: Request, { params }: SavedSearchRouteContext) {
  return handleApiRoute(async () => {
    const user = await requireCurrentUser(request);
    const input = await parseJsonBody(request, updateSavedSearchInputSchema);
    const savedSearch = await updateSavedSearch(params.id, user.id, input);

    return apiOk(savedSearch);
  });
}

export async function DELETE(request: Request, { params }: SavedSearchRouteContext) {
  return handleApiRoute(async () => {
    const user = await requireCurrentUser(request);

    await deleteSavedSearch(params.id, user.id);

    return apiNoContent();
  });
}
