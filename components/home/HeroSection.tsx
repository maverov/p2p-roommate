import Image from 'next/image';
import { HeroSearch } from './HeroSearch';
import { Cormorant_Garamond } from 'next/font/google';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['700'],
  style: ['normal', 'italic'],
  display: 'swap',
});

export default function HeroSection() {
  return (
    <section className="relative bg-brand-cream pb-10 md:pb-24">
      <div className="relative mx-auto min-h-[620px] max-w-7xl px-6 md:h-[390px] md:min-h-0 lg:px-8">
        {/* Left text */}
        <div className="relative z-10 pt-12 md:pt-16">
          <h1
            className={`${cormorant.className} max-w-xl text-[72px] leading-[0.9] tracking-[-0.035em] text-brand-ink`}
          >
            No agents.
            <span className="block italic text-brand-terracotta">No commissions.</span>
          </h1>

          <p className="mt-6 max-w-sm text-lg leading-7 text-brand-muted">
            Rooms, apartments and roommates across Bulgaria.
          </p>
        </div>

        {/* Right hero image */}
        <div
          className="absolute right-0 top-0 hidden h-[305px] w-[760px] overflow-hidden lg:block"
          style={{
            clipPath:
              'path("M 150 0 H 760 V 305 H 0 C 105 268 142 226 132 177 C 121 119 112 57 150 0 Z")',
          }}
        >
          <Image
            src="/images/hero/hero_coastal_balcony.png"
            alt="Coastal balcony in Bulgaria"
            fill
            priority
            sizes="760px"
            className="object-cover object-center"
          />
        </div>

        <HeroSearch />
      </div>
    </section>
  );
}
