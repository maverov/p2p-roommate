'use client';

import { useMutation } from '@tanstack/react-query';
import { Check, MessageSquare, Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { ApiError, apiClient } from '@/lib/api-client';
import type { Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import { cn } from '@/utils';

type ContactProfilePanelProps = {
  profileUserId: string;
  locale: Locale;
  isAuthenticated: boolean;
  isOwnProfile: boolean;
  /**
   * The profile's published listings. `null` means the query failed, which is
   * deliberately distinct from `[]` ("this user has no listings") — otherwise a
   * database hiccup would tell the viewer something false about the profile.
   */
  listings: Array<{ id: string; title: string }> | null;
};

const PRIMARY_BUTTON =
  'flex w-full items-center justify-center gap-2 rounded-[10px] bg-brand-terracotta px-4 py-3 text-[14px] font-bold text-white transition hover:bg-brand-terracotta-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terracotta disabled:opacity-60';

const SECONDARY_BUTTON =
  'flex w-full items-center justify-center gap-2 rounded-[10px] border border-brand-border bg-white px-4 py-3 text-[14px] font-bold text-brand-ink transition hover:border-brand-terracotta hover:text-brand-terracotta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terracotta disabled:opacity-60';

const FIELD =
  'w-full rounded-[10px] border border-brand-border bg-white px-3 py-2.5 text-[14px] text-brand-ink outline-none transition placeholder:text-brand-muted/70 focus:border-brand-terracotta';

export function ContactProfilePanel({
  isAuthenticated,
  isOwnProfile,
  listings,
  locale,
  profileUserId,
}: ContactProfilePanelProps) {
  const pathname = usePathname();
  const t = useTranslations('profiles.contact');
  const tCommon = useTranslations('profiles.common');
  const [isComposing, setIsComposing] = useState(false);

  const sendMessage = useMutation({
    mutationFn: (input: { listingId: string; message: string }) =>
      apiClient.post<{ id: string }>('/api/conversations', input),
    onSuccess: () => setIsComposing(false),
  });

  const revealPhone = useMutation({
    mutationFn: () =>
      apiClient.get<{ phoneNumber: string }>(`/api/profiles/${profileUserId}/phone`),
  });

  if (isOwnProfile) {
    return (
      <p className="rounded-[10px] border border-brand-border bg-brand-chip px-4 py-3 text-center text-[13px] text-brand-muted">
        {t('ownProfile')}
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
      ) : listings === null ? (
        <p className="text-[13px] leading-5 text-brand-terracotta" role="alert">
          {tCommon('loadFailed')}
        </p>
      ) : listings.length === 0 ? (
        <p className="rounded-[10px] border border-brand-border bg-brand-chip px-4 py-3 text-[13px] leading-5 text-brand-muted">
          {t('noListings')}
        </p>
      ) : isComposing ? (
        <form
          className="grid gap-2 rounded-[10px] border border-brand-border bg-brand-chip p-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const listingId = String(form.get('listingId') ?? '');
            const message = String(form.get('message') ?? '').trim();

            if (listingId && message) {
              sendMessage.mutate({ listingId, message });
            }
          }}
        >
          {/*
            A conversation is always anchored to a listing (`conversation.listing_id`),
            so messaging a person means choosing which listing to ask about. With a
            single listing there is nothing to choose, so the field is hidden.
          */}
          {listings.length === 1 ? (
            <input name="listingId" type="hidden" value={listings[0].id} />
          ) : (
            <>
              <label
                className="text-[13px] font-bold text-brand-ink"
                htmlFor="profile-message-listing"
              >
                {t('aboutListing')}
              </label>

              <select className={FIELD} id="profile-message-listing" name="listingId" required>
                {listings.map((listing) => (
                  <option key={listing.id} value={listing.id}>
                    {listing.title}
                  </option>
                ))}
              </select>
            </>
          )}

          <label
            className="mt-1 text-[13px] font-bold text-brand-ink"
            htmlFor="profile-message-body"
          >
            {t('sendMessage')}
          </label>

          <textarea
            autoFocus
            className={cn(FIELD, 'min-h-[92px] resize-y')}
            defaultValue={t('messagePlaceholder')}
            id="profile-message-body"
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
              onClick={() => setIsComposing(false)}
              type="button"
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      ) : (
        <button className={PRIMARY_BUTTON} onClick={() => setIsComposing(true)} type="button">
          <MessageSquare aria-hidden="true" size={16} strokeWidth={2} />
          {t('sendMessage')}
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
  const tCommon = useTranslations('profiles.common');

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
