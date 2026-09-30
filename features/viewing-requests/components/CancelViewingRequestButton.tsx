'use client';

import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useRouterRefresh } from '@/hooks';
import { apiClient } from '@/lib/api-client';

type CancelViewingRequestButtonProps = {
  requestId: string;
};

const SECONDARY_BUTTON =
  'rounded-xl border border-brand-border px-2.5 py-1.5 text-[12px] font-medium text-brand-ink transition hover:bg-brand-chip disabled:opacity-50';

export function CancelViewingRequestButton({ requestId }: CancelViewingRequestButtonProps) {
  const t = useTranslations('listings.appliedListings');
  const { isRefreshing, refresh } = useRouterRefresh();
  const [isConfirming, setIsConfirming] = useState(false);

  const cancel = useMutation({
    mutationFn: () =>
      apiClient.patch(`/api/viewing-requests/${requestId}`, { status: 'CANCELLED' }),
    onSuccess: () => refresh(),
  });
  // Busy until the refreshed server data is on screen, not just until the request returns.
  const isBusy = cancel.isPending || isRefreshing;

  if (!isConfirming) {
    return (
      <button className={SECONDARY_BUTTON} onClick={() => setIsConfirming(true)} type="button">
        {t('cancel')}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[12px] text-brand-ink">{t('confirmCancel')}</span>
      <button
        className="flex items-center gap-1.5 rounded-xl bg-red-600 px-2.5 py-1.5 text-[12px] font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
        disabled={isBusy}
        onClick={() => cancel.mutate()}
        type="button"
      >
        {isBusy && <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />}
        {t('confirmCancelYes')}
      </button>
      <button
        className={SECONDARY_BUTTON}
        disabled={isBusy}
        onClick={() => setIsConfirming(false)}
        type="button"
      >
        {t('keep')}
      </button>
      {cancel.isError && (
        <p className="w-full text-[12px] text-red-600" role="alert">
          {t('cancelFailed')}
        </p>
      )}
    </div>
  );
}
