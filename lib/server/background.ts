import 'server-only';

import { waitUntil } from '@vercel/functions';

/**
 * Runs `task` after the response is sent. On Vercel, `waitUntil` keeps the function
 * alive until the task settles; on a long-running Node server it is a no-op and the
 * already-started promise simply keeps running. A failure is logged, never surfaced to
 * the request that triggered it.
 */
export function runInBackground(task: Promise<unknown>, context: string) {
  waitUntil(
    task.catch((error) => {
      console.error(`[background] ${context} failed`, error);
    }),
  );
}
