import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { MessageSquare } from 'lucide-react';

import { Avatar } from '@/components/shared/Avatar';
import { StateMessage } from '@/components/shared/StateMessage';
import { listUserConversationsEnriched } from '@/features/conversations/server/repository';
import type { EnrichedConversation } from '@/features/conversations/server/repository';
import { formatDateTime } from '@/lib/format';
import { isLocale, type Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import { safeQuery } from '@/lib/server/safe';
import { requireServerUser } from '@/lib/server/session';
import { cn } from '@/utils';

type MessagesPageProps = {
  params: { locale: string };
};

export async function generateMetadata({ params }: MessagesPageProps): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : 'bg';
  const t = await getTranslations({ locale, namespace: 'messages' });

  return {
    title: t('list.heading'),
    robots: { index: false },
  };
}

export default async function MessagesPage({ params }: MessagesPageProps) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const locale: Locale = params.locale;
  const t = await getTranslations({ locale, namespace: 'messages' });
  const user = await requireServerUser(routes.messages(locale));

  const conversations = await safeQuery(
    listUserConversationsEnriched(user.id),
    `conversations for ${user.id}`,
  );

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 lg:px-6">
      <h1 className="text-[24px] font-bold leading-8 text-brand-ink">{t('list.heading')}</h1>

      <div className="mt-6">
        {conversations === null ? (
          <StateMessage
            body={t('list.errorBody')}
            title={t('list.errorTitle')}
            tone="error"
          />
        ) : conversations.length === 0 ? (
          <StateMessage
            action={
              <Link
                className="rounded-[10px] bg-brand-terracotta px-5 py-2.5 text-[14px] font-bold text-white transition hover:bg-brand-terracotta-hover"
                href={routes.listings(locale)}
              >
                {t('list.browseListings')}
              </Link>
            }
            body={t('list.emptyBody')}
            title={t('list.empty')}
          />
        ) : (
          <ul
            className="divide-y divide-brand-border rounded-[15px] border border-brand-border bg-white shadow-[0_8px_24px_rgba(75,55,35,0.06)]"
            role="list"
          >
            {conversations.map((conversation) => (
              <ConversationRow
                conversation={conversation}
                currentUserId={user.id}
                key={conversation.id}
                locale={locale}
              />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

async function ConversationRow({
  conversation,
  currentUserId,
  locale,
}: {
  conversation: EnrichedConversation;
  currentUserId: string;
  locale: Locale;
}) {
  const t = await getTranslations({ locale, namespace: 'messages' });
  const hasUnread = conversation.unreadCount > 0;
  const timestamp = conversation.lastMessageAt ?? conversation.updatedAt;

  const lastMessagePreview = conversation.lastMessageBody
    ? conversation.lastMessageBody.length > 80
      ? `${conversation.lastMessageBody.slice(0, 80)}…`
      : conversation.lastMessageBody
    : t('list.noMessages');

  return (
    <li className="group relative first:rounded-t-[14px] last:rounded-b-[14px]">
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3.5 transition group-hover:bg-brand-sand/50 first:rounded-t-[14px] last:rounded-b-[14px]',
          hasUnread && 'bg-brand-sand/30',
        )}
      >
        <div className="relative shrink-0">
          <Avatar name={conversation.otherUserName} size={44} src={conversation.otherUserImage} />

          {hasUnread && (
            <span
              aria-hidden="true"
              className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-terracotta px-1 text-[10px] font-bold text-white"
            >
              {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p
              className={cn(
                'truncate text-[15px] leading-5',
                hasUnread ? 'font-bold text-brand-ink' : 'font-semibold text-brand-ink',
              )}
            >
              {conversation.otherUserName}
            </p>

            <time
              className="shrink-0 text-[12px] text-brand-muted"
              dateTime={timestamp.toISOString()}
            >
              {formatDateTime(timestamp, locale)}
            </time>
          </div>

          {conversation.listingTitle && (
            <p className="flex items-center gap-1 text-[12px] leading-4 text-brand-muted">
              <MessageSquare aria-hidden="true" size={11} strokeWidth={1.8} />
              {conversation.listingTitle}
            </p>
          )}

          <p
            className={cn(
              'mt-0.5 truncate text-[13px] leading-5',
              hasUnread ? 'font-medium text-brand-ink' : 'text-brand-muted',
            )}
          >
            {lastMessagePreview}
          </p>
        </div>

        {hasUnread && (
          <span className="sr-only">
            {t('list.unreadCount', { count: conversation.unreadCount })}
          </span>
        )}
      </div>

      {/*
        Full-row overlay link keeps the row clickable without nesting interactive
        elements inside an anchor — same pattern as ListingCard.
      */}
      <Link
        className="absolute inset-0 rounded-[inherit] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-terracotta"
        href={routes.conversation(locale, conversation.id)}
      >
        <span className="sr-only">{conversation.otherUserName}</span>
      </Link>
    </li>
  );
}
