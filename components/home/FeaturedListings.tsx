import Image from 'next/image';
import Link from 'next/link';
import { BedSingle, Heart, Maximize2, UsersRound } from 'lucide-react';
import SquiggleUnderline from '@/components/ui/SquiggleUnderline';

const FEATURED_LISTINGS = [
  {
    title: 'Слънчева стая в Гео Милев',
    location: 'София',
    price: '420 EUR / month',
    rooms: '1 стая',
    size: '15 м²',
    people: 1,
    tag: 'NEW',
    imageSrc:
      'https://www.e-architect.com/wp-content/uploads/2017/09/tribeca-loft-residential-apartment-new-york-city-x010917-av5.jpg',
    href: '/listings/1',
  },
  {
    title: 'Светъл апартамент с балкон',
    location: 'Пловдив, Център',
    price: '780 EUR / month',
    rooms: '2 стаи',
    size: '65 м²',
    people: 2,
    tag: 'FEATURED',
    imageSrc:
      'https://scontent.fsof8-1.fna.fbcdn.net/v/t39.30808-6/498599158_545602795277750_6047198148928881010_n.jpg?stp=dst-jpg_tt6&cstp=mx1000x1300&ctp=p526x296&_nc_cat=111&ccb=1-7&_nc_sid=aa7b47&_nc_ohc=2BNP3BJ-KugQ7kNvwEFLmsV&_nc_oc=AdrYm0tmja9yNYBHRb91q-U6rOFkYIL7mP5YwJGf4JdgjfWTdEFOjsQxO2szAAsk2j4v5_nXe-IcU6gGnAKh1Mxf&_nc_zt=23&_nc_ht=scontent.fsof8-1.fna&_nc_gid=03RepBf5M5T-lMLNgx7h6w&_nc_ss=7b289&oh=00_Af9VSTlJKOYNN2FE-zsOSe4QGxj6YwAb2nBH2rKM0Ks3mg&oe=6A4078E4',
    href: '/listings/2',
  },
  {
    title: 'Уютно студио до Морската градина',
    location: 'Варна',
    price: '650 EUR / month',
    rooms: '1 стая',
    size: '32 м²',
    people: 1,
    tag: null,
    imageSrc: 'https://i.pinimg.com/1200x/f5/8d/3d/f58d3df50a85b35efa534dc381111b36.jpg',
    href: '/listings/3',
  },
  {
    title: 'Стая в приятелски апартамент',
    location: 'София, Лозенец',
    price: '380 EUR / month',
    rooms: '1 стая',
    size: '14 м²',
    people: 1,
    tag: 'NEW',
    imageSrc:
      'https://thumbs.6sqft.com/wp-content/uploads/2018/07/20044533/41-East-19th-Street-1.jpg?w=1196&format=webp',
    href: '/listings/4',
  },
  {
    title: 'Тавански апартамент с гледка',
    location: 'Велико Търново',
    price: '560 EUR / month',
    rooms: '2 стаи',
    size: '45 м²',
    people: 2,
    tag: null,
    imageSrc: 'https://i.pinimg.com/1200x/e6/2b/f9/e62bf996eb39a279997edf734d4b93b9.jpg',
    href: '/listings/5',
  },
] as const;

export default function FeaturedListings() {
  return (
    <section className="bg-brand-cream px-6 pb-12 pt-4 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-[26px] font-medium leading-none tracking-[-0.03em] text-brand-ink">
              Featured listings
            </h2>

            <SquiggleUnderline />
          </div>

          <Link
            href="/cities"
            className="pt-2 text-md font-medium text-brand-ink transition hover:text-brand-terracotta"
          >
            View all listings →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {FEATURED_LISTINGS.map((listing) => (
            <article
              key={listing.title}
              className="group overflow-hidden rounded-[15px] border border-brand-border bg-white shadow-[0_8px_24px_rgba(75,55,35,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(75,55,35,0.12)]"
            >
              <Link href={listing.href} className="block">
                <div className="relative h-[150px] overflow-hidden">
                  <Image
                    src={listing.imageSrc}
                    alt={listing.title}
                    fill
                    sizes="(min-width: 1024px) 240px, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-brand-terracotta/10 mix-blend-multiply transition group-hover:bg-brand-terracotta/5" />

                  {listing.tag && (
                    <span className="absolute left-3 top-3 rounded bg-brand-terracotta px-2 py-1 text-[10px] font-bold text-white">
                      {listing.tag}
                    </span>
                  )}

                  <button
                    type="button"
                    aria-label="Save listing"
                    className="absolute right-3 top-3 rounded-full bg-white/95 p-2 text-brand-terracotta shadow-sm transition hover:scale-105"
                  >
                    <Heart size={18} strokeWidth={2.2} />
                  </button>
                </div>

                <div className="bg-[#fffaf4] px-4 pb-4 pt-3">
                  <p className="text-[15px] font-bold leading-5 text-brand-terracotta">
                    {listing.price}
                  </p>

                  <h3 className="mt-2 line-clamp-2 text-[14px] font-bold leading-5 text-brand-ink">
                    {listing.title}
                  </h3>

                  <p className="mt-0.5 text-[13px] leading-5 text-brand-muted">
                    {listing.location}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-brand-muted">
                    <span className="flex items-center gap-1">
                      <BedSingle size={14} strokeWidth={1.8} />
                      {listing.rooms}
                    </span>

                    <span className="flex items-center gap-1">
                      <Maximize2 size={13} strokeWidth={1.8} />
                      {listing.size}
                    </span>

                    <span className="flex items-center gap-1">
                      <UsersRound size={14} strokeWidth={1.8} />
                      {listing.people}
                    </span>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
