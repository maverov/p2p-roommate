import { sql } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import postgres from 'postgres';
import { expect, it } from 'vitest';

import { publicUserCondition } from './public-user';

const now = new Date('2026-10-16T12:00:00Z');

it('filters bans at query time, including their expiry', () => {
  const query = new PgDialect().sqlToQuery(publicUserCondition(now));
  expect(query.sql).toBe('("user"."banned" = $1 or "user"."ban_expires" <= $2)');
  expect(query.params).toEqual([false, now.toISOString()]);
});

// Optional read-only Postgres integration: no application tables or data are changed.
it.skipIf(!process.env.TEST_DATABASE_URL)(
  'excludes permanent/active bans and restores expired bans',
  async () => {
    const client = postgres(process.env.TEST_DATABASE_URL!, { max: 1, connect_timeout: 5 });
    try {
      const query = new PgDialect().sqlToQuery(sql`
      select "user".id from (values
        ('normal', false, null::timestamptz),
        ('permanent', true, null::timestamptz),
        ('active', true, '2026-10-17T12:00:00Z'::timestamptz),
        ('expired', true, '2026-10-15T12:00:00Z'::timestamptz),
        ('boundary', true, '2026-10-16T12:00:00Z'::timestamptz)
      ) as "user"(id, banned, ban_expires)
      where ${publicUserCondition(now)} order by id
    `);
      const rows = await client.unsafe(query.sql, query.params as string[]);
      expect(rows.map((row) => row.id)).toEqual(['boundary', 'expired', 'normal']);
    } finally {
      await client.end();
    }
  },
);
