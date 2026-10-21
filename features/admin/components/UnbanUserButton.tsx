'use client';
import { useMutation } from '@tanstack/react-query';
import { useRouterRefresh } from '@/hooks';
import { apiClient } from '@/lib/api-client';
import { describeError } from './describeError';

export function UnbanUserButton({ userId }: { userId: string }) {
  const { refresh, isRefreshing } = useRouterRefresh();
  const action = useMutation({
    mutationFn: () => apiClient.delete(`/api/admin/users/${userId}/ban`),
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
        Unban user
      </button>
      {action.isError && <p role="alert">{describeError(action.error)}</p>}
    </div>
  );
}
