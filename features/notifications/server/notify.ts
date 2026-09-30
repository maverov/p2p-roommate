import 'server-only';

import { and, eq, gte, lt, ne } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { db } from '@/db';
import {
  conversationParticipants,
  conversations,
  listings,
  messages,
  user,
  viewingRequests,
} from '@/db/schema';
import { OWNER_REQUESTS_ANCHOR } from '@/features/viewing-requests/constants';
import { formatDateTime } from '@/lib/format';
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

const requester = alias(user, 'requester');
const owner = alias(user, 'owner');

async function loadViewingRequest(requestId: string) {
  const [row] = await db
    .select({
      message: viewingRequests.message,
      requestedStartAt: viewingRequests.requestedStartAt,
      listingTitle: listings.title,
      requester: { name: requester.name, email: requester.email, locale: requester.locale },
      owner: { name: owner.name, email: owner.email, locale: owner.locale },
    })
    .from(viewingRequests)
    .innerJoin(listings, eq(listings.id, viewingRequests.listingId))
    .innerJoin(requester, eq(requester.id, viewingRequests.requesterId))
    .innerJoin(owner, eq(owner.id, viewingRequests.ownerId))
    .where(eq(viewingRequests.id, requestId))
    .limit(1);

  return row;
}

export async function notifyViewingRequestCreated(requestId: string) {
  const request = await loadViewingRequest(requestId);

  if (!request) {
    return;
  }

  const locale = emailLocale(request.owner.locale);
  const t = emailTranslator(locale);
  const when = formatDateTime(request.requestedStartAt, locale);

  await sendEmail(
    renderEmail({
      to: request.owner.email,
      locale,
      subject: t('newViewingRequest.subject', { listing: request.listingTitle }),
      heading: t('newViewingRequest.heading'),
      paragraphs: [
        t('newViewingRequest.body', {
          requester: request.requester.name,
          listing: request.listingTitle,
          when,
        }),
        ...(request.message ? [t('newViewingRequest.messageLabel')] : []),
      ],
      quote: request.message,
      action: {
        label: t('newViewingRequest.button'),
        url: `${appUrl}${routes.myListings(locale)}#${OWNER_REQUESTS_ANCHOR}`,
      },
    }),
  );
}

/** Tells the other side about an owner's decision or a requester's cancellation. */
export async function notifyViewingRequestStatus(
  requestId: string,
  status: 'ACCEPTED' | 'DECLINED' | 'CANCELLED',
) {
  const request = await loadViewingRequest(requestId);

  if (!request) {
    return;
  }

  const recipient = status === 'CANCELLED' ? request.owner : request.requester;
  const locale = emailLocale(recipient.locale);
  const t = emailTranslator(locale);
  const values = {
    owner: request.owner.name,
    requester: request.requester.name,
    listing: request.listingTitle,
    when: formatDateTime(request.requestedStartAt, locale),
  };

  const content =
    status === 'ACCEPTED'
      ? {
          subject: t('viewingAccepted.subject', values),
          heading: t('viewingAccepted.heading'),
          body: t('viewingAccepted.body', values),
          button: t('viewingAccepted.button'),
          url: routes.appliedListings(locale),
        }
      : status === 'DECLINED'
        ? {
            subject: t('viewingDeclined.subject', values),
            heading: t('viewingDeclined.heading'),
            body: t('viewingDeclined.body', values),
            button: t('viewingDeclined.button'),
            url: routes.listings(locale),
          }
        : {
            subject: t('viewingCancelled.subject', values),
            heading: t('viewingCancelled.heading'),
            body: t('viewingCancelled.body', values),
            button: t('viewingCancelled.button'),
            url: `${routes.myListings(locale)}#${OWNER_REQUESTS_ANCHOR}`,
          };

  await sendEmail(
    renderEmail({
      to: recipient.email,
      locale,
      subject: content.subject,
      heading: content.heading,
      paragraphs: [content.body],
      action: { label: content.button, url: `${appUrl}${content.url}` },
    }),
  );
}
