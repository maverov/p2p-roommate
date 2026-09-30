import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { MapPin } from 'lucide-react';

import { Avatar } from '@/components/shared/Avatar';
import { MatchBadge } from '@/features/compatibility/components/MatchBadge';
import { getCityLabel } from '@/lib/areas';
import { PLATFORM_CURRENCY } from '@/lib/currency';
import { formatDate, formatMoneyFromCents, formatMonthYear } from '@/lib/format';
import type { Locale } from '@/lib/i18n';
import type { ProfileTrait } from '@/lib/labels';
import { routes } from '@/lib/routes';
import { cn } from '@/utils';

export type ProfileCardData = {
  profileUserId: string;
  name: string;
  image: string | null;
  citySlug: string | null;
  bio: string | null;
  createdAt: Date | null;
  /** Set when the profile has a published "room wanted" post. */
  roomWanted?: { budgetMaxCents: number | null; moveInDate: string | null } | null;
  traits?: readonly ProfileTrait[];
};

/** A card has room for a few tags; the profile page lists them all. */
const CARD_TRAIT_LIMIT = 3;

type ProfileCardProps = {
  profile: ProfileCardData;
  locale: Locale;
  /** The viewer's compatibility with this person (`scoreProfiles`), when there is one. */
  matchScore?: number | null;
  className?: string;
};

export async function ProfileCard({
  className,
  locale,
  matchScore = null,
  profile,
}: ProfileCardProps) {
  const t = await getTranslations({ locale, namespace: 'saved.profiles' });
  const tSearch = await getTranslations({ locale, namespace: 'profiles.search' });
  const tEnums = await getTranslations({ locale, namespace: 'enums' });
  const traits = profile.traits ?? [];
  const city = profile.citySlug ? getCityLabel(profile.citySlug, locale) : null;
  const roomWanted = profile.roomWanted;
  const roomWantedDetails = roomWanted
    ? [
        roomWanted.budgetMaxCents !== null &&
          tSearch('budgetUpTo', {
            max: formatMoneyFromCents(roomWanted.budgetMaxCents, PLATFORM_CURRENCY, locale),
          }),
        roomWanted.moveInDate &&
          tSearch('movingFrom', { date: formatDate(roomWanted.moveInDate, locale) }),
      ].filter(Boolean)
    : [];

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
          <p className="truncate text-[15px] font-bold leading-5 text-brand-ink">{profile.name}</p>

          {city && (
            <p className="mt-0.5 flex items-center gap-1 text-[13px] leading-5 text-brand-muted">
              <MapPin aria-hidden="true" size={12} strokeWidth={1.8} />
              {city}
            </p>
          )}
        </div>

        {matchScore !== null && <MatchBadge locale={locale} score={matchScore} variant="inline" />}
      </div>

      {roomWanted && (
        <p className="mt-3 text-[12px] leading-5 text-brand-ink">
          <span className="rounded-full bg-brand-terracotta/10 px-2 py-0.5 font-semibold text-brand-terracotta">
            {tSearch('lookingBadge')}
          </span>
          {roomWantedDetails.length > 0 && (
            <span className="ml-2 text-brand-muted">{roomWantedDetails.join(' · ')}</span>
          )}
        </p>
      )}

      {profile.bio && (
        <p className="mt-3 line-clamp-2 text-[13px] leading-5 text-brand-muted">{profile.bio}</p>
      )}

      {traits.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {traits.slice(0, CARD_TRAIT_LIMIT).map((trait) => (
            <li
              className="rounded-full border border-brand-border px-2 py-0.5 text-[11px] text-brand-ink"
              key={trait}
            >
              {tEnums(`profileTrait.${trait}`)}
            </li>
          ))}
          {traits.length > CARD_TRAIT_LIMIT && (
            <li className="px-1 py-0.5 text-[11px] text-brand-muted">
              +{traits.length - CARD_TRAIT_LIMIT}
            </li>
          )}
        </ul>
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
