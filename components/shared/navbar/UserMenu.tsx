'use client';

import { CalendarCheck, ChevronDown, Home, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { Avatar } from '@/components/shared/Avatar';
import { useSignOut, type SessionUser } from '@/features/auth';
import { useDismiss } from '@/hooks';
import type { Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import { cn } from '@/utils';

type UserMenuProps = {
  user: SessionUser;
  locale: Locale;
};

const ITEM_CLASSES =
  'flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[14px] font-medium text-brand-ink transition hover:bg-brand-chip hover:text-brand-terracotta';


export function UserMenu({ user, locale }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const pathname = usePathname();
  const signOut = useSignOut();
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

  const menuItems = [
    { href: routes.profile(locale, user.id), icon: User, label: t('profile') },
    { href: routes.myListings(locale), icon: Home, label: t('myListings') },
    { href: routes.viewingRequests(locale), icon: CalendarCheck, label: t('viewingRequests') },
  ];

  return (
    <div className="relative" onKeyDown={handleKeyDown} ref={containerRef}>
      <button
        aria-controls={isOpen ? menuId : undefined}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={t('accountMenu', { name: user.name })}
        className="flex items-center gap-1.5 rounded-full transition hover:opacity-90"
        onClick={() => setIsOpen((previous) => !previous)}
        ref={triggerRef}
        type="button"
      >
        <Avatar name={user.name} size={38} src={user.image} />
        <ChevronDown
          aria-hidden="true"
          className={cn('text-brand-ink transition-transform', isOpen && 'rotate-180')}
          size={16}
          strokeWidth={2}
        />
      </button>

      {isOpen && (
        <div
          aria-label={t('account')}
          className="absolute right-0 top-full z-50 mt-2.5 w-60 overflow-hidden rounded-[12px] border border-brand-border bg-white py-1.5 shadow-[0_16px_48px_rgba(48,51,41,0.14)]"
          id={menuId}
          role="menu"
        >
          <div className="border-b border-brand-border px-4 pb-2.5 pt-1.5">
            <p className="truncate text-[14px] font-bold text-brand-ink">{user.name}</p>
            <p className="truncate text-[12px] text-brand-muted">{user.email}</p>
          </div>

          {menuItems.map(({ href, icon: Icon, label }) => (
            <Link className={ITEM_CLASSES} href={href} key={href} onClick={close} role="menuitem">
              <Icon aria-hidden="true" size={16} strokeWidth={1.75} />
              {label}
            </Link>
          ))}

          <div className="mt-1.5 border-t border-brand-border pt-1.5">
            <button
              className={cn(ITEM_CLASSES, 'disabled:cursor-not-allowed disabled:opacity-60')}
              disabled={signOut.isPending}
              onClick={() => signOut.mutate()}
              role="menuitem"
              type="button"
            >
              <LogOut aria-hidden="true" size={16} strokeWidth={1.75} />
              {signOut.isPending ? t('signingOut') : t('signOut')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
