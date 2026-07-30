import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ChevronLeft } from 'lucide-react';

import { Avatar } from '@/components/shared/Avatar';
import { StateMessage } from '@/components/shared/StateMessage';
import { MessageThread } from '@/features/conversations/components/MessageThread';
import {
  getConversationDetails,
  listConversationMessages,
  markConversationRead,
} from '@/features/conversations/server/repository';
import { isLocale, type Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import { safeQuery, tryQuery } from '@/lib/server/safe';
import { requireServerUser } from '@/lib/server/session';

type ThreadPageProps = {
  params: { locale: string; id: string };
};

export async function generateMetadata({ params }: ThreadPageProps): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : 'bg';
  const t = await getTranslations({ locale, namespace: 'messages' });

  return {
    title: t('list.heading'),
    robots: { index: false },
  };
}

export default async function ConversationThreadPage({ params }: ThreadPageProps) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const locale: Locale = params.locale;
  const t = await getTranslations({ locale, namespace: 'messages' });
  const user = await requireServerUser(routes.conversation(locale, params.id));

  const outcome = await tryQuery(
    getConversationDetails(params.id, user.id),
    `conversation ${params.id}`,
  );

  if (outcome.status === 'missing') {
    notFound();
  }

  if (outcome.status === 'failed') {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8 lg:px-6">
        <BackLink locale={locale} />
        <div className="mt-4">
          <StateMessage body={t('thread.errorBody')} title={t('thread.errorTitle')} tone="error" />
        </div>
      </main>
    );
  }

  const conversation = outcome.data;

  /*
   * Mark as read immediately — the user is looking at the thread right now.
   * This runs before the initial messages are fetched so the unread badge on
   * the list page also clears on back-navigation without a full reload.
   */
  await markConversationRead(params.id, user.id);

  const initialMessages = await safeQuery(
    listConversationMessages(params.id, user.id),
    `messages ${params.id}`,
  );

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col px-4 py-6 lg:px-6">
      <BackLink locale={locale} />

      {/* Thread header */}
      <div className="mt-4 flex items-center gap-3 rounded-[15px] border border-brand-border bg-white px-4 py-3 shadow-[0_4px_16px_rgba(75,55,35,0.06)]">
        <Avatar name={conversation.otherUserName} size={44} src={conversation.otherUserImage} />

        <div className="min-w-0 flex-1">
          <Link
            className="text-[15px] font-bold text-brand-ink hover:text-brand-terracotta"
            href={routes.profile(locale, conversation.otherUserId)}
          >
            {conversation.otherUserName}
          </Link>

          {conversation.listingTitle ? (
            <p className="truncate text-[13px] text-brand-muted">
              {t('thread.aboutListing')}:{' '}
              {conversation.listingId ? (
                <Link
                  className="hover:text-brand-terracotta"
                  href={routes.listing(locale, conversation.listingId)}
                >
                  {conversation.listingTitle}
                </Link>
              ) : (
                conversation.listingTitle
              )}
            </p>
          ) : (
            <p className="text-[13px] text-brand-muted">{t('thread.directConversation')}</p>
          )}
        </div>
      </div>

      {/* Thread body */}
      <div className="mt-4 flex flex-col overflow-hidden rounded-[15px] border border-brand-border bg-white shadow-[0_4px_16px_rgba(75,55,35,0.06)]" style={{ height: 'min(65vh, 600px)' }}>
        {initialMessages === null ? (
          <div className="flex flex-1 flex-col items-center justify-center p-6">
            <StateMessage
              body={t('thread.loadFailed')}
              title={t('thread.errorTitle')}
              tone="error"
            />
          </div>
        ) : (
          <MessageThread
            conversationId={params.id}
            currentUserId={user.id}
            currentUserName={user.name}
            initialMessages={initialMessages}
            locale={locale}
          />
        )}
      </div>
    </main>
  );
}

async function BackLink({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'messages' });

  return (
    <Link
      className="inline-flex items-center gap-1 text-[14px] text-brand-muted transition hover:text-brand-terracotta"
      href={routes.messages(locale)}
    >
      <ChevronLeft aria-hidden="true" size={16} strokeWidth={2} />
      {t('thread.backToMessages')}
    </Link>
  );
}
