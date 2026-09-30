ALTER TABLE "user_profile" DROP CONSTRAINT "user_profile_response_rate_range";--> statement-breakpoint
ALTER TABLE "user_profile" DROP COLUMN "response_time_minutes";--> statement-breakpoint
ALTER TABLE "user_profile" DROP COLUMN "response_rate";--> statement-breakpoint
ALTER TABLE "user_profile" DROP COLUMN "successful_rentals";