'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Images, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useDismiss } from '@/hooks';
import type { Locale } from '@/lib/i18n';

type GalleryImage = {
  id: string;
  url: string;
  alt: string;
};

type ListingGalleryProps = {
  images: GalleryImage[];
  locale: Locale;
};

const HERO_SIZES = '(min-width: 1024px) 55vw, 100vw';
const TILE_SIZES = '(min-width: 1024px) 22vw, 50vw';

export function ListingGallery({ images, locale }: ListingGalleryProps) {
  const t = useTranslations('listings.detail');
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpenIndex(null);
    triggerRef.current?.focus();
  }, []);

  const step = useCallback(
    (delta: number) => {
      setOpenIndex((current) => {
        if (current === null) {
          return current;
        }

        return (current + delta + images.length) % images.length;
      });
    },
    [images.length],
  );

  useDismiss({ isOpen: openIndex !== null, onDismiss: close, ref: panelRef });

  // Arrow keys only make sense while the lightbox is open, so the listener and
  // the scroll lock are both scoped to that.
  useEffect(() => {
    if (openIndex === null) {
      return;
    }

    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        step(1);
      } else if (event.key === 'ArrowLeft') {
        step(-1);
      }
    };

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openIndex, step]);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-[15px] border border-brand-border bg-brand-chip text-[14px] text-brand-muted">
        {t('noPhotos')}
      </div>
    );
  }

  const [hero, ...rest] = images;
  const tiles = rest.slice(0, 4);
  const active = openIndex === null ? null : images[openIndex];

  return (
    <>
      <div className="relative">
        <div className="grid gap-2 overflow-hidden rounded-[15px] lg:grid-cols-[minmax(0,1.62fr)_minmax(0,1fr)]">
          <button
            className="group relative aspect-[16/10] overflow-hidden rounded-[12px] bg-brand-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terracotta lg:aspect-auto lg:min-h-[420px]"
            onClick={() => setOpenIndex(0)}
            ref={triggerRef}
            type="button"
          >
            <Image
              alt={hero.alt}
              className="object-cover transition duration-500 group-hover:scale-[1.03]"
              fill
              priority
              quality={88}
              sizes={HERO_SIZES}
              src={hero.url}
            />
          </button>

          {tiles.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {tiles.map((image, index) => (
                <button
                  className="group relative aspect-[4/3] overflow-hidden rounded-[12px] bg-brand-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terracotta lg:aspect-auto"
                  key={image.id}
                  onClick={() => setOpenIndex(index + 1)}
                  type="button"
                >
                  <Image
                    alt={image.alt}
                    className="object-cover transition duration-500 group-hover:scale-[1.04]"
                    fill
                    quality={80}
                    sizes={TILE_SIZES}
                    src={image.url}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-[10px] bg-white/95 px-3.5 py-2 text-[13px] font-bold text-brand-ink shadow-[0_8px_24px_rgba(48,51,41,0.18)] transition hover:text-brand-terracotta focus-visible:outline-2 focus-visible:outline-brand-terracotta"
          onClick={() => setOpenIndex(0)}
          type="button"
        >
          <Images aria-hidden="true" size={15} strokeWidth={2} />
          {t('allPhotos')}
          <span className="text-brand-muted">({images.length})</span>
        </button>
      </div>

      {active && (
        <div
          aria-label={t('allPhotos')}
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col bg-brand-ink/92 p-4 sm:p-8"
          role="dialog"
        >
          <div className="flex items-center justify-between text-white">
            <p className="text-[13px] font-medium">
              {openIndex! + 1} / {images.length}
            </p>

            <button
              aria-label={t('closeGallery')}
              className="rounded-full p-2 transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white"
              onClick={close}
              ref={closeRef}
              type="button"
            >
              <X aria-hidden="true" size={20} strokeWidth={2} />
            </button>
          </div>

          <div
            className="relative mx-auto mt-4 flex w-full max-w-5xl flex-1 items-center"
            ref={panelRef}
          >
            <div className="relative h-full w-full">
              <Image
                alt={active.alt}
                className="object-contain"
                fill
                quality={90}
                sizes="100vw"
                src={active.url}
              />
            </div>

            {images.length > 1 && (
              <>
                <button
                  aria-label={t('previousPhoto')}
                  className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-white/95 p-2.5 text-brand-ink transition hover:text-brand-terracotta focus-visible:outline-2 focus-visible:outline-white"
                  onClick={() => step(-1)}
                  type="button"
                >
                  <ChevronLeft aria-hidden="true" size={20} strokeWidth={2} />
                </button>

                <button
                  aria-label={t('nextPhoto')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-white/95 p-2.5 text-brand-ink transition hover:text-brand-terracotta focus-visible:outline-2 focus-visible:outline-white"
                  onClick={() => step(1)}
                  type="button"
                >
                  <ChevronRight aria-hidden="true" size={20} strokeWidth={2} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
