import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { AuthCard, ForgotPasswordForm } from '@/features/auth';
import { routes } from '@/lib/routes';
import { getCookieLocale } from '@/lib/server/locale';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: getCookieLocale(), namespace: 'auth.forgotPassword' });

  return { title: t('title') };
}

export default async function ForgotPasswordPage() {
  const t = await getTranslations({ locale: getCookieLocale(), namespace: 'auth.forgotPassword' });

  return (
    <AuthCard
      eyebrow={t('eyebrow')}
      footer={{ href: routes.login(), label: t('backToLogin') }}
      title={t('title')}
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
