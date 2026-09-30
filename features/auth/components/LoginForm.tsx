'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { authErrorKey, useLogin } from '@/features/auth/api';
import { createLoginSchema, type LoginInput } from '@/features/auth/schemas';
import { routes } from '@/lib/routes';

import {
  AUTH_FIELD,
  AUTH_FIELD_ERROR,
  AUTH_FORM_ERROR,
  AUTH_LABEL,
  AUTH_LINK,
  AUTH_SUBMIT,
} from './styles';

type LoginFormProps = {
  /** Already sanitised by the page; where to land after a successful sign-in. */
  nextPath: Route;
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const t = useTranslations('auth');
  const router = useRouter();
  const login = useLogin(nextPath);
  const [isNavigating, startTransition] = useTransition();
  const schema = useMemo(() => createLoginSchema(t), [t]);
  const form = useForm<LoginInput>({
    defaultValues: { email: '', password: '' },
    resolver: zodResolver(schema),
  });

  const { errors } = form.formState;
  const isBusy = login.isPending || isNavigating;

  const onSubmit = form.handleSubmit((values) => {
    login.mutate(values, {
      onSuccess: () => {
        // `replace` keeps the login screen out of the back-stack; `refresh` re-renders
        // server components (navbar, guards) with the new session. The transition keeps
        // the button busy until that render lands.
        startTransition(() => {
          router.replace(nextPath);
          router.refresh();
        });
      },
    });
  });

  return (
    <form className="space-y-4" noValidate onSubmit={onSubmit}>
      <div>
        <label className={AUTH_LABEL} htmlFor="email">
          {t('fields.email')}
        </label>
        <input
          aria-describedby={errors.email ? 'login-email-error' : undefined}
          aria-invalid={Boolean(errors.email)}
          autoComplete="email"
          className={AUTH_FIELD}
          id="email"
          type="email"
          {...form.register('email')}
        />
        {errors.email && (
          <p className={AUTH_FIELD_ERROR} id="login-email-error">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <label className={AUTH_LABEL} htmlFor="password">
            {t('fields.password')}
          </label>
          <Link className={`text-sm ${AUTH_LINK}`} href={routes.forgotPassword()}>
            {t('login.forgotPassword')}
          </Link>
        </div>
        <input
          aria-describedby={errors.password ? 'login-password-error' : undefined}
          aria-invalid={Boolean(errors.password)}
          autoComplete="current-password"
          className={AUTH_FIELD}
          id="password"
          type="password"
          {...form.register('password')}
        />
        {errors.password && (
          <p className={AUTH_FIELD_ERROR} id="login-password-error">
            {errors.password.message}
          </p>
        )}
      </div>

      {login.error && (
        <p className={AUTH_FORM_ERROR} role="alert">
          {t(authErrorKey(login.error))}
        </p>
      )}

      <button className={AUTH_SUBMIT} disabled={isBusy} type="submit">
        {isBusy ? t('login.submitting') : t('login.submit')}
      </button>
    </form>
  );
}
