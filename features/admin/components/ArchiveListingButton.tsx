'use client';

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { useRouterRefresh } from '@/hooks';
import { apiClient } from '@/lib/api-client';

import { describeError } from './describeError';

const BUTTON =
  'rounded-xl px-3 py-1.5 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50';

export function ArchiveListingButton({ listingId }: { listingId: string }) {
  const { isRefreshing, refresh } = useRouterRefresh();
  const [isConfirming, setIsConfirming] = useState(false);

  const archive = useMutation({
    mutationFn: () => apiClient.patch(`/api/admin/listings/${listingId}`, { status: 'ARCHIVED' }),
    onSuccess: () => refresh(),
  });
  // Busy until the refreshed server data is on screen, not just until the request returns.
  const isBusy = archive.isPending || isRefreshing;

  if (!isConfirming) {
    return (
      <button
        className={`${BUTTON} border border-red-200 text-red-600 hover:bg-red-50`}
        onClick={() => setIsConfirming(true)}
        type="button"
      >
        Archive listing
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[13px] text-brand-ink">
        Remove it from the site? The owner will not be able to edit it.
      </span>
      <button
        className={`${BUTTON} bg-red-600 text-white hover:bg-red-700`}
        disabled={isBusy}
        onClick={() => archive.mutate()}
        type="button"
      >
        Archive
      </button>
      <button
        className={`${BUTTON} border border-brand-border text-brand-ink hover:bg-brand-chip`}
        disabled={isBusy}
        onClick={() => setIsConfirming(false)}
        type="button"
      >
        Keep it
      </button>
      {archive.isError && (
        <p className="w-full text-[13px] text-red-600" role="alert">
          {describeError(archive.error)}
        </p>
      )}
    </div>
  );
}
