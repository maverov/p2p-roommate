'use client';

import { useMutation } from '@tanstack/react-query';
import { CalendarDays, Check, MessageSquare, Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { ApiError, apiClient } from '@/lib/api-client';
import type { Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import { cn } from '@/utils';

type ContactOwnerPanelProps = {
  listingId: string;
  ownerId: string;
  locale: Locale;
  isAuthenticated: boolean;
  isOwner: boolean;
};

type ActiveForm = 'message' | 'viewing' | null;

const PRIMARY_BUTTON =
  'flex w-full items-center justify-center gap-2 rounded-[10px] bg-brand-terracotta px-4 py-3 text-[14px] font-bold text-white transition hover:bg-brand-terracotta-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terracotta disabled:opacity-60';

const SECONDARY_BUTTON =
  'flex w-full items-center justify-center gap-2 rounded-[10px] border border-brand-border bg-white px-4 py-3 text-[14px] font-bold text-brand-ink transition hover:border-brand-terracotta hover:text-brand-terracotta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terracotta disabled:opacity-60';

const FIELD =
  'w-full rounded-[10px] border border-brand-border bg-brand-chip px-3 py-2.5 text-[14px] text-brand-ink outline-none transition placeholder:text-brand-muted/70 focus:border-brand-terracotta focus:bg-white';

/** `datetime-local` needs `YYYY-MM-DDTHH:mm` in local time, not an ISO string. */
function toLocalInputValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function ContactOwnerPanel({
  isAuthenticated,
  isOwner,
  listingId,
  locale,
  ownerId,
}: ContactOwnerPanelProps) {
  const pathname = usePathname();
  const t = useTranslations('listings.detail');
  const [activeForm, setActiveForm] = useState<ActiveForm>(null);

  const sendMessage = useMutation({
    mutationFn: (message: string) =>
      apiClient.post<{ id: string }>('/api/conversations', { listingId, message }),
    onSuccess: () => setActiveForm(null),
  });

  const requestViewing = useMutation({
    mutationFn: (input: { requestedStartAt: string; message?: string }) =>
      apiClient.post(`/api/listings/${listingId}/viewing-requests`, input),
    onSuccess: () => setActiveForm(null),
  });

  const revealPhone = useMutation({
    mutationFn: () =>
      apiClient.get<{ phoneNumber: string }>(`/api/profiles/${ownerId}/phone`),
  });

  if (isOwner) {
    return (
      <p className="rounded-[10px] border border-brand-border bg-brand-chip px-4 py-3 text-center text-[13px] text-brand-muted">
        {t('ownListing')}
      </p>
    );
  }

  if (!isAuthenticated) {
    const loginHref = routes.login(pathname);

    return (
      <div className="grid gap-2">
        <Link className={PRIMARY_BUTTON} href={loginHref}>
          <MessageSquare aria-hidden="true" size={16} strokeWidth={2} />
          {t('sendMessage')}
        </Link>

        <Link className={SECONDARY_BUTTON} href={loginHref}>
          <CalendarDays aria-hidden="true" size={16} strokeWidth={2} />
          {t('requestViewing')}
        </Link>

        <Link className={SECONDARY_BUTTON} href={loginHref}>
          <Phone aria-hidden="true" size={16} strokeWidth={2} />
          {t('phoneHidden')}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {sendMessage.isSuccess ? (
        <div className="rounded-[10px] border border-brand-olive/40 bg-[#f7f8ef] px-4 py-3 text-[13px] text-brand-ink">
          <p className="flex items-center gap-2 font-bold">
            <Check aria-hidden="true" size={15} strokeWidth={2.4} />
            {t('messageSent')}
          </p>

          <Link
            className="mt-1.5 inline-block font-bold text-brand-terracotta underline-offset-2 hover:underline"
            href={routes.conversation(locale, sendMessage.data.id)}
          >
            {t('openConversation')} →
          </Link>
        </div>
      ) : activeForm === 'message' ? (
        <form
          className="grid gap-2 rounded-[10px] border border-brand-border bg-brand-chip p-3"
          onSubmit={(event) => {
            event.preventDefault();
            const message = new FormData(event.currentTarget).get('message');

            if (typeof message === 'string' && message.trim()) {
              sendMessage.mutate(message.trim());
            }
          }}
        >
          <label className="text-[13px] font-bold text-brand-ink" htmlFor="contact-message">
            {t('sendMessage')}
          </label>

          <textarea
            autoFocus
            className={cn(FIELD, 'min-h-[92px] resize-y bg-white')}
            defaultValue={t('messagePlaceholder')}
            id="contact-message"
            maxLength={2000}
            name="message"
            required
          />

          <FormError error={sendMessage.error} />

          <div className="flex gap-2">
            <button className={PRIMARY_BUTTON} disabled={sendMessage.isPending} type="submit">
              {t('submit')}
            </button>

            <button
              className={SECONDARY_BUTTON}
              onClick={() => setActiveForm(null)}
              type="button"
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      ) : (
        <button
          className={PRIMARY_BUTTON}
          onClick={() => setActiveForm('message')}
          type="button"
        >
          <MessageSquare aria-hidden="true" size={16} strokeWidth={2} />
          {t('sendMessage')}
        </button>
      )}

      {requestViewing.isSuccess ? (
        <p className="flex items-center gap-2 rounded-[10px] border border-brand-olive/40 bg-[#f7f8ef] px-4 py-3 text-[13px] font-bold text-brand-ink">
          <Check aria-hidden="true" size={15} strokeWidth={2.4} />
          {t('viewingSent')}
        </p>
      ) : activeForm === 'viewing' ? (
        <form
          className="grid gap-2 rounded-[10px] border border-brand-border bg-brand-chip p-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const requestedStartAt = String(form.get('requestedStartAt') ?? '');
            const message = String(form.get('message') ?? '').trim();

            if (requestedStartAt) {
              requestViewing.mutate({
                // The input is local time; the API stores UTC.
                requestedStartAt: new Date(requestedStartAt).toISOString(),
                message: message || undefined,
              });
            }
          }}
        >
          <label className="text-[13px] font-bold text-brand-ink" htmlFor="viewing-date">
            {t('viewingDate')}
          </label>

          <input
            autoFocus
            className={cn(FIELD, 'bg-white')}
            defaultValue={toLocalInputValue(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000))}
            id="viewing-date"
            name="requestedStartAt"
            required
            type="datetime-local"
          />

          <label className="mt-1 text-[13px] font-bold text-brand-ink" htmlFor="viewing-note">
            {t('viewingNote')}
          </label>

          <textarea
            className={cn(FIELD, 'min-h-[64px] resize-y bg-white')}
            id="viewing-note"
            maxLength={1000}
            name="message"
            placeholder={t('viewingNotePlaceholder')}
          />

          <FormError error={requestViewing.error} />

          <div className="flex gap-2">
            <button
              className={PRIMARY_BUTTON}
              disabled={requestViewing.isPending}
              type="submit"
            >
              {t('submit')}
            </button>

            <button
              className={SECONDARY_BUTTON}
              onClick={() => setActiveForm(null)}
              type="button"
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      ) : (
        <button
          className={SECONDARY_BUTTON}
          onClick={() => setActiveForm('viewing')}
          type="button"
        >
          <CalendarDays aria-hidden="true" size={16} strokeWidth={2} />
          {t('requestViewing')}
        </button>
      )}

      {revealPhone.data ? (
        <a
          className={cn(SECONDARY_BUTTON, 'border-brand-terracotta text-brand-terracotta')}
          href={`tel:${revealPhone.data.phoneNumber.replace(/\s/g, '')}`}
        >
          <Phone aria-hidden="true" size={16} strokeWidth={2} />
          {revealPhone.data.phoneNumber}
        </a>
      ) : (
        <>
          <button
            className={SECONDARY_BUTTON}
            disabled={revealPhone.isPending}
            onClick={() => revealPhone.mutate()}
            type="button"
          >
            <Phone aria-hidden="true" size={16} strokeWidth={2} />
            {t('showPhone')}
          </button>

          <FormError
            error={revealPhone.error}
            fallback={
              revealPhone.error instanceof ApiError &&
              (revealPhone.error.isForbidden || revealPhone.error.isNotFound)
                ? t('phonePrivate')
                : undefined
            }
          />
        </>
      )}
    </div>
  );
}

function FormError({ error, fallback }: { error: unknown; fallback?: string }) {
  const tCommon = useTranslations('listings.common');

  if (!error) {
    return null;
  }

  const message =
    fallback ?? (error instanceof ApiError ? error.message : tCommon('loadFailed'));

  return (
    <p className="text-[13px] leading-5 text-brand-terracotta" role="alert">
      {message}
    </p>
  );
}
