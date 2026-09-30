-- Bulgaria adopted the euro on 2026-01-01. Listings written before this migration (by the
-- form, the API, or the seed script) were stored in BGN, so convert them at the official
-- fixed rate (1 EUR = 1.95583 BGN), rounding half away from zero to the cent. Any row in a
-- currency other than BGN or EUR makes the constraint below fail; convert it by hand first.
UPDATE "listing"
SET
  "monthly_rent_cents" = ROUND("monthly_rent_cents" / 1.95583),
  "deposit_cents" = ROUND("deposit_cents" / 1.95583),
  "currency" = 'EUR',
  "updated_at" = now()
WHERE "currency" = 'BGN';--> statement-breakpoint
ALTER TABLE "listing" ADD CONSTRAINT "listing_currency_eur" CHECK ("listing"."currency" = 'EUR');
