CREATE TYPE "public"."review_target_type" AS ENUM('LISTING', 'USER');--> statement-breakpoint
CREATE TYPE "public"."reviewer_role" AS ENUM('TENANT', 'OWNER');--> statement-breakpoint
CREATE TYPE "public"."viewing_request_status" AS ENUM('REQUESTED', 'ACCEPTED', 'DECLINED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "review" (
	"id" text PRIMARY KEY NOT NULL,
	"reviewer_id" text NOT NULL,
	"target_type" "review_target_type" NOT NULL,
	"target_user_id" text,
	"listing_id" text,
	"reviewer_role" "reviewer_role" NOT NULL,
	"rating" integer NOT NULL,
	"body" text NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_profile" (
	"user_id" text NOT NULL,
	"profile_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_profile_user_id_profile_user_id_pk" PRIMARY KEY("user_id","profile_user_id")
);
--> statement-breakpoint
CREATE TABLE "saved_search" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"filters" jsonb NOT NULL,
	"notifications_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profile" (
	"user_id" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"bio" text,
	"phone_number" text,
	"city_slug" text,
	"neighborhood_slug" text,
	"avatar_url" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"phone_verified" boolean DEFAULT false NOT NULL,
	"identity_verified" boolean DEFAULT false NOT NULL,
	"public_contact_allowed" boolean DEFAULT false NOT NULL,
	"response_time_minutes" integer DEFAULT 120 NOT NULL,
	"response_rate" integer DEFAULT 0 NOT NULL,
	"successful_rentals" integer DEFAULT 0 NOT NULL,
	"traits" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"languages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"roommate_preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "viewing_request" (
	"id" text PRIMARY KEY NOT NULL,
	"listing_id" text NOT NULL,
	"requester_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"requested_start_at" timestamp with time zone NOT NULL,
	"message" text,
	"status" "viewing_request_status" DEFAULT 'REQUESTED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "listing" ADD COLUMN "floor" integer;--> statement-breakpoint
ALTER TABLE "listing" ADD COLUMN "total_floors" integer;--> statement-breakpoint
ALTER TABLE "listing" ADD COLUMN "latitude" double precision;--> statement-breakpoint
ALTER TABLE "listing" ADD COLUMN "longitude" double precision;--> statement-breakpoint
ALTER TABLE "listing" ADD COLUMN "is_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "listing" ADD COLUMN "is_furnished" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "listing" ADD COLUMN "internet_included" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "listing" ADD COLUMN "utilities_included" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "listing" ADD COLUMN "pets_allowed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "listing" ADD COLUMN "near_metro" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "listing" ADD COLUMN "roommate_friendly" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_reviewer_id_user_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_target_user_id_user_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_profile" ADD CONSTRAINT "saved_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_profile" ADD CONSTRAINT "saved_profile_profile_user_id_user_id_fk" FOREIGN KEY ("profile_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_search" ADD CONSTRAINT "saved_search_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "viewing_request" ADD CONSTRAINT "viewing_request_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "viewing_request" ADD CONSTRAINT "viewing_request_requester_id_user_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "viewing_request" ADD CONSTRAINT "viewing_request_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "review_reviewer_id_idx" ON "review" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX "review_target_user_id_idx" ON "review" USING btree ("target_user_id");--> statement-breakpoint
CREATE INDEX "review_listing_id_idx" ON "review" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "review_target_type_idx" ON "review" USING btree ("target_type");--> statement-breakpoint
CREATE INDEX "saved_profile_profile_user_id_idx" ON "saved_profile" USING btree ("profile_user_id");--> statement-breakpoint
CREATE INDEX "saved_search_user_id_idx" ON "saved_search" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_profile_city_idx" ON "user_profile" USING btree ("city_slug");--> statement-breakpoint
CREATE INDEX "user_profile_verified_idx" ON "user_profile" USING btree ("is_verified");--> statement-breakpoint
CREATE INDEX "viewing_request_listing_id_idx" ON "viewing_request" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "viewing_request_requester_id_idx" ON "viewing_request" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "viewing_request_owner_id_idx" ON "viewing_request" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "viewing_request_status_idx" ON "viewing_request" USING btree ("status");--> statement-breakpoint
CREATE INDEX "listing_verified_idx" ON "listing" USING btree ("is_verified");--> statement-breakpoint
CREATE INDEX "listing_available_from_idx" ON "listing" USING btree ("available_from");