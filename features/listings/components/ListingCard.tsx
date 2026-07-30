import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import Link from 'next/link';
import { BedDouble, Maximize2, ShieldCheck, UsersRound } from 'lucide-react';

import { SaveListingButton } from '@/features/listings/components/SaveListingButton';
import { getCityLabel, getNeighborhoodLabel } from '@/lib/areas';
import { formatMoneyFromCents } from '@/lib/format';
import type { Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import { cn } from '@/utils';

/**
 * Structural shape rather than the full `ListingDTO`, so the card also accepts
 * the lighter rows returned by profile and saved-listing queries.
 */
export type ListingCardData = {
  id: string;
  title: string;
  citySlug: string;
  neighborhoodSlug: string | null;
  monthlyRentCents: number;
  currency: string;
  propertyType: 'APARTMENT' | 'HOUSE' | 'STUDIO' | 'ROOM';
  bedroomCount: number;
  sizeSqm: number | null;
  maxOccupants: number;
  isVerified: boolean;
  publishedAt: Date | null;
  images: Array<{ id: string; url: string; alt: string }>;
};

type ListingCardProps = {
  listing: ListingCardData;
  locale: Locale;
  isSaved?: boolean;
  isAuthenticated?: boolean;
  /** Set on the first row of cards so the LCP image is not lazy-loaded. */
  priority?: boolean;
  sizes?: string;
  className?: string;
};

const NEW_LISTING_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

function isNew(publishedAt: Date | null) {
  return publishedAt !== null && Date.now() - publishedAt.getTime() < NEW_LISTING_DAYS * DAY_MS;
}

export async function ListingCard({
  className,
  isAuthenticated = false,
  isSaved = false,
  listing,
  locale,
  priority = false,
  sizes = '(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw',
}: ListingCardProps) {
  const t = await getTranslations({ locale, namespace: 'listings' });
  const tEnums = await getTranslations({ locale, namespace: 'enums' });
  const cover = listing.images[0];
  const neighborhood = getNeighborhoodLabel(
    listing.citySlug,
    listing.neighborhoodSlug,
    locale,
  );
  const city = getCityLabel(listing.citySlug, locale);
  const location = neighborhood ? `${neighborhood}, ${city}` : city;

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-[15px] border border-brand-border bg-white shadow-[0_8px_24px_rgba(75,55,35,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(75,55,35,0.12)]',
        className,
      )}
    >
      <div className="p-2">
        <div className="relative aspect-[16/10] overflow-hidden rounded-[10px] bg-brand-border">
          {cover ? (
            <Image
              alt={cover.alt}
              className="object-cover transition duration-500 group-hover:scale-105"
              fill
              priority={priority}
              quality={85}
              sizes={sizes}
              src={cover.url}
            />
          ) : (
            <span className="flex h-full items-center justify-center px-3 text-center text-[12px] text-brand-muted">
              {t('detail.noPhotos')}
            </span>
          )}

          <div className="absolute left-2.5 top-2.5 z-20 flex flex-col items-start gap-1.5">
            {isNew(listing.publishedAt) && (
              <span className="rounded bg-brand-terracotta px-2 py-1 text-[10px] font-bold text-white">
                NEW
              </span>
            )}

            {listing.isVerified && (
              <span className="flex items-center gap-1 rounded bg-[#cdd465] px-2 py-1 text-[10px] font-bold text-brand-ink">
                <ShieldCheck aria-hidden="true" size={11} strokeWidth={2.4} />
                {t('common.verified')}
              </span>
            )}
          </div>

          <SaveListingButton
            initialSaved={isSaved}
            isAuthenticated={isAuthenticated}
            listingId={listing.id}
            listingTitle={listing.title}
            locale={locale}
            variant="overlay"
          />
        </div>

        <div className="px-2 pb-2 pt-3">
          <h3 className="line-clamp-1 text-[15px] font-bold leading-5 text-brand-ink">
            {listing.title}
          </h3>

          <p className="mt-0.5 line-clamp-1 text-[13px] leading-5 text-brand-muted">
            {location}
          </p>

          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] leading-4 text-brand-muted">
            <span>{tEnums(`propertyType.${listing.propertyType}`)}</span>

            <span className="flex items-center gap-1">
              <BedDouble aria-hidden="true" size={13} strokeWidth={1.8} />
              {listing.bedroomCount}
            </span>

            {listing.sizeSqm !== null && (
              <span className="flex items-center gap-1">
                <Maximize2 aria-hidden="true" size={12} strokeWidth={1.8} />
                {listing.sizeSqm} м²
              </span>
            )}
          </p>

          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="text-[15px] font-bold leading-5 text-brand-terracotta">
              {formatMoneyFromCents(listing.monthlyRentCents, listing.currency, locale)}
              <span className="ml-1 text-[12px] font-medium text-brand-muted">
                {t('common.perMonth')}
              </span>
            </p>

            <span className="flex items-center gap-1 text-[13px] text-brand-muted">
              <UsersRound aria-hidden="true" size={15} strokeWidth={1.8} />
              {listing.maxOccupants}
            </span>
          </div>
        </div>
      </div>

      {/*
        A single overlay link keeps the whole card clickable without nesting the
        save button inside an anchor, which would be invalid and untabbable.
      */}
      <Link
        className="absolute inset-0 z-10 rounded-[15px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terracotta"
        href={routes.listing(locale, listing.id)}
      >
        <span className="sr-only">{listing.title}</span>
      </Link>
    </article>
  );
}
