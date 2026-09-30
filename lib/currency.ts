/**
 * Bulgaria adopted the euro on 2026-01-01, so every price on the platform (listing rent
 * and deposit, roommate budgets, search filters) is in euro cents. Price filters and
 * sorting compare raw cents, which is only correct while this is the single currency;
 * the `listing_currency_eur` check in `db/schema.ts` enforces it.
 */
export const PLATFORM_CURRENCY = 'EUR' as const;
