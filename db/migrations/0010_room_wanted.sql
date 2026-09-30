ALTER TABLE "user_profile" ADD COLUMN "looking_for_room" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "move_in_date" date;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "stay_months" integer;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "wanted_neighborhoods" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
CREATE INDEX "user_profile_looking_city_idx" ON "user_profile" USING btree ("looking_for_room","city_slug");--> statement-breakpoint
ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_stay_months_range" CHECK ("user_profile"."stay_months" BETWEEN 1 AND 60);