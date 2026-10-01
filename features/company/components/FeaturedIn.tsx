import { getTranslations } from 'next-intl/server';
import Image from 'next/image';

import { PRESS_MENTIONS } from '@/features/company/press';
import type { Locale } from '@/lib/i18n';
import { cn } from '@/utils';

/** Room for two pull quotes above the logos; more would bury them. */
const MAX_QUOTES = 2;

/**
 * "As featured in": pull quotes and outlet logos from `PRESS_MENTIONS`. Renders nothing
 * while that list is empty, so it can sit on a page before there is any coverage.
 */
export async function FeaturedIn({ className, locale }: { className?: string; locale: Locale }) {
  if (PRESS_MENTIONS.length === 0) return null;

  const t = await getTranslations({ locale, namespace: 'company.featuredIn' });
  const quoted = PRESS_MENTIONS.filter((mention) => mention.quote).slice(0, MAX_QUOTES);

  return (
    <section aria-labelledby="featured-in" className={className}>
      <div className="mx-auto w-full max-w-5xl">
        <h2
          className="text-center text-[13px] font-bold uppercase tracking-[0.14em] text-brand-muted"
          id="featured-in"
        >
          {t('heading')}
        </h2>

        {quoted.length > 0 && (
          <div className={cn('mt-6 grid gap-4', quoted.length > 1 && 'md:grid-cols-2')}>
            {quoted.map((mention) => (
              <figure
                className="rounded-[15px] border border-brand-border bg-white p-6"
                key={mention.href}
              >
                <blockquote className="font-serif text-[20px] leading-snug text-brand-ink">
                  “{mention.quote?.[locale]}”
                </blockquote>
                <figcaption className="mt-3 text-[13px] font-semibold text-brand-muted">
                  {mention.outlet}
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {PRESS_MENTIONS.map((mention) => (
            <li key={mention.href}>
              <a
                className="block opacity-60 grayscale transition hover:opacity-100 hover:grayscale-0 focus-visible:opacity-100 focus-visible:grayscale-0"
                href={mention.href}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Image
                  alt={mention.outlet}
                  className="h-8 w-auto"
                  height={mention.logoHeight}
                  src={mention.logoSrc}
                  width={mention.logoWidth}
                />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
