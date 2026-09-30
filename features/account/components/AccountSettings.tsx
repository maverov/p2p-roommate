'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';

import {
  SETTINGS_BUTTON,
  SETTINGS_FIELD,
  SETTINGS_LABEL,
  SETTINGS_SECTION,
  SettingsSaveBar,
} from '@/features/profiles/components/settings-ui';
import type { SignInMethods } from '@/features/account/server/sign-in-methods';
import { SOCIAL_PROVIDER_NAMES } from '@/lib/auth-rules';
import { authClient } from '@/lib/auth-client';
import { isLocale, locales, type Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';

type AccountSettingsProps = {
  locale: Locale;
  email: string;
  signInMethods: SignInMethods;
  /** Stored `user.locale`, which may be any string — validated here. */
  emailLocale: string;
};

export function AccountSettings({
  locale,
  email,
  emailLocale,
  signInMethods,
}: AccountSettingsProps) {
  return (
    <>
      <EmailLanguageForm email={email} initial={isLocale(emailLocale) ? emailLocale : locale} />
      <DataExportSection />
      <DeleteAccountSection locale={locale} signInMethods={signInMethods} />
    </>
  );
}

function EmailLanguageForm({ email, initial }: { email: string; initial: Locale }) {
  const t = useTranslations('settings');
  const [value, setValue] = useState<Locale>(initial);
  const save = useMutation({
    mutationFn: async (next: Locale) => {
      const response = await authClient.updateUser({ locale: next });

      if (response.error) {
        throw new Error(response.error.code ?? 'UPDATE_FAILED');
      }
    },
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    save.mutate(value);
  };

  return (
    <form className={SETTINGS_SECTION} onSubmit={onSubmit}>
      <h2 className="text-[17px] font-semibold text-brand-ink">{t('account.heading')}</h2>
      <div>
        <p className={SETTINGS_LABEL}>{t('account.email')}</p>
        <p className="text-[14px] text-brand-muted">{email}</p>
      </div>
      <div>
        <label className={SETTINGS_LABEL} htmlFor="emailLocale">
          {t('account.emailLanguage')}
        </label>
        <select
          aria-describedby="emailLocale-hint"
          className={`${SETTINGS_FIELD} sm:w-64`}
          id="emailLocale"
          onChange={(e) => {
            save.reset();
            setValue(e.target.value as Locale);
          }}
          value={value}
        >
          {locales.map((candidate) => (
            <option key={candidate} value={candidate}>
              {t(`account.languageNames.${candidate}`)}
            </option>
          ))}
        </select>
        <p className="mt-1 text-[12px] text-brand-muted" id="emailLocale-hint">
          {t('account.emailLanguageHint')}
        </p>
      </div>
      <SettingsSaveBar
        isError={save.isError}
        isPending={save.isPending}
        isSuccess={save.isSuccess}
        labels={{
          save: t('save'),
          saving: t('saving'),
          saved: t('saved'),
          failed: t('saveFailed'),
        }}
      />
    </form>
  );
}

function DataExportSection() {
  const t = useTranslations('settings.data');
  const download = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/me/export', { credentials: 'same-origin' });

      if (!response.ok) {
        throw new Error(`EXPORT_FAILED_${response.status}`);
      }

      const disposition = response.headers.get('Content-Disposition') ?? '';
      const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? 'stay-bg-data.json';
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');

      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    },
  });

  return (
    <section className={SETTINGS_SECTION}>
      <h2 className="text-[17px] font-semibold text-brand-ink">{t('heading')}</h2>
      <p className="text-[13px] text-brand-muted">{t('description')}</p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          className="inline-flex items-center gap-2 rounded-xl border border-brand-border px-4 py-2 text-[14px] font-medium text-brand-ink hover:bg-brand-chip disabled:opacity-60"
          disabled={download.isPending}
          onClick={() => download.mutate()}
          type="button"
        >
          {download.isPending ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Download aria-hidden="true" className="size-4" />
          )}
          {download.isPending ? t('exporting') : t('export')}
        </button>
        {download.isError && (
          <p className="text-[13px] text-red-600" role="alert">
            {t('exportFailed')}
          </p>
        )}
      </div>
    </section>
  );
}

/**
 * A password confirms the deletion when the account has one. A Google- or Facebook-only
 * account has none, so Better Auth accepts a recent sign-in instead (its fresh-session
 * window) and otherwise answers `SESSION_EXPIRED`: signing in again makes it fresh.
 */
function DeleteAccountSection({
  locale,
  signInMethods: { hasPassword, socialProviders },
}: {
  locale: Locale;
  signInMethods: SignInMethods;
}) {
  const t = useTranslations('settings.deleteAccount');
  const reauthProvider = socialProviders[0];
  const queryClient = useQueryClient();
  const [isConfirming, setIsConfirming] = useState(false);
  const [password, setPassword] = useState('');
  const remove = useMutation({
    mutationFn: async () => {
      const response = await authClient.deleteUser(hasPassword ? { password } : {});

      if (response.error) {
        throw new Error(response.error.code ?? 'DELETE_FAILED');
      }
    },
    onSuccess: () => {
      queryClient.clear();
      // A full navigation: every cached page and client store belonged to the deleted account.
      window.location.assign(routes.home(locale));
    },
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    remove.mutate();
  };

  const errorCode = remove.error?.message;
  const needsReauth = errorCode === 'SESSION_EXPIRED' && !hasPassword && reauthProvider;

  return (
    <section className={`${SETTINGS_SECTION} border-red-200`}>
      <h2 className="text-[17px] font-semibold text-red-700">{t('heading')}</h2>
      <p className="text-[13px] text-brand-muted">{t('description')}</p>

      {!isConfirming ? (
        <button
          className="rounded-xl border border-red-300 px-4 py-2 text-[14px] font-medium text-red-700 hover:bg-red-50"
          onClick={() => setIsConfirming(true)}
          type="button"
        >
          {t('start')}
        </button>
      ) : (
        <form className="space-y-3" onSubmit={onSubmit}>
          {hasPassword ? (
            <div>
              <label className={SETTINGS_LABEL} htmlFor="deletePassword">
                {t('confirmLabel')}
              </label>
              <input
                autoComplete="current-password"
                className={`${SETTINGS_FIELD} sm:w-72`}
                id="deletePassword"
                onChange={(e) => setPassword(e.target.value)}
                required
                type="password"
                value={password}
              />
            </div>
          ) : (
            <p className="text-[14px] text-brand-ink">{t('confirmNoPassword')}</p>
          )}
          {needsReauth ? (
            <div className="space-y-2" role="alert">
              <p className="text-[13px] text-red-600">
                {t('reauthRequired', { provider: SOCIAL_PROVIDER_NAMES[reauthProvider] })}
              </p>
              <button
                className="rounded-xl border border-brand-border px-4 py-2 text-[14px] font-medium text-brand-ink hover:bg-brand-chip"
                onClick={() =>
                  void authClient.signIn.social({
                    provider: reauthProvider,
                    callbackURL: routes.settings(locale),
                  })
                }
                type="button"
              >
                {t('reauth', { provider: SOCIAL_PROVIDER_NAMES[reauthProvider] })}
              </button>
            </div>
          ) : (
            remove.isError && (
              <p className="text-[13px] text-red-600" role="alert">
                {errorCode === 'INVALID_PASSWORD' ? t('wrongPassword') : t('failed')}
              </p>
            )
          )}
          <div className="flex flex-wrap gap-2">
            <button
              className={`${SETTINGS_BUTTON} bg-red-600 hover:bg-red-700`}
              disabled={remove.isPending || (hasPassword && password.length === 0)}
              type="submit"
            >
              {remove.isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
              {remove.isPending ? t('deleting') : t('confirm')}
            </button>
            <button
              className="rounded-xl border border-brand-border px-4 py-2 text-[14px] font-medium text-brand-ink hover:bg-brand-chip"
              disabled={remove.isPending}
              onClick={() => {
                setIsConfirming(false);
                setPassword('');
                remove.reset();
              }}
              type="button"
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
