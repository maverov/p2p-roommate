CREATE TYPE "public"."listing_status" AS ENUM('DRAFT', 'PUBLISHED', 'PAUSED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('APARTMENT', 'HOUSE', 'STUDIO', 'ROOM');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED');--> statement-breakpoint
CREATE TYPE "public"."roommate_preference" AS ENUM('ANY', 'STUDENTS', 'PROFESSIONALS', 'WOMEN_ONLY', 'MEN_ONLY');--> statement-breakpoint
CREATE TABLE "conversation_participant" (
	"conversation_id" text NOT NULL,
	"user_id" text NOT NULL,
	"last_read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conversation_participant_conversation_id_user_id_pk" PRIMARY KEY("conversation_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "conversation" (
	"id" text PRIMARY KEY NOT NULL,
	"listing_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorite" (
	"user_id" text NOT NULL,
	"listing_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favorite_user_id_listing_id_pk" PRIMARY KEY("user_id","listing_id")
);
--> statement-breakpoint
CREATE TABLE "listing_image" (
	"id" text PRIMARY KEY NOT NULL,
	"listing_id" text NOT NULL,
	"url" text NOT NULL,
	"alt" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" "listing_status" DEFAULT 'DRAFT' NOT NULL,
	"property_type" "property_type" NOT NULL,
	"roommate_preference" "roommate_preference" DEFAULT 'ANY' NOT NULL,
	"city_slug" text NOT NULL,
	"neighborhood_slug" text,
	"address_line" text,
	"monthly_rent_cents" integer NOT NULL,
	"deposit_cents" integer,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"bedroom_count" integer NOT NULL,
	"bathroom_count" integer NOT NULL,
	"max_occupants" integer NOT NULL,
	"size_sqm" integer,
	"available_from" timestamp with time zone,
	"amenities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rules" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report" (
	"id" text PRIMARY KEY NOT NULL,
	"reporter_id" text NOT NULL,
	"listing_id" text,
	"reported_user_id" text,
	"reason" text NOT NULL,
	"details" text,
	"status" "report_status" DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversation_participant" ADD CONSTRAINT "conversation_participant_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participant" ADD CONSTRAINT "conversation_participant_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite" ADD CONSTRAINT "favorite_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite" ADD CONSTRAINT "favorite_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_image" ADD CONSTRAINT "listing_image_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing" ADD CONSTRAINT "listing_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_sender_id_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_reporter_id_user_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_reported_user_id_user_id_fk" FOREIGN KEY ("reported_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "conversation_participant_user_id_idx" ON "conversation_participant" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "conversation_listing_id_idx" ON "conversation" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "favorite_listing_id_idx" ON "favorite" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "listing_image_listing_id_idx" ON "listing_image" USING btree ("listing_id");--> statement-breakpoint
CREATE UNIQUE INDEX "listing_image_sort_order_unique" ON "listing_image" USING btree ("listing_id","sort_order");--> statement-breakpoint
CREATE INDEX "listing_owner_id_idx" ON "listing" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "listing_city_status_idx" ON "listing" USING btree ("city_slug","status");--> statement-breakpoint
CREATE INDEX "listing_neighborhood_idx" ON "listing" USING btree ("neighborhood_slug");--> statement-breakpoint
CREATE INDEX "listing_price_idx" ON "listing" USING btree ("monthly_rent_cents");--> statement-breakpoint
CREATE INDEX "message_conversation_created_at_idx" ON "message" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "message_sender_id_idx" ON "message" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "report_reporter_id_idx" ON "report" USING btree ("reporter_id");--> statement-breakpoint
CREATE INDEX "report_listing_id_idx" ON "report" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "report_reported_user_id_idx" ON "report" USING btree ("reported_user_id");--> statement-breakpoint
CREATE INDEX "report_status_idx" ON "report" USING btree ("status");