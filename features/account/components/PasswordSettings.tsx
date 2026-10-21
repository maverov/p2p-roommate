'use client';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { authClient } from '@/lib/auth-client';
import { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from '@/lib/auth-rules';
import { routes } from '@/lib/routes';
import {
  SETTINGS_SECTION,
  SETTINGS_FIELD,
  SETTINGS_LABEL,
  SETTINGS_BUTTON,
} from '@/features/profiles/components/settings-ui';

export function PasswordSettings({ hasPassword }: { hasPassword: boolean }) {
  const t = useTranslations('settings.password');
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [confirm, setConfirm] = useState('');
  const [mismatch, setMismatch] = useState(false);
  const change = useMutation({
    mutationFn: async () => {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (result.error) throw new Error(result.error.code ?? 'FAILED');
    },
    onSuccess: () => {
      setCurrent('');
      setNew('');
      setConfirm('');
    },
  });
  function submit(event: FormEvent) {
    event.preventDefault();
    setMismatch(newPassword !== confirm);
    if (newPassword === confirm) change.mutate();
  }
  return (
    <section className={SETTINGS_SECTION}>
      <h2 className="text-[17px] font-semibold">{t('heading')}</h2>
      {hasPassword ? (
        <form className="space-y-3" onSubmit={submit}>
          <label className={SETTINGS_LABEL} htmlFor="current-password">
            {t('current')}
          </label>
          <input
            id="current-password"
            className={SETTINGS_FIELD}
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(e) => setCurrent(e.target.value)}
          />
          <label className={SETTINGS_LABEL} htmlFor="new-password">
            {t('new')}
          </label>
          <input
            id="new-password"
            className={SETTINGS_FIELD}
            type="password"
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            maxLength={PASSWORD_MAX_LENGTH}
            value={newPassword}
            onChange={(e) => setNew(e.target.value)}
          />
          <label className={SETTINGS_LABEL} htmlFor="confirm-password">
            {t('confirm')}
          </label>
          <input
            id="confirm-password"
            className={SETTINGS_FIELD}
            type="password"
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            maxLength={PASSWORD_MAX_LENGTH}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <p className="text-sm">{t('hint', { min: PASSWORD_MIN_LENGTH })}</p>
          <button className={SETTINGS_BUTTON} disabled={change.isPending} type="submit">
            {change.isPending ? t('saving') : t('save')}
          </button>
          {mismatch && <p role="alert">{t('mismatch')}</p>}
          {change.isError && (
            <p role="alert">
              {change.error.message === 'INVALID_PASSWORD' ? t('wrongCurrent') : t('failed')}
            </p>
          )}
          {change.isSuccess && <p role="status">{t('success')}</p>}
        </form>
      ) : (
        <p>{t('social')}</p>
      )}
      <Link className="text-sm underline" href={routes.forgotPassword()}>
        {t('reset')}
      </Link>
    </section>
  );
}
