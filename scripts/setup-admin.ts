/** Run after db:migrate against each environment. Never creates a shared password. */
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';

async function main() {
  const email = 'maverov@gmail.com';
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
  const client = postgres(process.env.DATABASE_URL, { max: 1 });
  try {
    await client.begin(async (tx) => {
      await tx`LOCK TABLE "user" IN SHARE ROW EXCLUSIVE MODE`;
      await tx`DELETE FROM session WHERE user_id IN (SELECT id FROM "user" WHERE role = 'admin' AND lower(email) <> ${email})`;
      await tx`UPDATE "user" SET role = 'user', updated_at = now() WHERE role = 'admin' AND lower(email) <> ${email}`;
      const existing = await tx`SELECT id FROM "user" WHERE lower(email) = ${email}`;
      if (existing.length > 1)
        throw new Error('Multiple accounts have the admin email; resolve before setup.');
      if (existing.length) {
        await tx`UPDATE "user" SET name = 'admin', role = 'admin', banned = false, ban_reason = NULL, ban_expires = NULL, updated_at = now() WHERE id = ${existing[0].id}`;
        await tx`UPDATE user_profile SET display_name = 'admin', updated_at = now() WHERE user_id = ${existing[0].id}`;
      } else {
        await tx`INSERT INTO "user" (id, name, email, email_verified, role) VALUES (${randomUUID()}, 'admin', ${email}, false, 'admin')`;
      }
    });
    console.log(
      'Sole admin ready: maverov@gmail.com (name: admin). Existing passwords are unchanged.',
    );
    console.log(
      'For a new account, use Forgot password to set a password, then sign in and verify your email.',
    );
  } finally {
    await client.end();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
