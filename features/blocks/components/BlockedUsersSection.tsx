'use client';

import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Avatar } from '@/components/shared/Avatar';
import { SETTINGS_SECTION } from '@/features/profiles/components/settings-ui';
import { apiClient } from '@/lib/api-client';
import type { Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';

export type BlockedUserRow = {
  userId: string;
  name: string;
  image: string | null;
  /** Already formatted for the page's locale. */
  blockedOn: string;
};

type BlockedUsersSectionProps = {
  locale: Locale;
  /** `null` means the query failed, which must not read as "you blocked nobody". */
  users: BlockedUserRow[] | null;
};

export function BlockedUsersSection({ locale, users }: BlockedUsersSectionProps) {
  const t = useTranslations('settings.blocked');
  const [remaining, setRemaining] = useState(users ?? []);

  const unblock = useMutation({
    mutationFn: (userId: string) => apiClient.delete(`/api/profiles/${userId}/block`),
    onSuccess: (_data, userId) =>
      setRemaining((current) => current.filter((row) => row.userId !== userId)),
  });

  return (
    <section aria-labelledby="blocked-users-heading" className={SETTINGS_SECTION}>
      <div>
        <h2 className="text-[17px] font-semibold text-brand-ink" id="blocked-users-heading">
          {t('heading')}
        </h2>
        <p className="mt-1 text-[13px] text-brand-muted">{t('hint')}</p>
      </div>

      {users === null ? (
        <p className="text-[13px] text-red-600" role="alert">
          {t('loadFailed')}
        </p>
      ) : remaining.length === 0 ? (
        <p className="text-[14px] text-brand-muted">{t('empty')}</p>
      ) : (
        <ul className="divide-y divide-brand-border">
          {remaining.map((row) => {
            const isPending = unblock.isPending && unblock.variables === row.userId;

            return (
              <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0" key={row.userId}>
                <Avatar name={row.name} size={36} src={row.image} />
                <div className="min-w-0 flex-1">
                  <Link
                    className="block truncate text-[14px] font-semibold text-brand-ink hover:text-brand-terracotta"
                    href={routes.profile(locale, row.userId)}
                  >
                    {row.name}
                  </Link>
                  <p className="text-[12px] text-brand-muted">
                    {t('blockedOn', { date: row.blockedOn })}
                  </p>
                </div>
                <button
                  className="inline-flex items-center gap-1.5 rounded-xl border border-brand-border px-3 py-1.5 text-[13px] font-medium text-brand-ink transition hover:bg-brand-chip disabled:opacity-50"
                  disabled={isPending}
                  onClick={() => unblock.mutate(row.userId)}
                  type="button"
                >
                  {isPending && <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />}
                  {t('unblock')}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {unblock.isError && (
        <p className="text-[13px] text-red-600" role="alert">
          {t('failed')}
        </p>
      )}
    </section>
  );
}
