'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { AuthRequestError, authErrorKey, useResetPassword } from '@/features/auth/api';
import { createResetPasswordSchema, type ResetPasswordInput } from '@/features/auth/schemas';
import { PASSWORD_MIN_LENGTH } from '@/lib/auth-rules';
import { routes } from '@/lib/routes';

import {
  AUTH_FIELD,
  AUTH_FIELD_ERROR,
  AUTH_FORM_ERROR,
  AUTH_LABEL,
  AUTH_LINK,
  AUTH_SUBMIT,
} from './styles';

type ResetPasswordFormProps = {
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const t = useTranslations('auth');
  const reset = useResetPassword();
  const schema = useMemo(() => createResetPasswordSchema(t), [t]);
  const form = useForm<ResetPasswordInput>({
    defaultValues: { password: '', confirmPassword: '' },
    resolver: zodResolver(schema),
  });

  const { errors } = form.formState;
  const onSubmit = form.handleSubmit((values) =>
    reset.mutate({ token, newPassword: values.password }),
  );

  if (reset.isSuccess) {
    return (
      <div className="space-y-2" role="status">
        <CheckCircle2 aria-hidden="true" className="size-8 text-brand-olive" />
        <h2 className="text-lg font-semibold text-brand-ink">{t('resetPassword.successTitle')}</h2>
        <p className="text-sm text-brand-muted">{t('resetPassword.successBody')}</p>
        <Link className={`inline-block text-sm ${AUTH_LINK}`} href={routes.login()}>
          {t('resetPassword.backToLogin')}
        </Link>
      </div>
    );
  }

  // A token that expired between opening the email and submitting the form.
  const tokenRejected =
    reset.error instanceof AuthRequestError && reset.error.code === 'INVALID_TOKEN';

  return (
    <form className="space-y-4" noValidate onSubmit={onSubmit}>
      <div>
        <label className={AUTH_LABEL} htmlFor="password">
          {t('fields.newPassword')}
        </label>
        <input
          aria-describedby={errors.password ? 'reset-password-error' : 'reset-password-hint'}
          aria-invalid={Boolean(errors.password)}
          autoComplete="new-password"
          className={AUTH_FIELD}
          id="password"
          type="password"
          {...form.register('password')}
        />
        {errors.password ? (
          <p className={AUTH_FIELD_ERROR} id="reset-password-error">
            {errors.password.message}
          </p>
        ) : (
          <p className="mt-1 text-sm text-brand-muted" id="reset-password-hint">
            {t('fields.passwordHint', { min: PASSWORD_MIN_LENGTH })}
          </p>
        )}
      </div>

      <div>
        <label className={AUTH_LABEL} htmlFor="confirmPassword">
          {t('fields.confirmPassword')}
        </label>
        <input
          aria-describedby={errors.confirmPassword ? 'reset-confirm-error' : undefined}
          aria-invalid={Boolean(errors.confirmPassword)}
          autoComplete="new-password"
          className={AUTH_FIELD}
          id="confirmPassword"
          type="password"
          {...form.register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <p className={AUTH_FIELD_ERROR} id="reset-confirm-error">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {reset.error && (
        <p className={AUTH_FORM_ERROR} role="alert">
          {tokenRejected ? t('resetPassword.invalidBody') : t(authErrorKey(reset.error))}
          {tokenRejected && (
            <>
              {' '}
              <Link className={AUTH_LINK} href={routes.forgotPassword()}>
                {t('resetPassword.requestNew')}
              </Link>
            </>
          )}
        </p>
      )}

      <button className={AUTH_SUBMIT} disabled={reset.isPending} type="submit">
        {reset.isPending ? t('resetPassword.submitting') : t('resetPassword.submit')}
      </button>
    </form>
  );
}
