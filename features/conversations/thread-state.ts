import type { ConversationMessage } from './server/repository';

export type ThreadMessage = ConversationMessage & { optimistic?: boolean };
export type ThreadState = {
  messages: ThreadMessage[];
  cursor: { after: string | null; afterId: string | null };
};
type Action =
  | { type: 'optimistic'; message: ThreadMessage }
  | { type: 'sent'; message: ThreadMessage; optimisticId?: string }
  | { type: 'failed'; optimisticId?: string }
  | { type: 'received'; messages: ThreadMessage[]; cursor: ThreadState['cursor'] };

export function initialThreadState(messages: ConversationMessage[]): ThreadState {
  return {
    messages,
    cursor: {
      after: messages.at(-1)?.createdAt.toISOString() ?? null,
      afterId: messages.at(-1)?.id ?? null,
    },
  };
}

function merge(messages: ThreadMessage[], incoming: ThreadMessage[]) {
  const byId = new Map(messages.map((message) => [message.id, message]));
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort(
    (a, b) =>
      a.createdAt.getTime() - b.createdAt.getTime() || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
}

export function threadReducer(state: ThreadState, action: Action): ThreadState {
  switch (action.type) {
    case 'optimistic':
      return { ...state, messages: [...state.messages, action.message] };
    case 'failed':
      return { ...state, messages: state.messages.filter((m) => m.id !== action.optimisticId) };
    case 'sent':
      // Sending proves nothing about incoming messages between polls. Keep the cursor.
      return {
        ...state,
        messages: merge(
          state.messages.filter((m) => m.id !== action.optimisticId),
          [action.message],
        ),
      };
    case 'received':
      return {
        messages: merge(state.messages, action.messages),
        cursor: action.cursor.after ? action.cursor : state.cursor,
      };
  }
}
