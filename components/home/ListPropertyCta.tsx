import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function ListPropertyCta() {
  return (
    <section className="bg-brand-cream px-4 py-3 lg:px-6">
      <div className="mx-auto max-w-7xl">
        <div
          className="relative min-h-[112px] overflow-hidden rounded-[11px] bg-[#c95d3c] px-5 py-6 shadow-[0_12px_30px_rgba(75,55,35,0.12)] md:h-[96px] md:min-h-0 md:px-0 md:py-0"
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
              alt="Person listing a property online"
              fill
              sizes="320px"
              className="object-cover object-center"
            />

            <div className="absolute inset-0 bg-[#c95d3c]/15 mix-blend-multiply" />
          </div>

          {/* Soft transition after image */}
          <div className="pointer-events-none absolute left-[275px] top-0 hidden h-full w-[100px] bg-gradient-to-r from-[#f0b08b]/15 to-transparent md:block" />

          {/* Right beige blob */}
          <div className="pointer-events-none absolute -right-2 bottom-0 hidden h-[64px] w-[118px] rounded-tl-full bg-[#eadcc3]/55 md:block" />

          {/* Right leaves */}
          <div className="pointer-events-none absolute right-[17px] bottom-[4px] hidden h-[88px] w-[86px] text-[#334b2f]/80 md:block">
            <LeafDecoration />
          </div>

          <div className="relative z-10 flex h-full flex-col justify-center gap-5 md:flex-row md:items-center md:justify-between md:gap-6 md:pl-[360px] md:pr-[118px]">
            <div>
              <h2 className="mb-3 text-[21px] font-bold leading-[21px] tracking-[-0.01em] text-white">
                Имате свободна стая или имот?
              </h2>

              <p className="mt-[5px] text-[14px] leading-[16px] text-white/95">
                Публикувайте безплатно и намерете новите си наематели.
              </p>
            </div>

            <Link
              href="/list-property"
              className="inline-flex h-11 w-fit shrink-0 items-center justify-center gap-2 rounded-full bg-[#fdfbf8] px-7 text-[13px] font-bold text-[#c45b3b] shadow-[0_4px_12px_rgba(67,45,31,0.12)] transition hover:bg-white"
            >
              Публикувай обява
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
