import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

import { AuthCard } from '@/features/auth';
import { routes, sanitizeNextPath } from '@/lib/routes';
import { getCookieLocale } from '@/lib/server/locale';

type VerifyEmailPageProps = {
  /** Better Auth redirects here after checking the emailed link, adding `error` on failure. */
  searchParams: {
    error?: string;
    next?: string;
  };
};

const BUTTON =
  'mt-4 inline-block rounded-md bg-brand-terracotta px-4 py-2.5 font-semibold text-white transition hover:bg-brand-terracotta-hover';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: getCookieLocale(), namespace: 'auth.verifyEmail' });

  return { title: t('errorEyebrow') };
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const locale = getCookieLocale();
  const t = await getTranslations({ locale, namespace: 'auth.verifyEmail' });
  const nextPath = sanitizeNextPath(searchParams.next);

  if (searchParams.error) {
    return (
      <AuthCard eyebrow={t('errorEyebrow')} title={t('errorTitle')}>
        <p className="text-sm text-brand-muted">{t('errorBody')}</p>
        <Link className={BUTTON} href={routes.login(nextPath ?? undefined)}>
          {t('backToLogin')}
        </Link>
      </AuthCard>
    );
  }

  // `autoSignInAfterVerification` has already set the session cookie by the time we land.
  return (
    <AuthCard eyebrow={t('successEyebrow')} title={t('successTitle')}>
      <p className="text-sm text-brand-muted">{t('successBody')}</p>
      <Link className={BUTTON} href={nextPath ?? routes.home(locale)}>
        {t('continue')}
      </Link>
    </AuthCard>
  );
}
