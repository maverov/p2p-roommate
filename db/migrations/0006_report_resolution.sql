ALTER TABLE "report" ADD COLUMN "resolved_by" text;--> statement-breakpoint
ALTER TABLE "report" ADD COLUMN "resolved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "report" ADD COLUMN "resolution_note" text;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_resolved_by_user_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;