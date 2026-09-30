'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { MailCheck } from 'lucide-react';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { authErrorKey, useSignup } from '@/features/auth/api';
import { createSignupSchema, type SignupInput } from '@/features/auth/schemas';
import { PASSWORD_MIN_LENGTH } from '@/lib/auth-rules';
import type { Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';

import {
  AUTH_FIELD,
  AUTH_FIELD_ERROR,
  AUTH_FORM_ERROR,
  AUTH_LABEL,
  AUTH_LINK,
  AUTH_SUBMIT,
} from './styles';

type SignupFormProps = {
  /** Emails to this account are written in this language (`user.locale`). */
  locale: Locale;
  /** Carried through the verification link, so confirming lands where sign-up began. */
  nextPath?: Route | null;
};

export function SignupForm({ locale, nextPath }: SignupFormProps) {
  const t = useTranslations('auth');
  const signup = useSignup(locale, nextPath ?? undefined);
  const schema = useMemo(() => createSignupSchema(t), [t]);
  const form = useForm<SignupInput>({
    defaultValues: { email: '', name: '', password: '' },
    resolver: zodResolver(schema),
  });

  const { errors } = form.formState;
  const onSubmit = form.handleSubmit((values) => signup.mutate(values));

  // No session until the address is confirmed, so success is "go check your inbox".
  // Better Auth answers the same way when the email is already registered, which is
  // deliberate: the form must not reveal who has an account.
  if (signup.isSuccess) {
    return (
      <div className="space-y-2" role="status">
        <MailCheck aria-hidden="true" className="size-8 text-brand-terracotta" />
        <h2 className="text-lg font-semibold text-brand-ink">{t('signup.checkEmailTitle')}</h2>
        <p className="text-sm text-brand-muted">
          {t('signup.checkEmailBody', { email: signup.variables.email })}
        </p>
      </div>
    );
  }

  return (
    <form className="space-y-4" noValidate onSubmit={onSubmit}>
      <div>
        <label className={AUTH_LABEL} htmlFor="name">
          {t('fields.name')}
        </label>
        <input
          aria-describedby={errors.name ? 'signup-name-error' : undefined}
          aria-invalid={Boolean(errors.name)}
          autoComplete="name"
          className={AUTH_FIELD}
          id="name"
          type="text"
          {...form.register('name')}
        />
        {errors.name && (
          <p className={AUTH_FIELD_ERROR} id="signup-name-error">
            {errors.name.message}
          </p>
        )}
      </div>

      <div>
        <label className={AUTH_LABEL} htmlFor="email">
          {t('fields.email')}
        </label>
        <input
          aria-describedby={errors.email ? 'signup-email-error' : undefined}
          aria-invalid={Boolean(errors.email)}
          autoComplete="email"
          className={AUTH_FIELD}
          id="email"
          type="email"
          {...form.register('email')}
        />
        {errors.email && (
          <p className={AUTH_FIELD_ERROR} id="signup-email-error">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label className={AUTH_LABEL} htmlFor="password">
          {t('fields.password')}
        </label>
        <input
          aria-describedby={errors.password ? 'signup-password-error' : 'signup-password-hint'}
          aria-invalid={Boolean(errors.password)}
          autoComplete="new-password"
          className={AUTH_FIELD}
          id="password"
          type="password"
          {...form.register('password')}
        />
        {errors.password ? (
          <p className={AUTH_FIELD_ERROR} id="signup-password-error">
            {errors.password.message}
          </p>
        ) : (
          <p className="mt-1 text-sm text-brand-muted" id="signup-password-hint">
            {t('fields.passwordHint', { min: PASSWORD_MIN_LENGTH })}
          </p>
        )}
      </div>

      {signup.error && (
        <p className={AUTH_FORM_ERROR} role="alert">
          {t(authErrorKey(signup.error))}
        </p>
      )}

      <p className="text-sm text-brand-muted">
        {t.rich('signup.consent', {
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

      <button className={AUTH_SUBMIT} disabled={signup.isPending} type="submit">
        {signup.isPending ? t('signup.submitting') : t('signup.submit')}
      </button>
    </form>
  );
}
