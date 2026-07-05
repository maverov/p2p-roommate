import Image from 'next/image';
import Link from 'next/link';
import SquiggleUnderline from '@/components/ui/SquiggleUnderline';

const POPULAR_CITIES = [
  {
    name: 'София',
    listings: '1250+ обяви',
    imageSrc: '/images/landing/sofia.jpg',
    imagePosition: 'center 45%',
    href: '/search?city=sofia',
  },
  {
    name: 'Пловдив',
    listings: '980+ обяви',
    imageSrc: '/images/landing/plovdiv.jpg',
    imagePosition: 'center 45%',
    href: '/search?city=plovdiv',
  },
  {
    name: 'Варна',
    listings: '850+ обяви',
    imageSrc: '/images/landing/varna.jpg',
    imagePosition: 'center 50%',
    href: '/search?city=varna',
  },
  {
    name: 'Бургас',
    listings: '620+ обяви',
    imageSrc: '/images/landing/burgas.jpg',
    imagePosition: 'center 50%',
    href: '/search?city=burgas',
  },
  {
    name: 'Хасково',
    listings: '310+ обяви',
    imageSrc: '/images/landing/haskovo.jpg',
    imagePosition: 'center 45%',
    href: '/search?city=haskovo',
  },
] as const;

export default function PopularCities() {
  return (
    <section className="bg-brand-cream px-6 pb-12 pt-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-[26px] font-medium leading-none tracking-[-0.03em] text-brand-ink">
              Popular cities
            </h2>

            <SquiggleUnderline />
          </div>

          <Link
            href="/cities"
            className="pt-2 text-md font-medium text-brand-ink transition hover:text-brand-terracotta"
          >
            View all cities →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {POPULAR_CITIES.map((city) => (
            <Link
              key={city.name}
              href={city.href}
              className="group overflow-hidden rounded-[15px] border border-brand-border bg-brand-chip shadow-[0_8px_24px_rgba(75,55,35,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(75,55,35,0.12)]"
            >
              <div className="relative h-[100px] overflow-hidden">
                <Image
                  src={city.imageSrc}
                  alt={`${city.name} listings`}
                  fill
                  sizes="(min-width: 1024px) 240px, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                  style={{ objectPosition: city.imagePosition }}
                />

                <div className="absolute inset-0 bg-brand-terracotta/20 mix-blend-multiply transition group-hover:bg-brand-terracotta/20" />
              </div>

              <div className="px-4 pb-4 pt-3">
                <h3 className="text-[15px] font-bold leading-5 text-brand-olive">{city.name}</h3>
                <p className="mt-0.5 text-[13px] leading-5 text-brand-muted">{city.listings}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
