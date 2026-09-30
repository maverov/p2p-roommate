'use client';

import { useMutation } from '@tanstack/react-query';
import { useId, useState } from 'react';

import { BAN_DURATION_DAYS, type BanUserInput } from '@/features/admin/schemas';
import { useRouterRefresh } from '@/hooks';
import { apiClient } from '@/lib/api-client';

import { describeError } from './describeError';

const BUTTON =
  'rounded-xl px-3 py-1.5 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50';
const FIELD =
  'mt-1.5 w-full rounded-[10px] border border-brand-border bg-white px-3 py-2 text-[14px] text-brand-ink outline-none transition focus:border-brand-terracotta';

const PERMANENT = 'permanent';

type BanUserFormProps = {
  userId: string;
  userName: string;
  /** Pre-fills the reason, usually with the report's own reason. */
  defaultReason: string;
};

export function BanUserForm({ defaultReason, userId, userName }: BanUserFormProps) {
  const { isRefreshing, refresh } = useRouterRefresh();
  const reasonId = useId();
  const durationId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState(defaultReason);
  const [durationDays, setDurationDays] = useState<BanUserInput['durationDays']>(null);

  const ban = useMutation({
    mutationFn: (input: BanUserInput) => apiClient.post(`/api/admin/users/${userId}/ban`, input),
    onSuccess: () => refresh(),
  });
  // Busy until the refreshed server data is on screen, not just until the request returns.
  const isBusy = ban.isPending || isRefreshing;

  if (!isOpen) {
    return (
      <button
        className={`${BUTTON} border border-red-200 text-red-600 hover:bg-red-50`}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        Ban {userName}
      </button>
    );
  }

  const trimmedReason = reason.trim();

  return (
    <form
      className="space-y-3 rounded-xl border border-red-200 bg-red-50/40 p-3"
      onSubmit={(event) => {
        event.preventDefault();
        ban.mutate({ reason: trimmedReason, durationDays });
      }}
    >
      <p className="text-[13px] text-brand-ink">
        Signs {userName} out everywhere, blocks sign-in and pauses their published listings.
      </p>

      <div>
        <label className="block text-[13px] font-semibold text-brand-ink" htmlFor={reasonId}>
          Reason
        </label>
        <input
          className={FIELD}
          id={reasonId}
          maxLength={500}
          onChange={(event) => setReason(event.target.value)}
          value={reason}
        />
      </div>

      <div>
        <label className="block text-[13px] font-semibold text-brand-ink" htmlFor={durationId}>
          Duration
        </label>
        <select
          className={FIELD}
          id={durationId}
          onChange={(event) =>
            setDurationDays(BAN_DURATION_DAYS.find((days) => String(days) === event.target.value) ?? null)
          }
          value={durationDays ?? PERMANENT}
        >
          <option value={PERMANENT}>Permanent</option>
          {BAN_DURATION_DAYS.map((days) => (
            <option key={days} value={days}>
              {days} days
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          className={`${BUTTON} bg-red-600 text-white hover:bg-red-700`}
          disabled={!trimmedReason || isBusy}
          type="submit"
        >
          Ban user
        </button>
        <button
          className={`${BUTTON} border border-brand-border bg-white text-brand-ink hover:bg-brand-chip`}
          disabled={isBusy}
          onClick={() => setIsOpen(false)}
          type="button"
        >
          Cancel
        </button>
      </div>

      {ban.isError && (
        <p className="text-[13px] text-red-600" role="alert">
          {describeError(ban.error)}
        </p>
      )}
    </form>
  );
}
