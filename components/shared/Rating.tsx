import { Star } from 'lucide-react';

import { formatRating } from '@/lib/format';
import type { Locale } from '@/lib/i18n';
import { cn } from '@/utils';

type RatingProps = {
  value: number;
  locale: Locale;
  /** Appended after the number, e.g. "(12 reviews)". */
  caption?: string;
  size?: number;
  className?: string;
};

/**
 * Stars are decorative; the accessible value is the number, which is why the
 * icons are `aria-hidden` and the rating is announced via the wrapper's label.
 */
export function Rating({ caption, className, locale, size = 15, value }: RatingProps) {
  const filled = Math.round(value);

  return (
    <span
      aria-label={caption ? `${formatRating(value, locale)} — ${caption}` : undefined}
      className={cn('inline-flex items-center gap-1.5 text-[13px]', className)}
    >
      <span aria-hidden="true" className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            className={
              star <= filled
                ? 'fill-brand-terracotta text-brand-terracotta'
                : 'text-brand-border'
            }
            key={star}
            size={size}
            strokeWidth={1.8}
          />
        ))}
      </span>

      <span className="font-bold text-brand-ink">{formatRating(value, locale)}</span>

      {caption && <span className="text-brand-muted">{caption}</span>}
    </span>
  );
}
