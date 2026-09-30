import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { StateMessage } from '@/components/shared/StateMessage';
import { AccountSettings } from '@/features/account/components/AccountSettings';
import { getSignInMethods } from '@/features/account/server/sign-in-methods';
import { BlockedUsersSection } from '@/features/blocks/components/BlockedUsersSection';
import { listBlockedUsers } from '@/features/blocks/server/repository';
import { ProfileSettingsForm } from '@/features/profiles/components/ProfileSettingsForm';
import { getEditableProfile } from '@/features/profiles/server/repository';
import { formatDate } from '@/lib/format';
import { isLocale, type Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import { safeQuery } from '@/lib/server/safe';
import { requireServerUser } from '@/lib/server/session';

type SettingsPageProps = {
  params: { locale: string };
};

export async function generateMetadata({ params }: SettingsPageProps): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : 'bg';
  const t = await getTranslations({ locale, namespace: 'settings' });

  return {
    title: t('metaTitle'),
    robots: { index: false },
  };
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  if (!isLocale(params.locale)) notFound();

  const locale: Locale = params.locale;
  const [t, user] = await Promise.all([
    getTranslations({ locale, namespace: 'settings' }),
    requireServerUser(routes.settings(locale)),
  ]);
  const [profile, blocked, signInMethods] = await Promise.all([
    safeQuery(getEditableProfile(user.id), `settings ${user.id}`),
    safeQuery(listBlockedUsers(user.id), `blocked users ${user.id}`),
    safeQuery(getSignInMethods(user.id), `sign-in methods ${user.id}`),
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 lg:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-bold leading-8 text-brand-ink">{t('heading')}</h1>
          <p className="mt-1 text-[14px] text-brand-muted">{t('subheading')}</p>
        </div>
        <Link
          className="text-[14px] font-medium text-brand-terracotta hover:underline"
          href={routes.profile(locale, user.id)}
        >
          {t('viewProfile')}
        </Link>
      </div>

      <div className="mt-8 space-y-6">
        {profile === null ? (
          <StateMessage tone="error" title={t('loadErrorTitle')} body={t('loadErrorBody')} />
        ) : (
          <>
            <ProfileSettingsForm locale={locale} profile={profile} userId={user.id} />
            <BlockedUsersSection
              locale={locale}
              users={
                blocked?.map(({ blockedAt, ...row }) => ({
                  ...row,
                  blockedOn: formatDate(blockedAt, locale),
                })) ?? null
              }
            />
            <AccountSettings
              email={profile.email}
              emailLocale={profile.locale}
              locale={locale}
              // If the lookup fails, asking for a password is the safe default.
              signInMethods={signInMethods ?? { hasPassword: true, socialProviders: [] }}
            />
          </>
        )}
      </div>
    </main>
  );
}
