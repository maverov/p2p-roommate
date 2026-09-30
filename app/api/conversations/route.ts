import {
  createConversation,
  createConversationInputSchema,
  listUserConversations,
} from '@/features/conversations/server/repository';
import { notifyNewMessage } from '@/features/notifications/server/notify';
import { apiCreated, apiOk, handleApiRoute, parseJsonBody, requireCurrentUser } from '@/lib/server/api';
import { runInBackground } from '@/lib/server/background';
import { enforceRateLimit } from '@/lib/server/rate-limit';

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
    await enforceRateLimit('startConversation', user.id);
    const input = await parseJsonBody(request, createConversationInputSchema);
    const { conversation, firstMessageId } = await createConversation(user.id, input);

    if (firstMessageId) {
      runInBackground(notifyNewMessage(firstMessageId), 'notify new conversation');
    }

    return apiCreated(conversation);
  });
}
