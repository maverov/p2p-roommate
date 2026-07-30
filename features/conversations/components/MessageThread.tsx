'use client';

import { useMutation } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import type { ConversationMessage } from '@/features/conversations/server/repository';
import { ApiError, apiClient, buildSearchParams } from '@/lib/api-client';
import { localeTag, type Locale } from '@/lib/i18n';
import { cn } from '@/utils';

type ThreadMessage = ConversationMessage & { optimistic?: boolean };

type MessagesApiResponse = {
  items: Array<{
    id: string;
    body: string;
    senderId: string;
    senderName: string;
    createdAt: string;
  }>;
  nextCursor: string | null;
  nextCursorId: string | null;
};

type MessageThreadProps = {
  conversationId: string;
  currentUserId: string;
  currentUserName: string;
  initialMessages: ConversationMessage[];
  locale: Locale;
};

const FIELD =
  'w-full rounded-[10px] border border-brand-border bg-brand-chip px-3 py-2.5 text-[14px] text-brand-ink outline-none transition placeholder:text-brand-muted/70 focus:border-brand-terracotta focus:bg-white resize-none';

export function MessageThread({
  conversationId,
  currentUserId,
  currentUserName,
  initialMessages,
  locale,
}: MessageThreadProps) {
  const t = useTranslations('messages.thread');

  const [allMessages, setAllMessages] = useState<ThreadMessage[]>(initialMessages);
  const [draft, setDraft] = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /*
   * The cursor tracks the latest message seen by the polling loop. A ref keeps
   * it up-to-date without re-subscribing the interval on every new message.
   */
  const cursorRef = useRef({
    after: initialMessages.at(-1)?.createdAt.toISOString() ?? null,
    afterId: initialMessages.at(-1)?.id ?? null,
  });

  // Scroll to bottom on first render and whenever messages grow.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
  }, []);

  useEffect(() => {
    if (allMessages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [allMessages.length]);

  // Poll for new messages every 3 s using the cursor the server already exposes.
  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        const params = buildSearchParams({
          after: cursorRef.current.after,
          afterId: cursorRef.current.afterId,
        });
        const data = await apiClient.get<MessagesApiResponse>(
          `/api/conversations/${conversationId}/messages${params ? `?${params}` : ''}`,
        );

        if (data.items.length > 0) {
          const incoming: ThreadMessage[] = data.items.map((m) => ({
            id: m.id,
            body: m.body,
            senderId: m.senderId,
            senderName: m.senderName,
            createdAt: new Date(m.createdAt),
          }));

          setAllMessages((prev) => {
            // Deduplicate: the send mutation may have already appended these.
            const knownIds = new Set(prev.map((m) => m.id));
            const novel = incoming.filter((m) => !knownIds.has(m.id));

            return novel.length > 0 ? [...prev, ...novel] : prev;
          });

          if (data.nextCursor) {
            cursorRef.current = {
              after: data.nextCursor,
              afterId: data.nextCursorId,
            };
          }
        }
      } catch {
        // Polling errors are intentionally silent — the user keeps composing.
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [conversationId]);

  const sendMessage = useMutation({
    mutationFn: (body: string) =>
      apiClient.post<{ id: string; body: string; senderId: string; createdAt: string }>(
        `/api/conversations/${conversationId}/messages`,
        { body },
      ),
    onMutate: (body) => {
      // Optimistic message with a temporary id.
      const optimisticId = `optimistic-${Date.now()}`;
      const optimistic: ThreadMessage = {
        id: optimisticId,
        body,
        senderId: currentUserId,
        senderName: currentUserName,
        createdAt: new Date(),
        optimistic: true,
      };
      setAllMessages((prev) => [...prev, optimistic]);

      return { optimisticId };
    },
    onSuccess: (message, _body, context) => {
      // Swap the optimistic placeholder for the confirmed server message.
      setAllMessages((prev) =>
        prev.map((m) =>
          m.id === context?.optimisticId
            ? {
                id: message.id,
                body: message.body,
                senderId: message.senderId,
                senderName: currentUserName,
                createdAt: new Date(message.createdAt),
              }
            : m,
        ),
      );
      cursorRef.current = { after: message.createdAt, afterId: message.id };
      setDraft('');
    },
    onError: (_error, _body, context) => {
      // Remove the failed optimistic message so the user can retry.
      setAllMessages((prev) => prev.filter((m) => m.id !== context?.optimisticId));
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();

    if (!body || sendMessage.isPending) {
      return;
    }

    sendMessage.mutate(body);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Submit on Ctrl/Cmd + Enter.
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {allMessages.length === 0 ? (
          <div className="flex h-full min-h-[120px] flex-col items-center justify-center text-center">
            <p className="text-[15px] font-bold text-brand-ink">{t('noMessages')}</p>
            <p className="mt-1 text-[13px] text-brand-muted">{t('noMessagesBody')}</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3" role="list">
            {allMessages.map((message) => {
              const isOwn = message.senderId === currentUserId;

              return (
                <li
                  key={message.id}
                  className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[70%] rounded-[12px] px-3.5 py-2.5',
                      isOwn
                        ? cn(
                            'bg-brand-terracotta text-white',
                            message.optimistic && 'opacity-70',
                          )
                        : 'border border-brand-border bg-white text-brand-ink',
                    )}
                  >
                    {!isOwn && (
                      <p className="mb-1 text-[11px] font-bold leading-4 text-brand-muted">
                        {message.senderName}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap text-[14px] leading-5">{message.body}</p>
                    <p
                      className={cn(
                        'mt-1 text-[11px] leading-4',
                        isOwn ? 'text-white/70' : 'text-brand-muted',
                      )}
                    >
                      {message.createdAt.toLocaleTimeString(localeTag[locale], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div ref={bottomRef} aria-hidden="true" />
      </div>

      {/* Compose area */}
      <div className="border-t border-brand-border bg-white px-4 py-3">
        {sendMessage.isError && (
          <p className="mb-2 text-[13px] text-brand-terracotta" role="alert">
            {sendMessage.error instanceof ApiError
              ? sendMessage.error.message
              : t('loadFailed')}
          </p>
        )}

        <form className="flex items-end gap-2" onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            className={cn(FIELD, 'max-h-[140px] min-h-[44px]')}
            disabled={sendMessage.isPending}
            maxLength={2000}
            onChange={(e) => {
              setDraft(e.target.value);
              // Auto-grow up to max-height.
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder={t('messagePlaceholder')}
            rows={1}
            value={draft}
          />

          <button
            aria-label={t('send')}
            className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[10px] bg-brand-terracotta text-white transition hover:bg-brand-terracotta-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terracotta disabled:opacity-60"
            disabled={!draft.trim() || sendMessage.isPending}
            type="submit"
          >
            <Send aria-hidden="true" size={18} strokeWidth={2} />
          </button>
        </form>
      </div>
    </div>
  );
}
