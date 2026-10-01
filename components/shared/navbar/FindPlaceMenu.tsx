'use client';

import {
  BedDouble,
  Building2,
  ChevronDown,
  House,
  LayoutGrid,
  type LucideIcon,
} from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { useDismiss } from '@/hooks';
import type { Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import { cn } from '@/utils';

type FindPlaceItem = 'all' | 'rooms' | 'apartments' | 'houses';

/** The search, whole or pre-filtered by property type; studios sit with apartments. */
export const FIND_PLACE_ITEMS: ReadonlyArray<{
  id: FindPlaceItem;
  icon: LucideIcon;
  href: (locale: Locale) => Route;
}> = [
  { id: 'all', icon: LayoutGrid, href: (locale) => routes.listings(locale) },
  { id: 'rooms', icon: BedDouble, href: (locale) => routes.listings(locale, 'propertyType=ROOM') },
  {
    id: 'apartments',
    icon: Building2,
    href: (locale) => routes.listings(locale, 'propertyType=APARTMENT,STUDIO'),
  },
  { id: 'houses', icon: House, href: (locale) => routes.listings(locale, 'propertyType=HOUSE') },
];

const ITEM_CLASSES =
  'flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[14px] font-medium text-brand-ink transition hover:bg-brand-chip hover:text-brand-terracotta';

/** "Find a room" in the desktop navbar: opens the search by property type. */
export function FindPlaceMenu({ locale }: { locale: Locale }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const pathname = usePathname();
  const t = useTranslations('common.nav');

  const close = useCallback(() => setIsOpen(false), []);

  useDismiss({ isOpen, onDismiss: close, ref: containerRef });

  // Navigating away should never leave an open menu behind.
  useEffect(close, [close, pathname]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && isOpen) {
      close();
      triggerRef.current?.focus();
    }
  };

  return (
    <div className="relative" onKeyDown={handleKeyDown} ref={containerRef}>
      <button
        aria-controls={isOpen ? menuId : undefined}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="flex items-center gap-1.5 text-[15px] font-medium text-brand-ink transition hover:text-brand-terracotta"
        onClick={() => setIsOpen((previous) => !previous)}
        ref={triggerRef}
        type="button"
      >
        {t('findRoom')}
        <ChevronDown
          aria-hidden="true"
          className={cn('transition-transform', isOpen && 'rotate-180')}
          size={16}
          strokeWidth={2}
        />
      </button>

      {isOpen && (
        <div
          aria-label={t('findRoom')}
          className="absolute left-0 top-full z-50 mt-2.5 w-64 overflow-hidden rounded-[12px] border border-brand-border bg-white py-1.5 shadow-[0_16px_48px_rgba(48,51,41,0.14)]"
          id={menuId}
          role="menu"
        >
          {FIND_PLACE_ITEMS.map(({ href, icon: Icon, id }) => (
            <Link
              className={cn(
                ITEM_CLASSES,
                id === 'all' && 'mb-1.5 border-b border-brand-border pb-3',
              )}
              href={href(locale)}
              key={id}
              onClick={close}
              role="menuitem"
            >
              <Icon aria-hidden="true" size={16} strokeWidth={1.75} />
              {t(`findMenu.${id}`)}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
