'use client';
import { useMutation } from '@tanstack/react-query';
import { useRouterRefresh } from '@/hooks';
import { apiClient } from '@/lib/api-client';
import { describeError } from './describeError';

export function RestoreListingButton({ listingId }: { listingId: string }) {
  const { refresh, isRefreshing } = useRouterRefresh();
  const action = useMutation({
    mutationFn: () => apiClient.patch(`/api/admin/listings/${listingId}`, { status: 'PAUSED' }),
    onSuccess: () => refresh(),
  });
  return (
    <div>
      <button
        className="rounded-xl border px-3 py-2 text-sm"
        disabled={action.isPending || isRefreshing}
        onClick={() => action.mutate()}
        type="button"
      >
        Restore as paused
      </button>
      {action.isError && <p role="alert">{describeError(action.error)}</p>}
    </div>
  );
}
