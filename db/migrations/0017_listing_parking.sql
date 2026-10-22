CREATE TYPE "public"."listing_kind" AS ENUM('HOME', 'PARKING');--> statement-breakpoint
CREATE TYPE "public"."parking_type" AS ENUM('GARAGE', 'UNDERGROUND', 'COVERED', 'OPEN');--> statement-breakpoint
ALTER TABLE "listing" ALTER COLUMN "property_type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "listing" ALTER COLUMN "bedroom_count" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "listing" ALTER COLUMN "bathroom_count" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "listing" ALTER COLUMN "max_occupants" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "listing" ADD COLUMN "kind" "listing_kind" DEFAULT 'HOME' NOT NULL;--> statement-breakpoint
ALTER TABLE "listing" ADD COLUMN "parking_type" "parking_type";--> statement-breakpoint
ALTER TABLE "listing" ADD COLUMN "max_vehicle_length_cm" integer;--> statement-breakpoint
ALTER TABLE "listing" ADD COLUMN "ev_charging" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "listing" ADD COLUMN "gated_access" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "listing_parking_city_status_idx" ON "listing" USING btree ("city_slug","status") WHERE "listing"."kind" = 'PARKING';--> statement-breakpoint
ALTER TABLE "listing" ADD CONSTRAINT "listing_home_shape" CHECK ("listing"."kind" <> 'HOME' OR ("listing"."property_type" IS NOT NULL AND "listing"."bedroom_count" IS NOT NULL AND "listing"."bathroom_count" IS NOT NULL AND "listing"."max_occupants" IS NOT NULL));--> statement-breakpoint
ALTER TABLE "listing" ADD CONSTRAINT "listing_parking_shape" CHECK ("listing"."kind" <> 'PARKING' OR ("listing"."parking_type" IS NOT NULL AND "listing"."property_type" IS NULL AND "listing"."room_type" IS NULL AND "listing"."bedroom_count" IS NULL AND "listing"."bathroom_count" IS NULL AND "listing"."max_occupants" IS NULL));