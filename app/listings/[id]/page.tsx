import Image from 'next/image';
import { notFound } from 'next/navigation';
import { CalendarDays, Home, MapPin, ShieldCheck, UsersRound } from 'lucide-react';

import { getListingById } from '@/features/listings';

type ListingPageProps = {
  params: {
    id: string;
  };
};

export default function ListingPage({ params }: ListingPageProps) {
  const listing = getListingById(params.id);

  if (!listing) {
    notFound();
  }

  const primaryImage = listing.images[0];

  return (
    <main className="min-h-screen bg-[#fffaf4] text-brand-ink">
      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-brand-border">
            <Image
              alt={primaryImage.alt}
              className="object-cover"
              fill
              priority
              sizes="(min-width: 1024px) 820px, 100vw"
              src={primaryImage.url}
            />
          </div>

          <div className="mt-8">
            <p className="flex items-center gap-2 text-sm font-medium text-brand-terracotta">
              <MapPin size={16} />
              {listing.neighborhood}, {listing.city}
            </p>

            <h1 className="mt-3 max-w-3xl font-serif text-4xl font-medium leading-tight text-brand-ink">
              {listing.title}
            </h1>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-brand-muted sm:grid-cols-4">
              <span className="flex items-center gap-2 rounded-md border border-brand-border bg-white px-3 py-2">
                <Home size={16} />
                {listing.propertyType}
              </span>
              <span className="flex items-center gap-2 rounded-md border border-brand-border bg-white px-3 py-2">
                <UsersRound size={16} />
                Up to {listing.maxOccupants}
              </span>
              <span className="flex items-center gap-2 rounded-md border border-brand-border bg-white px-3 py-2">
                <ShieldCheck size={16} />
                {listing.sizeSqm} sqm
              </span>
              <span className="flex items-center gap-2 rounded-md border border-brand-border bg-white px-3 py-2">
                <CalendarDays size={16} />
                {listing.availableFrom}
              </span>
            </div>
          </div>

          <section className="mt-10">
            <h2 className="text-xl font-semibold text-brand-ink">About this place</h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-brand-muted">
              {listing.description}
            </p>
          </section>

          <section className="mt-10 grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="text-xl font-semibold text-brand-ink">Amenities</h2>
              <ul className="mt-3 grid gap-2 text-brand-muted">
                {listing.amenities.map((amenity) => (
                  <li key={amenity}>- {amenity}</li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-brand-ink">House rules</h2>
              <ul className="mt-3 grid gap-2 text-brand-muted">
                {listing.rules.map((rule) => (
                  <li key={rule}>- {rule}</li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-lg border border-brand-border bg-white p-5 shadow-[0_16px_48px_rgba(48,51,41,0.10)] lg:sticky lg:top-8">
          <p className="text-sm font-medium text-brand-muted">Monthly rent</p>
          <p className="mt-1 text-3xl font-bold text-brand-terracotta">
            {listing.monthlyRent}
          </p>

          <dl className="mt-5 grid gap-3 border-t border-brand-border pt-5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-brand-muted">Deposit</dt>
              <dd className="font-medium text-brand-ink">{listing.deposit}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-brand-muted">Bedrooms</dt>
              <dd className="font-medium text-brand-ink">{listing.bedroomCount}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-brand-muted">Bathrooms</dt>
              <dd className="font-medium text-brand-ink">{listing.bathroomCount}</dd>
            </div>
          </dl>

          <button
            className="mt-6 w-full rounded-md bg-brand-terracotta px-4 py-3 font-semibold text-white transition hover:bg-brand-terracotta-hover"
            type="button"
          >
            Contact host
          </button>
        </aside>
      </section>
    </main>
  );
}
