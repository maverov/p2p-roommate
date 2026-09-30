import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { AuthCard, SignupForm, SocialSignIn } from '@/features/auth';
import { routes, sanitizeNextPath } from '@/lib/routes';
import { getCookieLocale } from '@/lib/server/locale';
import { getServerUser } from '@/lib/server/session';
import { enabledSocialProviders } from '@/lib/server/social-auth';

type SignupPageProps = {
  searchParams: {
    next?: string;
  };
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: getCookieLocale(), namespace: 'auth.signup' });

  return { title: t('submit') };
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const locale = getCookieLocale();
  const nextPath = sanitizeNextPath(searchParams.next);
  const [user, t] = await Promise.all([
    getServerUser(),
    getTranslations({ locale, namespace: 'auth.signup' }),
  ]);

  if (user) {
    redirect(nextPath ?? routes.home(locale));
  }

  return (
    <AuthCard
      eyebrow={t('eyebrow')}
      footer={{
        href: routes.login(nextPath ?? undefined),
        label: t('footerLink'),
        text: t('footerText'),
      }}
      title={t('title')}
    >
      <SocialSignIn
        locale={locale}
        nextPath={nextPath ?? routes.home(locale)}
        providers={enabledSocialProviders}
      />
      <SignupForm locale={locale} nextPath={nextPath} />
    </AuthCard>
  );
}
