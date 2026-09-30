'use client';

import { useMutation } from '@tanstack/react-query';
import { Ban, Loader2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, useRef } from 'react';

import { useRouterRefresh } from '@/hooks';
import { apiClient } from '@/lib/api-client';

type BlockUserButtonProps = {
  userId: string;
  displayName: string;
  /** Whether the viewer has blocked this person. The server page is the source of truth. */
  blocked: boolean;
};

const TRIGGER =
  'inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-muted transition hover:text-brand-terracotta focus-visible:outline-2 focus-visible:outline-brand-terracotta disabled:opacity-60';
const BUTTON =
  'inline-flex items-center gap-2 rounded-[10px] px-4 py-2.5 text-[14px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50';

/**
 * Blocking asks for confirmation because it closes every open thread with the person;
 * unblocking is one click. Either way the page re-renders from the server, so the
 * contact panel and composer pick up the new state.
 */
export function BlockUserButton({ blocked, displayName, userId }: BlockUserButtonProps) {
  const t = useTranslations('common.block');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const { isRefreshing, refresh } = useRouterRefresh();

  const toggle = useMutation({
    mutationFn: (next: boolean) =>
      next
        ? apiClient.post(`/api/profiles/${userId}/block`)
        : apiClient.delete(`/api/profiles/${userId}/block`),
    onSuccess: () => {
      dialogRef.current?.close();
      refresh();
    },
  });
  // Busy until the refreshed page is on screen, so the label never flips back early.
  const isBusy = toggle.isPending || isRefreshing;
  const error = toggle.isError && (
    <p className="mt-2 text-[13px] text-red-600" role="alert">
      {t('failed')}
    </p>
  );

  if (blocked) {
    return (
      <div className="text-center">
        <button
          className={TRIGGER}
          disabled={isBusy}
          onClick={() => toggle.mutate(false)}
          type="button"
        >
          {isBusy ? (
            <Loader2 aria-hidden="true" className="animate-spin" size={14} />
          ) : (
            <Ban aria-hidden="true" size={14} strokeWidth={1.8} />
          )}
          {t('unblock')}
        </button>
        {error}
      </div>
    );
  }

  const close = () => dialogRef.current?.close();

  return (
    <>
      <button
        className={TRIGGER}
        onClick={() => {
          toggle.reset();
          dialogRef.current?.showModal();
        }}
        type="button"
      >
        <Ban aria-hidden="true" size={14} strokeWidth={1.8} />
        {t('trigger')}
      </button>

      {/* Native <dialog>: showModal() provides the focus trap, Escape to close and an inert page behind it. */}
      <dialog
        aria-labelledby={headingId}
        className="m-auto w-[min(100%-2rem,26rem)] rounded-[15px] border border-brand-border bg-white p-0 text-brand-ink shadow-[0_24px_64px_rgba(48,51,41,0.24)] backdrop:bg-black/40"
        onClick={(event) => {
          // A click that lands on the <dialog> itself, not its content, is a click on the backdrop.
          if (event.target === event.currentTarget) close();
        }}
        ref={dialogRef}
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-[18px] font-bold leading-6" id={headingId}>
              {t('confirmTitle', { name: displayName })}
            </h2>
            <button
              aria-label={t('close')}
              className="rounded-full p-1.5 text-brand-muted transition hover:bg-brand-chip hover:text-brand-ink"
              onClick={close}
              type="button"
            >
              <X aria-hidden="true" size={18} />
            </button>
          </div>

          <p className="mt-3 text-[14px] leading-6 text-brand-muted">
            {t('confirmBody', { name: displayName })}
          </p>

          {error}

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button
              className={`${BUTTON} border border-brand-border bg-white text-brand-ink hover:bg-brand-chip`}
              onClick={close}
              type="button"
            >
              {t('cancel')}
            </button>
            <button
              className={`${BUTTON} bg-red-600 text-white hover:bg-red-700`}
              disabled={isBusy}
              onClick={() => toggle.mutate(true)}
              type="button"
            >
              {isBusy && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
              {t('confirm')}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
