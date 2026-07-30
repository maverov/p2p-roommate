import { existsSync } from 'node:fs';

import { defineConfig } from 'drizzle-kit';

/**
 * drizzle-kit reads only `.env` on its own, so it silently used the placeholder
 * credentials committed there while the Next.js dev server — which gives
 * `.env.local` priority — connected fine. Reproducing Next's precedence here
 * keeps every `pnpm db:*` command pointed at the database the app actually uses.
 *
 * Two quirks drive the shape of this: `process.loadEnvFile` never overwrites a
 * variable that is already set, so the *highest*-priority file must be loaded
 * first; and drizzle-kit has already injected `.env` by the time this config is
 * evaluated, so that value has to be cleared for a local override to win.
 */
delete process.env.DATABASE_URL;

for (const envFile of ['.env.local', '.env']) {
  if (existsSync(envFile)) {
    process.loadEnvFile(envFile);
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required to run Drizzle commands.');
}

export default defineConfig({
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  strict: true,
  verbose: true,
});
