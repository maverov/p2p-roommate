import { getTranslations } from 'next-intl/server';
import { Handshake, ShieldCheck, UsersRound, type LucideIcon } from 'lucide-react';

import type { Locale } from '@/lib/i18n';
import { cn } from '@/utils';

/** The three reasons, in order; the copy is `company.why.cards.<key>`. */
const CARDS: ReadonlyArray<{ key: 'direct' | 'safety' | 'people'; icon: LucideIcon }> = [
  { key: 'direct', icon: Handshake },
  { key: 'safety', icon: ShieldCheck },
  { key: 'people', icon: UsersRound },
];

/** "Why use Stay.bg?" as three cards, on the home and About pages. */
export async function WhyStayCards({ className, locale }: { className?: string; locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'company.why.cards' });

  return (
    <ul className={cn('grid gap-4 md:grid-cols-3', className)}>
      {CARDS.map((card) => (
        <li
          className="rounded-[15px] border border-brand-border bg-white p-6 shadow-[0_8px_24px_rgba(75,55,35,0.06)]"
          key={card.key}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-olive text-white">
            <card.icon aria-hidden="true" size={22} strokeWidth={1.8} />
          </span>
          <h3 className="mt-4 text-[17px] font-bold leading-6 text-brand-ink">
            {t(`${card.key}.title`)}
          </h3>
          <p className="mt-2 text-[14px] leading-6 text-brand-muted">{t(`${card.key}.body`)}</p>
        </li>
      ))}
    </ul>
  );
}
