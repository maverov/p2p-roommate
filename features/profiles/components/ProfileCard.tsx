import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, MapPin } from 'lucide-react';

import { getInitials } from '@/components/shared/Avatar';
import { MatchBadge } from '@/features/compatibility/components/MatchBadge';
import { getRoomWantedRows, type RoomWantedPost } from '@/features/profiles/components/RoomWantedCard';
import { getCityLabel } from '@/lib/areas';
import { VERIFICATION_BADGES } from '@/lib/feature-flags';
import { formatMonthYear } from '@/lib/format';
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
  isVerified?: boolean;
  /** Set when the profile has a published "room wanted" post. */
  roomWanted?: Omit<RoomWantedPost, 'citySlug'> | null;
  traits?: readonly ProfileTrait[];
};

/** A card has room for a few tags; the profile page lists them all. */
const CARD_TRAIT_LIMIT = 4;

type ProfileCardProps = {
  profile: ProfileCardData;
  locale: Locale;
  /** The viewer's compatibility with this person (`scoreProfiles`), when there is one. */
  matchScore?: number | null;
  /** Set on the first row of cards so the LCP image is not lazy-loaded. */
  priority?: boolean;
  sizes?: string;
  className?: string;
};

export async function ProfileCard({
  className,
  locale,
  matchScore = null,
  priority = false,
  profile,
  sizes = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
}: ProfileCardProps) {
  const t = await getTranslations({ locale, namespace: 'saved.profiles' });
  const tSearch = await getTranslations({ locale, namespace: 'profiles.search' });
  const tEnums = await getTranslations({ locale, namespace: 'enums' });
  const traits = profile.traits ?? [];
  const city = profile.citySlug ? getCityLabel(profile.citySlug, locale) : null;
  const roomWantedRows = profile.roomWanted
    ? await getRoomWantedRows(locale, { ...profile.roomWanted, citySlug: profile.citySlug })
    : [];

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-[15px] border border-brand-border bg-white shadow-[0_8px_24px_rgba(75,55,35,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(75,55,35,0.12)]',
        className,
      )}
    >
      <div className="p-2">
        <div className="relative aspect-4/3 overflow-hidden rounded-[10px] bg-brand-sand">
          {profile.image ? (
            <Image
              alt=""
              // Faces sit in the upper part of most portraits.
              className="object-cover object-[center_30%] transition duration-500 group-hover:scale-105"
              fill
              priority={priority}
              quality={85}
              sizes={sizes}
              src={profile.image}
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-full items-center justify-center font-serif text-[64px] font-medium text-brand-olive/60"
            >
              {getInitials(profile.name)}
            </span>
          )}

          {matchScore !== null && (
            <div className="absolute left-2.5 top-2.5">
              <MatchBadge locale={locale} score={matchScore} variant="overlay" />
            </div>
          )}

          {profile.roomWanted && (
            <span className="absolute bottom-2.5 left-2.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-brand-terracotta shadow-sm">
              {tSearch('lookingBadge')}
            </span>
          )}
        </div>

        <div className="px-2 pb-2 pt-3">
          <h3 className="flex items-center gap-1.5 text-[15px] font-bold leading-5 text-brand-ink">
            <span className="truncate">{profile.name}</span>
            {VERIFICATION_BADGES && profile.isVerified && (
              <BadgeCheck
                aria-label={tSearch('verified')}
                className="shrink-0 text-brand-olive"
                size={15}
                strokeWidth={2.2}
              />
            )}
          </h3>

          {city && (
            <p className="mt-0.5 flex items-center gap-1 text-[13px] leading-5 text-brand-muted">
              <MapPin aria-hidden="true" size={12} strokeWidth={1.8} />
              {city}
            </p>
          )}

          {profile.bio && (
            <p className="mt-2 line-clamp-4 text-[13px] leading-5 text-brand-ink/80">{profile.bio}</p>
          )}

          {roomWantedRows.length > 0 && (
            <dl className="mt-3 space-y-1 rounded-[10px] bg-brand-chip px-3 py-2.5 text-[12px] leading-5">
              {roomWantedRows.map((row) => (
                <div className="flex gap-1.5" key={row.label}>
                  <dt className="shrink-0 font-semibold text-brand-ink">{row.label}:</dt>
                  <dd className="min-w-0 truncate text-brand-muted">{row.value}</dd>
                </div>
              ))}
            </dl>
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
            <p className="mt-3 text-[12px] text-brand-muted">
              {t('memberSince')} {formatMonthYear(profile.createdAt, locale)}
            </p>
          )}
        </div>
      </div>

      <Link
        className="absolute inset-0 z-10 rounded-[15px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terracotta"
        href={routes.profile(locale, profile.profileUserId)}
      >
        <span className="sr-only">{profile.name}</span>
      </Link>
    </article>
  );
}
