import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

import { AuthCard, ResetPasswordForm } from '@/features/auth';
import { routes } from '@/lib/routes';
import { getCookieLocale } from '@/lib/server/locale';

type ResetPasswordPageProps = {
  /** Set by Better Auth's redirect from the emailed link. */
  searchParams: {
    token?: string;
    error?: string;
  };
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: getCookieLocale(), namespace: 'auth.resetPassword' });

  return { title: t('title') };
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const t = await getTranslations({ locale: getCookieLocale(), namespace: 'auth.resetPassword' });
  const token = searchParams.error ? undefined : searchParams.token;

  if (!token) {
    return (
      <AuthCard eyebrow={t('eyebrow')} title={t('invalidTitle')}>
        <p className="text-sm text-brand-muted">{t('invalidBody')}</p>
        <Link
          className="mt-4 inline-block rounded-md bg-brand-terracotta px-4 py-2.5 font-semibold text-white transition hover:bg-brand-terracotta-hover"
          href={routes.forgotPassword()}
        >
          {t('requestNew')}
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard eyebrow={t('eyebrow')} title={t('title')}>
      <ResetPasswordForm token={token} />
    </AuthCard>
  );
}
