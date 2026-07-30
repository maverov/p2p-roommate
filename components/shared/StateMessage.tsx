import type { ReactNode } from 'react';

import { cn } from '@/utils';

type StateMessageProps = {
  title: string;
  body?: string;
  /** Rendered under the copy — a retry button or a link back to a safe page. */
  action?: ReactNode;
  tone?: 'neutral' | 'error';
  className?: string;
};

/**
 * The single surface for "nothing here" and "this failed".
 *
 * Every data-backed section renders one of these instead of throwing, so a
 * database hiccup degrades one card rather than blanking the whole page.
 */
export function StateMessage({
  action,
  body,
  className,
  title,
  tone = 'neutral',
}: StateMessageProps) {
  return (
    <div
      className={cn(
        'rounded-[15px] border bg-white px-6 py-10 text-center',
        tone === 'error'
          ? 'border-brand-terracotta/35 bg-[#fdf4f1]'
          : 'border-brand-border',
        className,
      )}
      role={tone === 'error' ? 'alert' : undefined}
    >
      <p className="text-[16px] font-bold leading-6 text-brand-ink">{title}</p>

      {body && (
        <p className="mx-auto mt-1.5 max-w-md text-[14px] leading-6 text-brand-muted">
          {body}
        </p>
      )}

      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
