/**
 * Stay lengths, in months, offered wherever someone picks one: a seeker's "room wanted"
 * post and the listing search's stay filter. Listings store any whole number of months.
 */
export const STAY_MONTH_OPTIONS = [1, 3, 6, 12, 24] as const;

/** Upper bound for any stored stay length (five years). */
export const MAX_STAY_MONTHS = 60;

/**
 * Whole years read better than month counts ("1 year", not "12 months"). Callers pass
 * the result to the `common.stay.months` / `common.stay.years` messages.
 */
export function stayLabel(months: number): { unit: 'months' | 'years'; count: number } {
  return months >= 12 && months % 12 === 0
    ? { unit: 'years', count: months / 12 }
    : { unit: 'months', count: months };
}

/** Strict `YYYY-MM-DD`: well-formed and a real calendar day (no 2026-02-30). */
export function isIsoCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const parsed = new Date(`${value}T00:00:00Z`);

  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}
