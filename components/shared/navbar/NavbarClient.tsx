'use client';

import { CalendarCheck, Heart, Home, LogOut, Menu, MessageSquare, User, X } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Fragment, useCallback, useEffect, useState } from 'react';

import { Avatar } from '@/components/shared/Avatar';
import { useSignOut, type SessionUser } from '@/features/auth';
import { locales, type Locale } from '@/lib/i18n';
import { routes, withLocale } from '@/lib/routes';

import { UserMenu } from './UserMenu';

interface NavbarClientProps {
  locale: Locale;
  user: SessionUser | null;
}

export function NavbarClient({ locale, user }: NavbarClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const toggleMenu = useCallback(() => setIsOpen((prev) => !prev), []);
  const closeMenu = useCallback(() => setIsOpen(false), []);
  const signOut = useSignOut();
  const t = useTranslations('common.nav');

  // Route changes close the mobile sheet so it never covers the new page.
  useEffect(closeMenu, [closeMenu, pathname]);

  // Page-level guards attach their own `next`, including query strings.
  const loginHref = routes.login(pathname);

  return (
    <>
      <div className="mx-auto w-full max-w-[2000px] px-6 lg:px-10">
        <div className="flex h-19 items-center">
          {/* Logo Placeholder */}
          <Link href={routes.home(locale)} className="flex shrink-0 items-center gap-2.5">
            <svg className="h-10 w-10" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <circle cx="20" cy="20" r="18" fill="#c85b36" />
              <path d="M20 8L26 24H14L20 8Z" fill="white" />
            </svg>
            <span className="text-2xl font-bold tracking-tight text-brand-terracotta">
              stay<span className="text-brand-ink">.bg</span>
            </span>
          </Link>

          {/* Primary Navigation */}
          <nav className="ml-12 hidden items-center gap-9 lg:flex">
            <Link
              href={routes.listings(locale)}
              className="text-[15px] font-medium text-brand-ink transition hover:text-brand-terracotta"
            >
              {t('findRoom')}
            </Link>
            <Link
              href={routes.findRoommate(locale)}
              className="text-[15px] font-medium text-brand-ink transition hover:text-brand-terracotta"
            >
              {t('findRoommate')}
            </Link>
            <Link
              href={routes.listProperty(locale)}
              className="group flex items-center gap-2.5 text-[15px] font-medium text-brand-ink transition hover:text-brand-terracotta"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-brand-terracotta/35 bg-brand-terracotta/10 text-brand-terracotta transition group-hover:bg-brand-terracotta/20">
                <Home size={16} strokeWidth={2} />
              </span>
              {t('listProperty')}
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="ml-auto flex items-center gap-7">
            <Link
              href={routes.messages(locale)}
              className="hidden items-center gap-2 text-[15px] font-medium text-brand-ink transition hover:text-brand-terracotta lg:flex"
            >
              <MessageSquare size={18} strokeWidth={1.75} />
              {t('messages')}
            </Link>

            <Link
              href={routes.saved(locale)}
              className="hidden items-center gap-2 text-[15px] font-medium text-brand-ink transition hover:text-brand-terracotta lg:flex"
            >
              <Heart size={18} strokeWidth={1.75} />
              {t('saved')}
            </Link>

            {/* Language Switcher */}
            <LocaleLinks
              className="hidden items-center text-[15px] font-semibold lg:flex"
              locale={locale}
              pathname={pathname}
            />

            {/* Account */}
            {user ? (
              <div className="hidden lg:block">
                <UserMenu locale={locale} user={user} />
              </div>
            ) : (
              <Link
                href={loginHref}
                className="hidden rounded-full bg-brand-terracotta px-6 py-2.5 text-[15px] font-semibold text-white transition hover:bg-brand-terracotta-hover lg:block"
              >
                {t('signIn')}
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              aria-label={t('toggleMenu')}
              aria-expanded={isOpen}
              className="text-brand-ink lg:hidden"
            >
              {isOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden">
          <div className="mx-auto w-full max-w-[2000px] px-6 pb-5 lg:px-10">
            <nav className="flex flex-col gap-1">
              <Link
                href={routes.listings(locale)}
                className="py-2 text-[15px] font-medium text-brand-ink hover:text-brand-terracotta"
              >
                {t('findRoom')}
              </Link>
              <Link
                href={routes.findRoommate(locale)}
                className="py-2 text-[15px] font-medium text-brand-ink hover:text-brand-terracotta"
              >
                {t('findRoommate')}
              </Link>
              <Link
                href={routes.listProperty(locale)}
                className="flex items-center gap-2.5 py-2 text-[15px] font-medium text-brand-ink hover:text-brand-terracotta"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-brand-terracotta/35 bg-brand-terracotta/10 text-brand-terracotta">
                  <Home size={16} strokeWidth={2} />
                </span>
                {t('listProperty')}
              </Link>
              <Link
                href={routes.messages(locale)}
                className="flex items-center gap-2 py-2 text-[15px] font-medium text-brand-ink hover:text-brand-terracotta"
              >
                <MessageSquare size={18} strokeWidth={1.75} />
                {t('messages')}
              </Link>
              <Link
                href={routes.saved(locale)}
                className="flex items-center gap-2 py-2 text-[15px] font-medium text-brand-ink hover:text-brand-terracotta"
              >
                <Heart size={18} strokeWidth={1.75} />
                {t('saved')}
              </Link>

              {user && (
                <>
                  <Link
                    href={routes.profile(locale, user.id)}
                    className="flex items-center gap-2 py-2 text-[15px] font-medium text-brand-ink hover:text-brand-terracotta"
                  >
                    <User size={18} strokeWidth={1.75} />
                    {t('profile')}
                  </Link>
                  <Link
                    href={routes.myListings(locale)}
                    className="flex items-center gap-2 py-2 text-[15px] font-medium text-brand-ink hover:text-brand-terracotta"
                  >
                    <Home size={18} strokeWidth={1.75} />
                    {t('myListings')}
                  </Link>
                  <Link
                    href={routes.viewingRequests(locale)}
                    className="flex items-center gap-2 py-2 text-[15px] font-medium text-brand-ink hover:text-brand-terracotta"
                  >
                    <CalendarCheck size={18} strokeWidth={1.75} />
                    {t('viewingRequests')}
                  </Link>
                </>
              )}

              <LocaleLinks
                className="mt-3 flex items-center text-[15px] font-semibold"
                locale={locale}
                pathname={pathname}
              />

              {user ? (
                <div className="mt-4 flex items-center gap-3 border-t border-brand-border pt-4">
                  <Avatar name={user.name} size={38} src={user.image} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold text-brand-ink">{user.name}</p>
                    <p className="truncate text-[12px] text-brand-muted">{user.email}</p>
                  </div>
                  <button
                    aria-label={t('signOut')}
                    className="flex items-center gap-2 rounded-full border border-brand-border px-4 py-2 text-[14px] font-semibold text-brand-ink transition hover:text-brand-terracotta disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={signOut.isPending}
                    onClick={() => signOut.mutate()}
                    type="button"
                  >
                    <LogOut size={16} strokeWidth={1.75} />
                    {signOut.isPending ? t('signingOut') : t('signOut')}
                  </button>
                </div>
              ) : (
                <Link
                  href={loginHref}
                  className="mt-4 w-full rounded-full bg-brand-terracotta px-6 py-2.5 text-center text-[15px] font-semibold text-white transition hover:bg-brand-terracotta-hover"
                >
                  {t('signIn')}
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

type LocaleLinksProps = {
  className: string;
  locale: Locale;
  pathname: string;
};

/**
 * Real links rather than buttons: crawlable, works without JS, and each
 * navigation passes through next-intl's middleware so the locale cookie stays
 * in sync with the URL.
 */
function LocaleLinks({ className, locale, pathname }: LocaleLinksProps) {
  const t = useTranslations('common.nav');

  return (
    <div aria-label={t('switchLanguage')} className={className} role="group">
      {locales.map((candidate, index) => (
        <Fragment key={candidate}>
          {index > 0 && <span className="mx-0.5 text-brand-terracotta">/</span>}
          <Link
            aria-current={candidate === locale ? 'true' : undefined}
            className={
              candidate === locale
                ? 'text-brand-terracotta transition hover:text-brand-terracotta-hover'
                : 'text-brand-ink transition hover:text-brand-terracotta'
            }
            href={withLocale(pathname, candidate)}
            hrefLang={candidate}
          >
            {candidate.toUpperCase()}
          </Link>
        </Fragment>
      ))}
    </div>
  );
}
