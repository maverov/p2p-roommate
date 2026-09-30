'use client';

import { useMutation } from '@tanstack/react-query';
import { useId, useState } from 'react';

import type { UpdateReportInput } from '@/features/admin/schemas';
import { useRouterRefresh } from '@/hooks';
import { apiClient } from '@/lib/api-client';
import type { ReportStatus } from '@/lib/labels';

import { describeError } from './describeError';

const BUTTON =
  'rounded-xl px-3 py-2 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50';

type ReportDecisionFormProps = {
  reportId: string;
  /** Computed on the server from the report's current status. */
  allowedStatuses: readonly ReportStatus[];
};

export function ReportDecisionForm({ allowedStatuses, reportId }: ReportDecisionFormProps) {
  const { isRefreshing, refresh } = useRouterRefresh();
  const noteId = useId();
  const [note, setNote] = useState('');

  const decide = useMutation({
    mutationFn: (input: UpdateReportInput) => apiClient.patch(`/api/admin/reports/${reportId}`, input),
    onSuccess: () => {
      setNote('');
      refresh();
    },
  });
  // Busy until the refreshed server data is on screen, not just until the request returns.
  const isBusy = decide.isPending || isRefreshing;

  const trimmedNote = note.trim();
  const canClose = allowedStatuses.includes('RESOLVED');

  return (
    <div className="space-y-3">
      {allowedStatuses.includes('REVIEWING') && (
        <button
          className={`${BUTTON} border border-brand-border bg-white text-brand-ink hover:bg-brand-chip`}
          disabled={isBusy}
          onClick={() => decide.mutate({ status: 'REVIEWING' })}
          type="button"
        >
          Start review
        </button>
      )}

      {canClose && (
        <>
          <div>
            <label className="block text-[13px] font-semibold text-brand-ink" htmlFor={noteId}>
              Resolution note
            </label>
            <textarea
              className="mt-1.5 w-full resize-y rounded-[10px] border border-brand-border bg-white px-3 py-2 text-[14px] text-brand-ink outline-none transition placeholder:text-brand-muted/70 focus:border-brand-terracotta"
              id={noteId}
              maxLength={1000}
              onChange={(event) => setNote(event.target.value)}
              placeholder="What was done, or why no action is needed. Required to close the report."
              rows={3}
              value={note}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className={`${BUTTON} bg-brand-terracotta text-white hover:bg-brand-terracotta-hover`}
              disabled={!trimmedNote || isBusy}
              onClick={() => decide.mutate({ status: 'RESOLVED', note: trimmedNote })}
              type="button"
            >
              Resolve
            </button>
            <button
              className={`${BUTTON} border border-brand-border bg-white text-brand-ink hover:bg-brand-chip`}
              disabled={!trimmedNote || isBusy}
              onClick={() => decide.mutate({ status: 'DISMISSED', note: trimmedNote })}
              type="button"
            >
              Dismiss
            </button>
          </div>
        </>
      )}

      {decide.isError && (
        <p className="text-[13px] text-red-600" role="alert">
          {describeError(decide.error)}
        </p>
      )}
    </div>
  );
}
