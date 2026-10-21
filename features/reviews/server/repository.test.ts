import { sql } from 'drizzle-orm';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const store = vi.hoisted(() => ({ db: null as unknown as PostgresJsDatabase }));
vi.mock('@/db', () => ({
  get db() {
    return store.db;
  },
}));
vi.mock('@/lib/server/api', () => ({
  ApiError: class extends Error {
    constructor(
      public status: number,
      public code: string,
      message: string,
    ) {
      super(message);
    }
  },
}));

import { canReview, createReview, hasMessageExchange } from './repository';

const client = process.env.TEST_DATABASE_URL
  ? postgres(process.env.TEST_DATABASE_URL, { max: 1, connect_timeout: 5 })
  : null;
afterAll(async () => {
  await client?.end();
});

// Temporary tables shadow the application's tables for this connection only.
// All fixtures disappear at commit; existing accounts/messages/reviews are untouched.
async function fixtures(run: (tx: PostgresJsDatabase) => Promise<void>) {
  await drizzle(client!).transaction(async (tx) => {
    for (const table of [
      'user',
      'listing',
      'conversation',
      'conversation_participant',
      'message',
      'review',
      'user_block',
    ]) {
      await tx.execute(
        sql.raw(
          `create temporary table "${table}" (like public."${table}" including all) on commit drop`,
        ),
      );
    }
    store.db = tx;
    await tx.execute(sql`insert into "user" (id, name, email) values
      ('owner', 'Owner', 'owner@test.invalid'), ('tenant', 'Tenant', 'tenant@test.invalid'),
      ('stranger', 'Stranger', 'stranger@test.invalid')`);
    await tx.execute(sql`insert into listing (id, owner_id, title, description, status, property_type, city_slug,
      monthly_rent_cents, bedroom_count, bathroom_count, max_occupants)
      values ('room', 'owner', 'Room', 'A room', 'PUBLISHED', 'ROOM', 'sofia', 50000, 1, 1, 1),
      ('other-room', 'owner', 'Other', 'Another room', 'PUBLISHED', 'ROOM', 'sofia', 60000, 1, 1, 1)`);
    await tx.execute(
      sql`insert into conversation (id, listing_id) values ('thread', 'room'), ('direct', null)`,
    );
    await tx.execute(sql`insert into conversation_participant (conversation_id, user_id) values
      ('thread', 'tenant'), ('thread', 'owner'), ('direct', 'tenant'), ('direct', 'owner')`);
    await run(tx);
  });
}
async function exchange(tx: PostgresJsDatabase, thread = 'thread') {
  await tx.execute(sql`insert into message (id, conversation_id, sender_id, body) values
    ('hello', ${thread}, 'tenant', 'Hello'), ('reply', ${thread}, 'owner', 'Hello back')`);
}
const listingTarget = { targetType: 'LISTING' as const, listingId: 'room' };
const personTarget = { targetType: 'USER' as const, targetUserId: 'owner' };

describe.skipIf(!client)('message-based reviews (PostgreSQL)', () => {
  it('rejects no messages and a one-sided enquiry', async () =>
    fixtures(async (tx) => {
      expect(await canReview('tenant', listingTarget)).toBe(false);
      await tx.execute(
        sql`insert into message (id, conversation_id, sender_id, body) values ('hello', 'thread', 'tenant', 'Hello')`,
      );
      expect(await canReview('tenant', personTarget)).toBe(false);
      await expect(
        createReview('tenant', { ...listingTarget, rating: 5, body: 'Great' }),
      ).rejects.toMatchObject({ status: 403, code: 'REVIEW_NOT_ALLOWED' });
    }));

  it('creates listing and person reviews after an exchange and hides used prompts', async () =>
    fixtures(async (tx) => {
      await exchange(tx);
      for (const target of [listingTarget, personTarget]) {
        expect(await canReview('tenant', target)).toBe(true);
        const review = await createReview('tenant', {
          ...target,
          rating: 5,
          body: 'Helpful and responsive',
        });
        expect(review).toMatchObject({ reviewerRole: 'MEMBER', rating: 5, reviewerId: 'tenant' });
        expect(await canReview('tenant', target)).toBe(false);
        await expect(
          createReview('tenant', { ...target, rating: 4, body: 'Again' }),
        ).rejects.toMatchObject({ code: 'REVIEW_ALREADY_EXISTS' });
      }
      expect(await canReview('owner', { targetType: 'USER', targetUserId: 'tenant' })).toBe(true);
    }));

  it('requires the correct listing and prevents a nonparticipant from reviewing', async () =>
    fixtures(async (tx) => {
      await exchange(tx);
      expect(await hasMessageExchange('tenant', 'owner', 'other-room')).toBe(false);
      expect(await canReview('tenant', { targetType: 'LISTING', listingId: 'other-room' })).toBe(
        false,
      );
      expect(await canReview('stranger', personTarget)).toBe(false);
    }));

  it('allows direct-chat profile reviews but not unrelated listing reviews', async () =>
    fixtures(async (tx) => {
      await exchange(tx, 'direct');
      expect(await canReview('tenant', personTarget)).toBe(true);
      expect(await canReview('tenant', listingTarget)).toBe(false);
    }));

  it('does not combine one-way messages from separate conversations', async () =>
    fixtures(async (tx) => {
      await tx.execute(sql`insert into message (id, conversation_id, sender_id, body) values
      ('one', 'thread', 'tenant', 'Hello'), ('two', 'direct', 'owner', 'Hello')`);
      expect(await hasMessageExchange('tenant', 'owner')).toBe(false);
    }));

  it('rejects self-reviews, own listings, and blocks in either direction', async () =>
    fixtures(async (tx) => {
      await exchange(tx);
      for (const target of [listingTarget, personTarget]) {
        await expect(
          createReview('owner', { ...target, rating: 5, body: 'Mine' }),
        ).rejects.toMatchObject({ code: 'CANNOT_REVIEW_SELF' });
      }
      for (const [from, to] of [
        ['owner', 'tenant'],
        ['tenant', 'owner'],
      ]) {
        await tx.execute(
          sql`insert into user_block (blocker_id, blocked_id) values (${from}, ${to})`,
        );
        expect(await canReview('tenant', personTarget)).toBe(false);
        await tx.execute(sql`delete from user_block`);
      }
    }));

  it('rejects missing, banned or unpublished targets without deleting existing reviews', async () =>
    fixtures(async (tx) => {
      await exchange(tx);
      await createReview('tenant', { ...personTarget, rating: 5, body: 'Helpful' });
      await tx.execute(sql`update "user" set banned = true where id = 'owner'`);
      expect(await canReview('tenant', personTarget)).toBe(false);
      expect(await canReview('tenant', listingTarget)).toBe(false);
      expect(await canReview('tenant', { targetType: 'USER', targetUserId: 'missing' })).toBe(
        false,
      );
      await tx.execute(sql`update "user" set banned = false where id = 'owner'`);
      await tx.execute(sql`update listing set status = 'PAUSED' where id = 'room'`);
      expect(await canReview('tenant', listingTarget)).toBe(false);
      const [row] = await tx.execute(sql`select count(*)::int as count from review`);
      expect(row.count).toBe(1);
    }));
});
