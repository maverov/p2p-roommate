export const locales = ['bg', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'bg';
export const localeCookieName = 'NEXT_LOCALE';

export function isLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}
