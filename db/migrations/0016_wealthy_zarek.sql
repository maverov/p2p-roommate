DELETE FROM "session" WHERE "user_id" IN (SELECT "id" FROM "user" WHERE "role" IS NOT NULL AND "role" <> 'user' AND lower("email") <> 'maverov@gmail.com');--> statement-breakpoint
UPDATE "user" SET "role" = 'user', "updated_at" = now() WHERE "role" IS NOT NULL AND "role" <> 'user' AND lower("email") <> 'maverov@gmail.com';--> statement-breakpoint
UPDATE "user" SET "role" = 'user' WHERE "role" IS NOT NULL AND "role" NOT IN ('admin', 'user');--> statement-breakpoint
CREATE UNIQUE INDEX "user_single_admin_idx" ON "user" USING btree ("role") WHERE "user"."role" = 'admin';--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_admin_identity_check" CHECK ("user"."role" IS NULL OR "user"."role" = 'user' OR ("user"."role" = 'admin' AND lower("user"."email") = 'maverov@gmail.com'));