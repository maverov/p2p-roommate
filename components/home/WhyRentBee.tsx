import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

import SquiggleUnderline from '@/components/ui/SquiggleUnderline';
import { WhyRentBeeCards } from '@/features/company/components/WhyRentBeeCards';
import type { Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';

export default async function WhyRentBee({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'company.why' });

  return (
    <section className="bg-brand-cream px-6 pb-14 pt-8 lg:px-10">
      <div className="mx-auto w-full max-w-[2000px]">
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-[32px] font-medium leading-none tracking-[-0.03em] text-brand-ink">
              {t('heading')}
            </h2>

            <SquiggleUnderline />
          </div>

          <Link
            href={routes.whyUs(locale)}
            className="text-md pt-2 font-medium text-brand-ink transition hover:text-brand-terracotta"
          >
            {t('more')} →
          </Link>
        </div>

        <WhyRentBeeCards locale={locale} />
      </div>
    </section>
  );
}
