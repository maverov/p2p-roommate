import 'server-only';

import { and, eq, gte, lt, ne } from 'drizzle-orm';

import { db } from '@/db';
import { conversationParticipants, conversations, listings, messages, user } from '@/db/schema';
import { routes } from '@/lib/routes';
import { sendEmail } from '@/lib/server/email';
import { serverEnv } from '@/lib/server/env';

import { emailLocale, emailTranslator, renderEmail } from './templates';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || serverEnv.BETTER_AUTH_URL;

/**
 * A chat is many short messages. Email the recipient only for the first message of a
 * burst — one with no earlier message from the same sender in this window — so a
 * ten-message exchange produces one email, not ten.
 */
const MESSAGE_EMAIL_QUIET_MS = 15 * 60 * 1000;

type AuthEmailUser = { email: string; name: string; locale?: string | null };

export async function sendVerificationEmail(recipient: AuthEmailUser, url: string) {
  const locale = emailLocale(recipient.locale);
  const t = emailTranslator(locale);

  await sendEmail(
    renderEmail({
      to: recipient.email,
      locale,
      subject: t('verifyEmail.subject'),
      heading: t('verifyEmail.heading', { name: recipient.name }),
      paragraphs: [t('verifyEmail.body')],
      action: { label: t('verifyEmail.button'), url },
      footnote: t('verifyEmail.ignore'),
    }),
  );
}

export async function sendPasswordResetEmail(recipient: AuthEmailUser, url: string) {
  const locale = emailLocale(recipient.locale);
  const t = emailTranslator(locale);

  await sendEmail(
    renderEmail({
      to: recipient.email,
      locale,
      subject: t('resetPassword.subject'),
      heading: t('resetPassword.heading', { name: recipient.name }),
      paragraphs: [t('resetPassword.body')],
      action: { label: t('resetPassword.button'), url },
      footnote: t('resetPassword.ignore'),
    }),
  );
}

/** Emails the other participants of the thread about one just-sent message. */
export async function notifyNewMessage(messageId: string) {
  const [latest] = await db
    .select({
      id: messages.id,
      body: messages.body,
      createdAt: messages.createdAt,
      conversationId: messages.conversationId,
      senderId: messages.senderId,
    })
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);

  if (!latest) {
    return;
  }

  const { conversationId, senderId } = latest;

  const [earlier] = await db
    .select({ id: messages.id })
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, conversationId),
        eq(messages.senderId, senderId),
        ne(messages.id, latest.id),
        gte(messages.createdAt, new Date(latest.createdAt.getTime() - MESSAGE_EMAIL_QUIET_MS)),
        lt(messages.createdAt, latest.createdAt),
      ),
    )
    .limit(1);

  if (earlier) {
    return;
  }

  const [sender, recipients, listing] = await Promise.all([
    db.select({ name: user.name }).from(user).where(eq(user.id, senderId)).limit(1),
    db
      .select({ email: user.email, locale: user.locale })
      .from(conversationParticipants)
      .innerJoin(user, eq(user.id, conversationParticipants.userId))
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          ne(conversationParticipants.userId, senderId),
          eq(user.banned, false),
          // Unconfirmed signup addresses may belong to someone else. Never send
          // private conversation contents to an address without proof of ownership.
          eq(user.emailVerified, true),
        ),
      ),
    db
      .select({ title: listings.title })
      .from(conversations)
      .innerJoin(listings, eq(listings.id, conversations.listingId))
      .where(eq(conversations.id, conversationId))
      .limit(1),
  ]);

  const senderName = sender[0]?.name ?? '';
  const listingTitle = listing[0]?.title;

  await Promise.all(
    recipients.map((recipient) => {
      const locale = emailLocale(recipient.locale);
      const t = emailTranslator(locale);

      return sendEmail(
        renderEmail({
          to: recipient.email,
          locale,
          subject: t('newMessage.subject', { sender: senderName }),
          heading: t('newMessage.heading', { sender: senderName }),
          paragraphs: [
            listingTitle
              ? t('newMessage.bodyWithListing', { listing: listingTitle })
              : t('newMessage.body'),
          ],
          quote: latest.body,
          action: {
            label: t('newMessage.button'),
            url: `${appUrl}${routes.conversation(locale, conversationId)}`,
          },
        }),
      );
    }),
  );
}
