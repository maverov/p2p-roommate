import { getTranslations } from 'next-intl/server';

import type { Locale } from '@/lib/i18n';
import { getServerUser } from '@/lib/server/session';

import { NavbarClient } from './NavbarClient';

interface NavbarProps {
  locale: Locale;
}

/**
 * Resolves the session on the server so the signed-in navbar is in the first
 * HTML paint — no "Sign in" → avatar flicker on hydration.
 */
export async function Navbar({ locale }: NavbarProps) {
  const [user, t] = await Promise.all([
    getServerUser(),
    getTranslations({ locale, namespace: 'common.nav' }),
  ]);

  return (
    <nav
      aria-label={t('mainNavigation')}
      className="w-full sticky top-0 z-50 border-b border-brand-border/35 bg-brand-surface"
    >
      <NavbarClient locale={locale} user={user} />
    </nav>
  );
}
