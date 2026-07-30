import { localeTag as LOCALE_TAG, type Locale } from '@/lib/i18n';

/**
 * `Intl` formatters are expensive to construct, so each distinct configuration
 * is built once and reused for the lifetime of the process.
 */
const moneyFormatters = new Map<string, Intl.NumberFormat>();
const dateFormatters = new Map<string, Intl.DateTimeFormat>();

function moneyFormatter(locale: Locale, currency: string) {
  const key = `${locale}:${currency}`;
  let formatter = moneyFormatters.get(key);

  if (!formatter) {
    formatter = new Intl.NumberFormat(LOCALE_TAG[locale], {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    });
    moneyFormatters.set(key, formatter);
  }

  return formatter;
}

function dateFormatter(locale: Locale, options: Intl.DateTimeFormatOptions) {
  const key = `${locale}:${JSON.stringify(options)}`;
  let formatter = dateFormatters.get(key);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat(LOCALE_TAG[locale], options);
    dateFormatters.set(key, formatter);
  }

  return formatter;
}

/** Money is stored in integer cents to avoid float drift; render it as whole units. */
export function formatMoneyFromCents(cents: number, currency: string, locale: Locale) {
  return moneyFormatter(locale, currency).format(cents / 100);
}

export function formatDate(value: Date | string, locale: Locale) {
  return dateFormatter(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(value),
  );
}

export function formatMonthYear(value: Date | string, locale: Locale) {
  return dateFormatter(locale, { month: 'long', year: 'numeric' }).format(new Date(value));
}

export function formatDateTime(value: Date | string, locale: Locale) {
  return dateFormatter(locale, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

/** Always one decimal place, so 5 renders as "5.0" next to "4.9". */
export function formatRating(rating: number, locale: Locale) {
  return new Intl.NumberFormat(LOCALE_TAG[locale], {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(rating);
}

/**
 * Splits a response time into the unit and value that `common.duration.<unit>`
 * expects. The wording (and its plural rules) lives in the message catalogue —
 * this only decides which unit reads best.
 */
export function responseTimeParts(minutes: number): {
  unit: 'minutes' | 'hours' | 'days';
  value: number;
} {
  if (minutes < 60) {
    return { unit: 'minutes', value: minutes };
  }

  const hours = Math.round(minutes / 60);

  if (hours < 24) {
    return { unit: 'hours', value: hours };
  }

  return { unit: 'days', value: Math.round(hours / 24) };
}

/** Deposit shown as "840 лв (2 months)" when it is a clean multiple of the rent. */
export function depositInMonths(depositCents: number, monthlyRentCents: number) {
  if (monthlyRentCents <= 0) {
    return null;
  }

  const months = depositCents / monthlyRentCents;

  return Number.isInteger(months) && months > 0 ? months : null;
}
