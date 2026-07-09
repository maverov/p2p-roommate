import {
  createConversation,
  createConversationInputSchema,
  listUserConversations,
} from '@/features/conversations/server/repository';
import { apiCreated, apiOk, handleApiRoute, parseJsonBody, requireCurrentUser } from '@/lib/server/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return handleApiRoute(async () => {
    const user = await requireCurrentUser(request);
    const conversations = await listUserConversations(user.id);

    return apiOk({ items: conversations });
  });
}

export async function POST(request: Request) {
  return handleApiRoute(async () => {
    const user = await requireCurrentUser(request);
    const input = await parseJsonBody(request, createConversationInputSchema);
    const conversation = await createConversation(user.id, input);

    return apiCreated(conversation);
  });
}
