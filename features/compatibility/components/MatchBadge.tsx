import { getTranslations } from 'next-intl/server';

import type { Locale } from '@/lib/i18n';
import { cn } from '@/utils';

type MatchBadgeProps = {
  /** 0–100, from `scoreListing` or `scoreProfiles`. */
  score: number;
  locale: Locale;
  /** `overlay` sits on a photo; `inline` sits in text. */
  variant: 'overlay' | 'inline';
};

export async function MatchBadge({ locale, score, variant }: MatchBadgeProps) {
  const t = await getTranslations({ locale, namespace: 'common.match' });

  return (
    <span
      className={cn(
        'whitespace-nowrap font-bold',
        variant === 'overlay'
          ? 'rounded bg-white/95 px-2 py-1 text-[10px] text-brand-ink'
          : 'rounded-full bg-brand-terracotta/10 px-2 py-0.5 text-[11px] text-brand-terracotta',
      )}
      title={t('hint')}
    >
      {t('label', { score })}
    </span>
  );
}
