import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import { HeroSearch } from './HeroSearch';
import { Cormorant_Garamond } from 'next/font/google';

import type { Locale } from '@/lib/i18n';

const cormorant = Cormorant_Garamond({
  subsets: ['latin', 'cyrillic'],
  weight: ['600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
});

// Organic outline of the hero photo, in objectBoundingBox units so it scales with
// the element rather than being pinned to a fixed pixel size. Every side is a
// bezier — a deep sweep on the left, softer waves on the top/bottom, and only a
// slight easing on the right where the image bleeds off the viewport.
const HERO_CLIP = [
  'M 0.380 0.105',
  // aggressive top wave
  'C 0.505 -0.012, 0.645 0.150, 0.800 0.058',
  'C 0.895 0.002, 0.955 0.052, 0.985 0.030',
  // rounded top-right corner, then straight right edge (bleeds off-viewport)
  'C 0.995 0.026, 1 0.042, 1 0.062',
  'L 1 0.960',
  // rounded bottom-right corner, then flat bottom
  'C 1 0.984, 0.990 1, 0.968 1',
  'L 0.140 1',
  // generous bottom-left corner radius
  'C 0.062 1, 0.012 0.952, 0.018 0.878',
  // deep left sweep back up to the start
  'C 0.030 0.620, 0.115 0.300, 0.380 0.105',
  'Z',
].join(' ');

const HERO_IMAGE = '/images/hero/hero_coastal_balcony.png';

export default async function HeroSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home.hero' });

  return (
    <section className="bg-grain relative w-full bg-brand-cream pb-14 lg:pb-20">
      {/* clip-path definition — objectBoundingBox units make it responsive */}
      <svg aria-hidden="true" className="absolute h-0 w-0">
        <defs>
          <clipPath id="hero-blob" clipPathUnits="objectBoundingBox">
            <path d={HERO_CLIP} />
          </clipPath>
        </defs>
      </svg>

      <div className="relative mx-auto w-full max-w-[2000px] overflow-hidden">
        {/* Soft warm glow behind the copy so the left column isn't flat cream */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-40 top-0 hidden h-[520px] w-[720px] rounded-full opacity-60 blur-3xl lg:block"
          style={{
            background:
              'radial-gradient(circle, rgba(200,91,54,0.10) 0%, rgba(123,127,77,0.06) 45%, transparent 70%)',
          }}
        />

        {/* Hero photo — full height of the copy block, bleeding off the right edge */}
        <div
          className="absolute inset-y-0 right-0 z-[1] hidden w-[58%] lg:block"
          style={{ clipPath: 'url(#hero-blob)' }}
        >
          <Image
            src={HERO_IMAGE}
            alt={t('imageAlt')}
            fill
            priority
            sizes="58vw"
            className="object-cover object-center"
          />
        </div>

        {/* Copy — vertically centred against the photo */}
        <div className="relative z-10 flex min-h-[360px] flex-col justify-center px-6 pb-10 pt-10 lg:min-h-[500px] lg:w-[44%] lg:px-10 lg:pb-20 lg:pt-14">
          <h1
            className={`${cormorant.className} text-[clamp(2.75rem,4.2vw,4.75rem)] font-bold leading-[0.94] tracking-[-0.03em] text-brand-ink`}
          >
            {t('headingLine1')}
            <span className="block italic text-brand-terracotta">{t('headingLine2')}</span>
          </h1>

          <p className="mt-6 max-w-md text-lg leading-8 text-brand-muted lg:text-xl">
            {t('subheading')}
          </p>
        </div>

        {/* Mobile / tablet photo */}
        <div className="px-6 lg:hidden">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[28px] bg-brand-border">
            <Image
              src={HERO_IMAGE}
              alt={t('imageAlt')}
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
          </div>
        </div>
      </div>

      {/* Search toolbar, pulled up so it straddles the bottom of the photo */}
      <div className="relative z-30 -mt-8 lg:-mt-16">
        <HeroSearch locale={locale} />
      </div>
    </section>
  );
}
