import 'server-only';

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { serverEnv } from '@/lib/server/env';

import * as schema from './schema';

const globalForDb = globalThis as unknown as {
  postgresClient?: postgres.Sql;
};

const client =
  globalForDb.postgresClient ??
  postgres(serverEnv.DATABASE_URL, {
    max: 10,
    prepare: false,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.postgresClient = client;
}

export const db = drizzle(client, { schema });
