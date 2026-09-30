'use client';

import { useMutation } from '@tanstack/react-query';
import { Flag, X } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useId, useRef, useState } from 'react';

import type { CreateReportInput } from '@/features/reports/schemas';
import { ApiError, apiClient } from '@/lib/api-client';
import { LISTING_REPORT_REASONS, USER_REPORT_REASONS, type ReportReason } from '@/lib/labels';
import { routes } from '@/lib/routes';

type ReportSubject = { listingId: string } | { reportedUserId: string };

type ReportButtonProps = {
  subject: ReportSubject;
  isAuthenticated: boolean;
};

const TRIGGER =
  'inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-muted transition hover:text-brand-terracotta focus-visible:outline-2 focus-visible:outline-brand-terracotta';
const BUTTON =
  'rounded-[10px] px-4 py-2.5 text-[14px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50';

export function ReportButton({ isAuthenticated, subject }: ReportButtonProps) {
  const t = useTranslations('common.report');
  const tEnums = useTranslations('enums');
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const detailsId = useId();
  const reasonName = useId();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');

  const report = useMutation({
    mutationFn: (input: CreateReportInput) => apiClient.post('/api/reports', input),
  });

  const isListing = 'listingId' in subject;
  const triggerLabel = isListing ? t('listingTrigger') : t('userTrigger');
  const reasons = isListing ? LISTING_REPORT_REASONS : USER_REPORT_REASONS;
  const trimmedDetails = details.trim();
  const detailsRequired = reason === 'OTHER';

  const trigger = (
    <>
      <Flag aria-hidden="true" size={14} strokeWidth={1.8} />
      {triggerLabel}
    </>
  );

  if (!isAuthenticated) {
    return (
      <Link className={TRIGGER} href={routes.login(pathname)} title={t('signInToReport')}>
        {trigger}
      </Link>
    );
  }

  const open = () => {
    report.reset();
    setReason(null);
    setDetails('');
    dialogRef.current?.showModal();
  };

  const close = () => dialogRef.current?.close();

  const errorMessage =
    report.error instanceof ApiError && report.error.code === 'ALREADY_REPORTED'
      ? t('alreadyReported')
      : t('failed');

  return (
    <>
      <button className={TRIGGER} onClick={open} type="button">
        {trigger}
      </button>

      {/* Native <dialog>: showModal() provides the focus trap, Escape to close and an inert page behind it. */}
      <dialog
        aria-labelledby={headingId}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[min(100%-2rem,28rem)] overflow-y-auto rounded-[15px] border border-brand-border bg-white p-0 text-brand-ink shadow-[0_24px_64px_rgba(48,51,41,0.24)] backdrop:bg-black/40"
        onClick={(event) => {
          // A click that lands on the <dialog> itself, not its content, is a click on the backdrop.
          if (event.target === event.currentTarget) close();
        }}
        ref={dialogRef}
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-[18px] font-bold leading-6" id={headingId}>
              {report.isSuccess ? t('successTitle') : triggerLabel}
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

          {report.isSuccess ? (
            <>
              <p className="mt-3 text-[14px] leading-6 text-brand-muted">{t('successBody')}</p>
              <button
                className={`${BUTTON} mt-5 w-full bg-brand-terracotta text-white hover:bg-brand-terracotta-hover`}
                onClick={close}
                type="button"
              >
                {t('close')}
              </button>
            </>
          ) : (
            <form
              className="mt-2"
              onSubmit={(event) => {
                event.preventDefault();

                if (reason) {
                  report.mutate({
                    ...subject,
                    reason,
                    ...(trimmedDetails ? { details: trimmedDetails } : {}),
                  });
                }
              }}
            >
              <p className="text-[13px] leading-5 text-brand-muted">{t('intro')}</p>

              <fieldset className="mt-4">
                <legend className="text-[14px] font-semibold">{t('reasonLegend')}</legend>
                <div className="mt-2 grid gap-2">
                  {reasons.map((value) => (
                    <label
                      className="flex cursor-pointer items-center gap-2.5 rounded-[10px] border border-brand-border px-3 py-2.5 text-[14px] transition hover:border-brand-terracotta/60 has-[:checked]:border-brand-terracotta has-[:checked]:bg-brand-chip"
                      key={value}
                    >
                      <input
                        checked={reason === value}
                        className="accent-brand-terracotta"
                        name={reasonName}
                        onChange={() => setReason(value)}
                        required
                        type="radio"
                        value={value}
                      />
                      {tEnums(`reportReason.${value}`)}
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="mt-4 block text-[14px] font-semibold" htmlFor={detailsId}>
                {detailsRequired ? t('details') : t('detailsOptional')}
              </label>
              <textarea
                aria-describedby={detailsRequired && !trimmedDetails ? `${detailsId}-hint` : undefined}
                className="mt-1.5 w-full resize-y rounded-[10px] border border-brand-border bg-brand-chip px-3 py-2.5 text-[14px] outline-none transition placeholder:text-brand-muted/70 focus:border-brand-terracotta focus:bg-white"
                id={detailsId}
                maxLength={2000}
                onChange={(event) => setDetails(event.target.value)}
                placeholder={t('detailsPlaceholder')}
                required={detailsRequired}
                rows={3}
                value={details}
              />
              {detailsRequired && !trimmedDetails && (
                <p className="mt-1 text-[12px] text-brand-muted" id={`${detailsId}-hint`}>
                  {t('detailsRequired')}
                </p>
              )}

              {report.isError && (
                <p className="mt-3 text-[13px] text-red-600" role="alert">
                  {errorMessage}
                </p>
              )}

              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <button
                  className={`${BUTTON} border border-brand-border bg-white text-brand-ink hover:bg-brand-chip`}
                  onClick={close}
                  type="button"
                >
                  {t('cancel')}
                </button>
                <button
                  className={`${BUTTON} bg-brand-terracotta text-white hover:bg-brand-terracotta-hover`}
                  disabled={!reason || (detailsRequired && !trimmedDetails) || report.isPending}
                  type="submit"
                >
                  {t('submit')}
                </button>
              </div>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}
