'use client';

import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import { SOCIAL_PROVIDER_NAMES, type SocialProvider } from '@/lib/auth-rules';
import { authClient } from '@/lib/auth-client';
import type { Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';

import { AUTH_FORM_ERROR, AUTH_LINK } from './styles';

type SocialSignInProps = {
  /** Only the providers the server has keys for. */
  providers: SocialProvider[];
  /** Already sanitised; where to land after signing in. */
  nextPath: Route;
  /** The language emails to a newly created account are written in. */
  locale: Locale;
  /** A failed round trip, already translated (from `?error=` on the login page). */
  error?: string | null;
  /**
   * On the login page, where the email form has no consent line of its own: a social
   * sign-in there can still create an account.
   */
  showConsent?: boolean;
};

const BUTTON =
  'flex w-full items-center justify-center gap-3 rounded-md border border-brand-border bg-white px-4 py-2.5 font-semibold text-brand-ink transition hover:bg-brand-chip focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terracotta disabled:cursor-not-allowed disabled:opacity-60';

/**
 * Social sign-in doubles as sign-up: an unknown account is created on the way back.
 * Failures come back to the login page as `?error=` (see `oauthErrorKey`).
 */
export function SocialSignIn({
  error,
  locale,
  nextPath,
  providers,
  showConsent = false,
}: SocialSignInProps) {
  const t = useTranslations('auth.social');
  const [pending, setPending] = useState<SocialProvider | null>(null);
  const [failed, setFailed] = useState<SocialProvider | null>(null);

  if (providers.length === 0) return null;

  const signInWith = async (provider: SocialProvider) => {
    setPending(provider);
    setFailed(null);

    const loginPath = routes.login(nextPath);
    const response = await authClient.signIn.social({
      provider,
      callbackURL: nextPath,
      errorCallbackURL: `${loginPath}${loginPath.includes('?') ? '&' : '?'}provider=${provider}`,
      additionalData: { locale },
    });

    // On success the browser is already leaving for the provider.
    if (response.error) {
      setPending(null);
      setFailed(provider);
    }
  };

  return (
    <div className="mb-4 space-y-3">
      {error && (
        <p className={AUTH_FORM_ERROR} role="alert">
          {error}
        </p>
      )}

      {providers.map((provider) => {
        const name = SOCIAL_PROVIDER_NAMES[provider];

        return (
          <button
            className={BUTTON}
            disabled={pending !== null}
            key={provider}
            onClick={() => void signInWith(provider)}
            type="button"
          >
            <Image alt="" height={20} src={`/brand/${provider}.svg`} unoptimized width={20} />
            {pending === provider ? t('redirecting') : t('continueWith', { provider: name })}
          </button>
        );
      })}

      {failed && (
        <p className={AUTH_FORM_ERROR} role="alert">
          {t('errors.generic', { provider: SOCIAL_PROVIDER_NAMES[failed] })}
        </p>
      )}

      {showConsent && (
        <p className="text-sm text-brand-muted">
          {t.rich('consent', {
            terms: (chunks) => (
              <Link className={AUTH_LINK} href={routes.terms(locale)}>
                {chunks}
              </Link>
            ),
            privacy: (chunks) => (
              <Link className={AUTH_LINK} href={routes.privacy(locale)}>
                {chunks}
              </Link>
            ),
          })}
        </p>
      )}

      <div aria-hidden="true" className="flex items-center gap-3 pt-1 text-sm text-brand-muted">
        <span className="h-px flex-1 bg-brand-border" />
        {t('or')}
        <span className="h-px flex-1 bg-brand-border" />
      </div>
    </div>
  );
}
