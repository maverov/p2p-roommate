'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useTransition } from 'react';

/**
 * `router.refresh()` returns at once; the re-rendered server payload arrives later.
 * Running it inside a transition exposes that wait as `isRefreshing`, so a button can
 * stay busy until the new data is on screen — instead of re-enabling over stale UI and
 * inviting a second click.
 */
export function useRouterRefresh() {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();

  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  return { isRefreshing, refresh };
}
