import {
  createMessage,
  createMessageInputSchema,
  listMessagesQuerySchema,
  listConversationMessages,
} from '@/features/conversations/server/repository';
import { notifyNewMessage } from '@/features/notifications/server/notify';
import {
  apiCreated,
  apiOk,
  handleApiRoute,
  parseJsonBody,
  parseSearchParams,
  requireCurrentUser,
} from '@/lib/server/api';
import { runInBackground } from '@/lib/server/background';
import { enforceRateLimit } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type MessagesRouteContext = {
  params: {
    id: string;
  };
};

export async function GET(request: Request, { params }: MessagesRouteContext) {
  return handleApiRoute(async () => {
    const user = await requireCurrentUser(request);
    const query = parseSearchParams(request, listMessagesQuerySchema);
    const messages = await listConversationMessages(params.id, user.id, query);
    const lastMessage = messages.at(-1);

    return apiOk({
      items: messages,
      nextCursor: lastMessage?.createdAt.toISOString() ?? query.after?.toISOString() ?? null,
      nextCursorId: lastMessage?.id ?? query.afterId ?? null,
      pollAfterMs: 3000,
    });
  });
}

export async function POST(request: Request, { params }: MessagesRouteContext) {
  return handleApiRoute(async () => {
    const user = await requireCurrentUser(request);
    await enforceRateLimit('sendMessage', user.id);
    const input = await parseJsonBody(request, createMessageInputSchema);
    const message = await createMessage(params.id, user.id, input);

    runInBackground(notifyNewMessage(message.id), 'notify new message');

    return apiCreated(message);
  });
}
