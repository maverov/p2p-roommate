'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { MailCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { authErrorKey, useRequestPasswordReset } from '@/features/auth/api';
import { createForgotPasswordSchema, type ForgotPasswordInput } from '@/features/auth/schemas';

import { AUTH_FIELD, AUTH_FIELD_ERROR, AUTH_FORM_ERROR, AUTH_LABEL, AUTH_SUBMIT } from './styles';

export function ForgotPasswordForm() {
  const t = useTranslations('auth');
  const request = useRequestPasswordReset();
  const schema = useMemo(() => createForgotPasswordSchema(t), [t]);
  const form = useForm<ForgotPasswordInput>({
    defaultValues: { email: '' },
    resolver: zodResolver(schema),
  });

  const { errors } = form.formState;
  const onSubmit = form.handleSubmit((values) => request.mutate(values.email));

  // Same answer whether or not the account exists, so the form cannot be used to probe
  // which addresses are registered.
  if (request.isSuccess) {
    return (
      <div className="space-y-2" role="status">
        <MailCheck aria-hidden="true" className="size-8 text-brand-terracotta" />
        <h2 className="text-lg font-semibold text-brand-ink">{t('forgotPassword.sentTitle')}</h2>
        <p className="text-sm text-brand-muted">
          {t('forgotPassword.sentBody', { email: request.variables })}
        </p>
      </div>
    );
  }

  return (
    <form className="space-y-4" noValidate onSubmit={onSubmit}>
      <p className="text-sm text-brand-muted">{t('forgotPassword.body')}</p>

      <div>
        <label className={AUTH_LABEL} htmlFor="email">
          {t('fields.email')}
        </label>
        <input
          aria-describedby={errors.email ? 'forgot-email-error' : undefined}
          aria-invalid={Boolean(errors.email)}
          autoComplete="email"
          className={AUTH_FIELD}
          id="email"
          type="email"
          {...form.register('email')}
        />
        {errors.email && (
          <p className={AUTH_FIELD_ERROR} id="forgot-email-error">
            {errors.email.message}
          </p>
        )}
      </div>

      {request.error && (
        <p className={AUTH_FORM_ERROR} role="alert">
          {t(authErrorKey(request.error))}
        </p>
      )}

      <button className={AUTH_SUBMIT} disabled={request.isPending} type="submit">
        {request.isPending ? t('forgotPassword.submitting') : t('forgotPassword.submit')}
      </button>
    </form>
  );
}
