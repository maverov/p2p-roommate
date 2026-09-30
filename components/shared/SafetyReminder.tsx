import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

import type { Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';

/** One-line nudge next to contact actions, pointing at the safety tips. */
export async function SafetyReminder({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'common.safety' });

  return (
    <p className="mt-3 text-center text-[12px] leading-5 text-brand-muted">
      {t('reminder')}{' '}
      <Link
        className="font-semibold text-brand-terracotta hover:underline"
        href={routes.safety(locale)}
      >
        {t('link')}
      </Link>
    </p>
  );
}
