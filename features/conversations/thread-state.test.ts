import { describe, expect, it } from 'vitest';

import { initialThreadState, threadReducer, type ThreadMessage } from './thread-state';

const message = (id: string, seconds: number): ThreadMessage => ({
  id,
  body: id,
  senderId: 'user',
  senderName: 'User',
  createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, seconds)),
});

describe('message polling and send ordering', () => {
  it('fetches the incoming reply before an outgoing message, without skipping or duplicating either', () => {
    const first = message('first', 0);
    const incoming = message('incoming', 1);
    const outgoing = message('outgoing', 2);
    let state = initialThreadState([first]);
    state = threadReducer(state, { type: 'sent', message: outgoing });
    expect(state.cursor.afterId).toBe(first.id);
    // The next poll still starts before the incoming reply.
    const fetched = [incoming, outgoing].filter((m) => m.createdAt > new Date(state.cursor.after!));
    const action = {
      type: 'received' as const,
      messages: fetched,
      cursor: { after: outgoing.createdAt.toISOString(), afterId: outgoing.id },
    };
    state = threadReducer(state, action);
    state = threadReducer(state, action);
    expect(state.messages.map((m) => m.id)).toEqual(['first', 'incoming', 'outgoing']);
    expect(state.cursor.afterId).toBe(outgoing.id);
  });

  it('deduplicates a send response that arrives after polling has fetched the same message', () => {
    const sent = message('sent', 2);
    let state = initialThreadState([]);
    state = threadReducer(state, {
      type: 'optimistic',
      message: { ...sent, id: 'temp', optimistic: true },
    });
    state = threadReducer(state, {
      type: 'received',
      messages: [sent],
      cursor: { after: sent.createdAt.toISOString(), afterId: sent.id },
    });
    state = threadReducer(state, { type: 'sent', message: sent, optimisticId: 'temp' });
    expect(state.messages).toEqual([sent]);
  });

  it('orders equal timestamps by id and preserves the cursor after a failed send', () => {
    let state = initialThreadState([message('b', 0)]);
    state = threadReducer(state, { type: 'sent', message: message('a', 0) });
    state = threadReducer(state, { type: 'optimistic', message: message('temp', 1) });
    state = threadReducer(state, { type: 'failed', optimisticId: 'temp' });
    expect(state.messages.map((m) => m.id)).toEqual(['a', 'b']);
    expect(state.cursor.afterId).toBe('b');
  });
});
