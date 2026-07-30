import { getTranslations } from 'next-intl/server';
import { Fragment } from 'react';
import { CalendarDays, Heart, Home, Search, type LucideIcon } from 'lucide-react';
import SquiggleUnderline from '@/components/ui/SquiggleUnderline';
import type { Locale } from '@/lib/i18n';

/** Icon per step; the title and body come from `home.howItWorks.steps.<key>`. */
const STEPS: ReadonlyArray<{ icon: LucideIcon; key: 'search' | 'connect' | 'moveIn' | 'feelAtHome' }> = [
  { icon: Search, key: 'search' },
  { icon: Heart, key: 'connect' },
  { icon: CalendarDays, key: 'moveIn' },
  { icon: Home, key: 'feelAtHome' },
];

export default async function HowItWorks({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home.howItWorks' });

  return (
    <section className="bg-brand-cream px-6 pb-20 pt-14 lg:px-10">
      <div className="mx-auto w-full max-w-[2000px]">
        <div className="mb-10 text-center">
          <h2 className="font-serif text-[32px] font-medium leading-none tracking-[-0.03em] text-brand-ink">
            {t('heading')}
          </h2>

          <SquiggleUnderline className="mx-auto" />
        </div>

        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between md:gap-4">
          {STEPS.map((step, index) => (
            <Fragment key={step.key}>
              {index > 0 && <StepConnector />}

              <div className="flex max-w-[280px] items-start gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-olive text-white">
                  <step.icon size={24} strokeWidth={1.8} aria-hidden="true" />
                </span>

                <div>
                  <h3 className="text-[15px] font-bold leading-5 text-brand-ink">
                    {t(`steps.${step.key}.title`)}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-5 text-brand-muted">
                    {t(`steps.${step.key}.description`)}
                  </p>
                </div>
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

function StepConnector() {
  return (
    <svg
      viewBox="0 0 64 16"
      fill="none"
      aria-hidden="true"
      className="mt-6 hidden w-16 shrink-0 text-brand-muted/50 lg:block"
    >
      <path
        d="M2 12C20 2 44 2 62 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="4 5"
      />
    </svg>
  );
}
