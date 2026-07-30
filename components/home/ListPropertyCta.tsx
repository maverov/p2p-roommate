import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import type { Locale } from '@/lib/i18n';

export default async function ListPropertyCta({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home.listPropertyCta' });

  return (
    <section className="bg-brand-cream px-6 py-3 lg:px-10">
      <div className="mx-auto w-full max-w-[2000px]">
        <div
          className="relative min-h-[112px] overflow-hidden rounded-[14px] bg-[#c95d3c] px-5 py-6 shadow-[0_12px_30px_rgba(75,55,35,0.12)] md:h-[128px] md:min-h-0 md:px-0 md:py-0"
          style={{
            background:
              'linear-gradient(90deg, #c85a38 0%, #d5704c 34%, #c85a38 72%, #c7613f 100%)',
          }}
        >
          {/* Left image organic cutout */}
          <svg className="absolute h-0 w-0">
            <clipPath id="listPropertyPhotoClip" clipPathUnits="objectBoundingBox">
              <path d="M0,0 H0.76 C0.88,0.02 0.98,0.17 0.99,0.34 C1,0.48 0.88,0.54 0.76,0.58 C0.91,0.63 0.99,0.78 0.92,0.90 C0.87,0.98 0.75,1 0.62,1 H0 Z" />
            </clipPath>
          </svg>

          {/* Left image */}
          <div
            className="absolute left-0 top-0 hidden h-full w-[320px] overflow-hidden md:block"
            style={{ clipPath: 'url(#listPropertyPhotoClip)' }}
          >
            <Image
              src="/images/landing/cta_image.jpg"
              alt={t('imageAlt')}
              fill
              sizes="320px"
              className="object-cover object-center"
            />

            <div className="absolute inset-0 bg-[#c95d3c]/15 mix-blend-multiply" />
          </div>

          {/* Soft transition after image */}
          <div className="pointer-events-none absolute left-[275px] top-0 hidden h-full w-[100px] bg-gradient-to-r from-[#f0b08b]/15 to-transparent md:block" />

          {/* Right beige blob */}
          <div className="pointer-events-none absolute -right-2 bottom-0 hidden h-[86px] w-[150px] rounded-tl-full bg-[#eadcc3]/55 md:block" />

          {/* Right leaves */}
          <div className="pointer-events-none absolute bottom-[6px] right-[22px] hidden h-[112px] w-[108px] text-[#334b2f]/80 md:block">
            <LeafDecoration />
          </div>

          <div className="relative z-10 flex h-full flex-col justify-center gap-5 md:flex-row md:items-center md:justify-between md:gap-6 md:pl-[380px] md:pr-[190px]">
            <div>
              <h2 className="mb-3 text-[21px] font-bold leading-[21px] tracking-[-0.01em] text-white">
                {t('heading')}
              </h2>

              <p className="mt-[5px] text-[14px] leading-[16px] text-white/95">
                {t('body')}
              </p>
            </div>

            <Link
              href="/list-property"
              className="inline-flex h-11 w-fit shrink-0 items-center justify-center gap-2 rounded-full bg-[#fdfbf8] px-7 text-[13px] font-bold text-[#c45b3b] shadow-[0_4px_12px_rgba(67,45,31,0.12)] transition hover:bg-white"
            >
              {t('action')}
              <ArrowRight size={16} strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function LeafDecoration() {
  return (
    <svg viewBox="0 0 86 88" fill="none" className="h-full w-full">
      <path
        d="M47 86C44 61 50 35 72 8"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      <ellipse cx="52" cy="65" rx="6.5" ry="18" fill="currentColor" transform="rotate(-42 52 65)" />

      <ellipse cx="67" cy="48" rx="6" ry="17" fill="currentColor" transform="rotate(-33 67 48)" />

      <ellipse cx="75" cy="27" rx="5.5" ry="15" fill="currentColor" transform="rotate(-22 75 27)" />

      <ellipse cx="38" cy="72" rx="5.5" ry="15" fill="currentColor" transform="rotate(36 38 72)" />

      <ellipse cx="50" cy="45" rx="5.5" ry="15" fill="currentColor" transform="rotate(31 50 45)" />
    </svg>
  );
}
