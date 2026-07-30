import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { MapPin } from 'lucide-react';

import { Avatar } from '@/components/shared/Avatar';
import { getCityLabel } from '@/lib/areas';
import { formatMonthYear } from '@/lib/format';
import type { Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import { cn } from '@/utils';

export type ProfileCardData = {
  profileUserId: string;
  name: string;
  image: string | null;
  citySlug: string | null;
  bio: string | null;
  createdAt: Date | null;
};

type ProfileCardProps = {
  profile: ProfileCardData;
  locale: Locale;
  className?: string;
};

export async function ProfileCard({ profile, locale, className }: ProfileCardProps) {
  const t = await getTranslations({ locale, namespace: 'saved.profiles' });
  const city = profile.citySlug ? getCityLabel(profile.citySlug, locale) : null;

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-[15px] border border-brand-border bg-white p-4 shadow-[0_8px_24px_rgba(75,55,35,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(75,55,35,0.12)]',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar name={profile.name} size={48} src={profile.image} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold leading-5 text-brand-ink">
            {profile.name}
          </p>

          {city && (
            <p className="mt-0.5 flex items-center gap-1 text-[13px] leading-5 text-brand-muted">
              <MapPin aria-hidden="true" size={12} strokeWidth={1.8} />
              {city}
            </p>
          )}
        </div>
      </div>

      {profile.bio && (
        <p className="mt-3 line-clamp-2 text-[13px] leading-5 text-brand-muted">{profile.bio}</p>
      )}

      {profile.createdAt && (
        <p className="mt-2 text-[12px] text-brand-muted">
          {t('memberSince')} {formatMonthYear(profile.createdAt, locale)}
        </p>
      )}

      <Link
        className="absolute inset-0 z-10 rounded-[15px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terracotta"
        href={routes.profile(locale, profile.profileUserId)}
      >
        <span className="sr-only">{profile.name}</span>
      </Link>
    </article>
  );
}
