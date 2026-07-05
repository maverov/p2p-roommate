export const SUPPORTED_LOCALES = ["en", "bg"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";