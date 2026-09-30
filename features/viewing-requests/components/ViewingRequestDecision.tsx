'use client';

import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useRouterRefresh } from '@/hooks';
import { apiClient } from '@/lib/api-client';

type Decision = 'ACCEPTED' | 'DECLINED';

type ViewingRequestDecisionProps = {
  requestId: string;
};

const SECONDARY_BUTTON =
  'rounded-xl border border-brand-border px-2.5 py-1.5 text-[12px] font-medium text-brand-ink transition hover:bg-brand-chip disabled:opacity-50';

export function ViewingRequestDecision({ requestId }: ViewingRequestDecisionProps) {
  const t = useTranslations('listings.myListings.requests');
  const { isRefreshing, refresh } = useRouterRefresh();
  const [isConfirmingDecline, setIsConfirmingDecline] = useState(false);

  const decide = useMutation({
    mutationFn: (status: Decision) =>
      apiClient.patch(`/api/viewing-requests/${requestId}`, { status }),
    onSuccess: () => refresh(),
  });
  // Busy until the refreshed server data is on screen, not just until the request returns.
  const isBusy = decide.isPending || isRefreshing;
  const pendingDecision = isBusy ? decide.variables : undefined;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isConfirmingDecline ? (
        <>
          <span className="text-[12px] text-brand-ink">{t('confirmDecline')}</span>
          <button
            className="flex items-center gap-1.5 rounded-xl bg-red-600 px-2.5 py-1.5 text-[12px] font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
            disabled={isBusy}
            onClick={() => decide.mutate('DECLINED')}
            type="button"
          >
            {pendingDecision === 'DECLINED' && (
              <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
            )}
            {t('confirmDeclineYes')}
          </button>
          <button
            className={SECONDARY_BUTTON}
            disabled={isBusy}
            onClick={() => setIsConfirmingDecline(false)}
            type="button"
          >
            {t('keep')}
          </button>
        </>
      ) : (
        <>
          <button
            className="flex items-center gap-1.5 rounded-xl bg-brand-olive px-2.5 py-1.5 text-[12px] font-medium text-white transition hover:bg-brand-olive/90 disabled:opacity-50"
            disabled={isBusy}
            onClick={() => decide.mutate('ACCEPTED')}
            type="button"
          >
            {pendingDecision === 'ACCEPTED' && (
              <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
            )}
            {t('accept')}
          </button>
          <button
            className={SECONDARY_BUTTON}
            disabled={isBusy}
            onClick={() => setIsConfirmingDecline(true)}
            type="button"
          >
            {t('decline')}
          </button>
        </>
      )}
      {decide.isError && (
        <p className="w-full text-[12px] text-red-600" role="alert">
          {t('decisionFailed')}
        </p>
      )}
    </div>
  );
}
