export const locales = ['bg', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'bg';
export const localeCookieName = 'NEXT_LOCALE';

export function isLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

/**
 * BCP-47 tags for the `Intl` APIs. Locale-aware *behaviour* (dates, currency, list
 * joining) resolves through here; locale-aware *copy* never does — that lives in
 * `locales/<locale>/*.json` and is read with `t('...')`.
 */
export const localeTag: Record<Locale, string> = {
  bg: 'bg-BG',
  en: 'en-US',
};

/** Open Graph wants an underscore-separated tag rather than a BCP-47 one. */
export const openGraphLocale: Record<Locale, string> = {
  bg: 'bg_BG',
  en: 'en_US',
};
