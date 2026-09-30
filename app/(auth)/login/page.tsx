import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { AuthCard, LoginForm, SocialSignIn, oauthErrorKey } from '@/features/auth';
import { SOCIAL_PROVIDER_NAMES, isSocialProvider } from '@/lib/auth-rules';
import { routes, sanitizeNextPath } from '@/lib/routes';
import { getCookieLocale } from '@/lib/server/locale';
import { getServerUser } from '@/lib/server/session';
import { enabledSocialProviders } from '@/lib/server/social-auth';

type LoginPageProps = {
  searchParams: {
    next?: string;
    /** Set by Better Auth when a social sign-in comes back failed. */
    error?: string;
    /** Which button it was, appended by `SocialSignIn` to its error URL. */
    provider?: string;
  };
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: getCookieLocale(), namespace: 'auth.login' });

  return { title: t('submit') };
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const locale = getCookieLocale();
  const nextPath = sanitizeNextPath(searchParams.next);
  const [user, t, tSocial] = await Promise.all([
    getServerUser(),
    getTranslations({ locale, namespace: 'auth.login' }),
    getTranslations({ locale, namespace: 'auth.social' }),
  ]);

  if (user) {
    redirect(nextPath ?? routes.home(locale));
  }

  const provider =
    SOCIAL_PROVIDER_NAMES[
      isSocialProvider(searchParams.provider) ? searchParams.provider : 'google'
    ];
  const oauthError = searchParams.error
    ? tSocial(`errors.${oauthErrorKey(searchParams.error)}`, { provider })
    : null;
  const destination = nextPath ?? routes.home(locale);

  return (
    <AuthCard
      eyebrow={t('eyebrow')}
      footer={{
        href: routes.signup(nextPath ?? undefined),
        label: t('footerLink'),
        text: t('footerText'),
      }}
      title={t('title')}
    >
      <SocialSignIn
        error={oauthError}
        locale={locale}
        nextPath={destination}
        providers={enabledSocialProviders}
        showConsent
      />
      <LoginForm nextPath={destination} />
    </AuthCard>
  );
}
