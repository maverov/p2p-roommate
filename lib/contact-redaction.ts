/**
 * Masks phone numbers and email addresses in user-written text (listing descriptions,
 * profile bios) for visitors who are not signed in. Contact then has to go through a
 * signed-in account, which is where rate limits, reports and blocking apply, and
 * scrapers harvesting numbers get nothing.
 *
 * Deliberately conservative about what counts as a phone number, so prices, sizes,
 * years and dates survive:
 * - it must start with `+`, `00`, `359` or `0` (Bulgarian numbers are written with a
 *   leading 0 or the country code), and
 * - have 8–15 digits in total, separated only by spaces, `-`, `/` or brackets — not
 *   dots, so a date like 01.10.2026 is left alone.
 */
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9-]+(?:\.[A-Z0-9-]+)*\.[A-Z]{2,}/gi;
const PHONE = /(?:\+|\b00|\b359|\b0)[ \-/()]{0,2}\d(?:[ \-/()]{0,2}\d){6,16}/g;

const MIN_PHONE_DIGITS = 8;
const MAX_PHONE_DIGITS = 15;

const digitCount = (value: string) => value.replace(/\D/g, '').length;

export function redactContactDetails(text: string, replacement: string): string {
  return text.replace(EMAIL, replacement).replace(PHONE, (match) => {
    const digits = digitCount(match);
    return digits >= MIN_PHONE_DIGITS && digits <= MAX_PHONE_DIGITS ? replacement : match;
  });
}

/** What public API responses put in place of a hidden phone number or email. */
export const API_CONTACT_PLACEHOLDER = '[contact details hidden: sign in to see them]';

type TextValue = string | string[] | null | undefined;

/** Returns a copy of `value` with `keys` (strings, string arrays or null) redacted. */
export function redactFields<T extends object, K extends keyof T>(
  value: T,
  keys: readonly K[],
  replacement: string,
): T {
  const copy = { ...value };

  for (const key of keys) {
    const field = copy[key] as TextValue;

    if (typeof field === 'string') {
      copy[key] = redactContactDetails(field, replacement) as T[K];
    } else if (Array.isArray(field)) {
      copy[key] = field.map((item) => redactContactDetails(item, replacement)) as T[K];
    }
  }

  return copy;
}

/** The user-written listing fields a phone number or email can hide in. */
export const LISTING_TEXT_FIELDS = ['title', 'description', 'rules', 'amenities'] as const;
export const PROFILE_TEXT_FIELDS = ['bio'] as const;
