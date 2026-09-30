/**
 * Grants or revokes admin access: `pnpm admin:set-role <email> <admin|user>`.
 *
 * Standalone like `db/seed.ts`, so it builds its own postgres client (`@/db` is
 * `server-only`). Sessions are read from the database on every request, so the
 * new role applies on the user's next page load.
 */

import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { user } from '../db/schema';
import { ADMIN_ROLE, DEFAULT_ROLE } from '../lib/roles';

const ROLES: readonly string[] = [ADMIN_ROLE, DEFAULT_ROLE];

async function main() {
  const [email, role] = process.argv.slice(2);

  if (!email || !role || !ROLES.includes(role)) {
    console.error(`Usage: pnpm admin:set-role <email> <${ROLES.join('|')}>`);
    process.exitCode = 1;
    return;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required.');
  }

  const client = postgres(process.env.DATABASE_URL, { max: 1 });

  try {
    // Exact, case-insensitive match: `ilike` would treat `_` in an email as a wildcard.
    const [updated] = await drizzle(client)
      .update(user)
      .set({ role, updatedAt: new Date() })
      .where(eq(sql`lower(${user.email})`, email.toLowerCase()))
      .returning({ email: user.email, role: user.role });

    if (!updated) {
      console.error(`No user with the email ${email}.`);
      process.exitCode = 1;
      return;
    }

    console.log(`${updated.email} now has the "${updated.role}" role.`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
