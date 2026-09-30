CREATE TYPE "public"."room_type" AS ENUM('SINGLE', 'DOUBLE', 'SHARED');--> statement-breakpoint
ALTER TABLE "listing" ADD COLUMN "room_type" "room_type";--> statement-breakpoint
ALTER TABLE "listing" ADD COLUMN "private_bathroom" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "listing" ADD COLUMN "couples_allowed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "listing" ADD COLUMN "smoking_allowed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "listing" ADD COLUMN "min_stay_months" integer;--> statement-breakpoint
ALTER TABLE "listing" ADD COLUMN "max_stay_months" integer;--> statement-breakpoint
ALTER TABLE "listing" ADD COLUMN "household" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "listing" ADD CONSTRAINT "listing_min_stay_range" CHECK ("listing"."min_stay_months" BETWEEN 1 AND 60);--> statement-breakpoint
ALTER TABLE "listing" ADD CONSTRAINT "listing_max_stay_range" CHECK ("listing"."max_stay_months" BETWEEN 1 AND 60);--> statement-breakpoint
ALTER TABLE "listing" ADD CONSTRAINT "listing_stay_order" CHECK ("listing"."min_stay_months" IS NULL OR "listing"."max_stay_months" IS NULL OR "listing"."min_stay_months" <= "listing"."max_stay_months");