'use client';

import { useMutation } from '@tanstack/react-query';
import { Loader2, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, useState, type FormEvent } from 'react';

import { useRouterRefresh } from '@/hooks';
import { ApiError, apiClient } from '@/lib/api-client';
import { cn } from '@/utils';

import type { CreateReviewInput } from '../schemas';

/** Mirrors `reviewContentSchema`; the API remains the authority. */
const BODY_MIN_LENGTH = 3;
const BODY_MAX_LENGTH = 2000;
const RATINGS = [1, 2, 3, 4, 5] as const;

type ReviewTarget =
  { targetType: 'LISTING'; listingId: string } | { targetType: 'USER'; targetUserId: string };

type WriteReviewButtonProps = {
  target: ReviewTarget;
  /** What is being reviewed, e.g. "Review the listing". */
  label: string;
};

const SECONDARY_BUTTON =
  'rounded-xl border border-brand-border px-2.5 py-1.5 text-[12px] font-medium text-brand-ink transition hover:bg-brand-chip disabled:opacity-50';

export function WriteReviewButton({ target, label }: WriteReviewButtonProps) {
  const t = useTranslations('reviews.write');
  const id = useId();
  const { isRefreshing, refresh } = useRouterRefresh();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');

  const submit = useMutation({
    mutationFn: () =>
      apiClient.post('/api/reviews', {
        ...target,
        rating,
        body: body.trim(),
      } satisfies CreateReviewInput),
    // The refreshed page no longer offers this prompt, so it unmounts on its own.
    onSuccess: () => refresh(),
    onError: (error) => {
      if (error instanceof ApiError && error.code === 'REVIEW_ALREADY_EXISTS') refresh();
    },
  });
  const isBusy = submit.isPending || isRefreshing;
  const canSubmit = rating > 0 && body.trim().length >= BODY_MIN_LENGTH;

  if (!isOpen) {
    return (
      <button className={SECONDARY_BUTTON} onClick={() => setIsOpen(true)} type="button">
        {label}
      </button>
    );
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (canSubmit) submit.mutate();
  };

  return (
    <form
      aria-label={label}
      className="w-full space-y-3 rounded-[10px] border border-brand-border bg-white p-3"
      onSubmit={onSubmit}
    >
      <fieldset>
        <legend className="mb-1 text-[12px] font-medium text-brand-ink">{t('rating')}</legend>
        <div className="flex gap-1">
          {RATINGS.map((value) => (
            <label className="cursor-pointer" key={value}>
              <input
                checked={rating === value}
                className="peer sr-only"
                name={`${id}-rating`}
                onChange={() => setRating(value)}
                required
                type="radio"
                value={value}
              />
              <Star
                aria-hidden="true"
                className={cn(
                  'size-6 rounded transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-terracotta',
                  value <= rating ? 'fill-amber-400 text-amber-400' : 'text-brand-border',
                )}
              />
              <span className="sr-only">{t('stars', { count: value })}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="mb-1 block text-[12px] font-medium text-brand-ink" htmlFor={`${id}-body`}>
          {t('body')}
        </label>
        <textarea
          className="w-full rounded-[10px] border border-brand-border px-3 py-2 text-[13px] text-brand-ink outline-none transition focus:border-brand-terracotta"
          id={`${id}-body`}
          maxLength={BODY_MAX_LENGTH}
          minLength={BODY_MIN_LENGTH}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t('bodyPlaceholder')}
          required
          rows={3}
          value={body}
        />
        <p className="mt-1 text-[11px] text-brand-muted">{t('publicHint')}</p>
      </div>

      {submit.isError && (
        <p className="text-[12px] text-red-600" role="alert">
          {errorMessage(submit.error, t)}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          className="flex items-center gap-1.5 rounded-xl bg-brand-terracotta px-3 py-1.5 text-[12px] font-medium text-white transition hover:bg-brand-terracotta/90 disabled:opacity-50"
          disabled={isBusy || !canSubmit}
          type="submit"
        >
          {isBusy && <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />}
          {isBusy ? t('submitting') : t('submit')}
        </button>
        <button
          className={SECONDARY_BUTTON}
          disabled={isBusy}
          onClick={() => {
            setIsOpen(false);
            submit.reset();
          }}
          type="button"
        >
          {t('cancel')}
        </button>
      </div>
    </form>
  );
}

function errorMessage(error: Error, t: ReturnType<typeof useTranslations<'reviews.write'>>) {
  if (!(error instanceof ApiError)) return t('failed');
  if (error.status === 429) return t('rateLimited');
  if (error.code === 'REVIEW_NOT_ALLOWED') return t('notAllowed');
  return t('failed');
}
