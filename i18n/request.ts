import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

import { isLocale } from '@/lib/i18n';
import { getMessages } from '@/locales';

/**
 * Resolves the messages and formatting context for one request.
 *
 * Wired up through `next-intl/plugin` in `next.config.js`, which aliases
 * `next-intl/config` to this file. Server code reaches it via
 * `getTranslations({ locale, namespace })`; client components get the same data
 * through the `NextIntlClientProvider` in `app/[locale]/layout.tsx`.
 */
export default getRequestConfig(async ({ locale }) => {
  // Locale segments are validated by `app/[locale]/layout.tsx` too, but this runs
  // for every next-intl entry point, including ones reached without a page render.
  if (!isLocale(locale)) {
    notFound();
  }

  return {
    messages: getMessages(locale),
    // Pinned so server and client render identical dates: without it the server
    // uses the host's zone (UTC on Vercel) and the browser uses the visitor's,
    // which produces hydration mismatches on any formatted date.
    timeZone: 'Europe/Sofia',
  };
});
