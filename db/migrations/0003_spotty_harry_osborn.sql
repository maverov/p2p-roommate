CREATE UNIQUE INDEX "review_listing_reviewer_unique" ON "review" USING btree ("reviewer_id","listing_id") WHERE "review"."target_type" = 'LISTING';--> statement-breakpoint
CREATE UNIQUE INDEX "review_user_reviewer_unique" ON "review" USING btree ("reviewer_id","target_user_id") WHERE "review"."target_type" = 'USER';--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_target_columns_check" CHECK ((
        ("review"."target_type" = 'LISTING' AND "review"."listing_id" IS NOT NULL AND "review"."target_user_id" IS NULL)
        OR
        ("review"."target_type" = 'USER' AND "review"."target_user_id" IS NOT NULL AND "review"."listing_id" IS NULL)
      ));