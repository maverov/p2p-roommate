import type { Messages } from '@/locales';

/**
 * Teaches next-intl the shape of the message catalogue, so `t('...')` only accepts
 * keys that actually exist and `getTranslations('listings.search')` only accepts real
 * namespaces. A typo is a `tsc` error, not a key echoed into the UI at runtime.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface IntlMessages extends Messages {}
}
