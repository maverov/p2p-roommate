CREATE INDEX "listing_status_published_idx" ON "listing" USING btree ("status","published_at");--> statement-breakpoint
ALTER TABLE "listing" ADD CONSTRAINT "listing_monthly_rent_positive" CHECK ("listing"."monthly_rent_cents" > 0);--> statement-breakpoint
ALTER TABLE "listing" ADD CONSTRAINT "listing_deposit_nonnegative" CHECK ("listing"."deposit_cents" >= 0);--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_rating_range" CHECK ("review"."rating" BETWEEN 1 AND 5);--> statement-breakpoint
ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_response_rate_range" CHECK ("user_profile"."response_rate" BETWEEN 0 AND 100);