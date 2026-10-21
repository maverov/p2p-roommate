import postgres from 'postgres';
import { expect, it } from 'vitest';

it.skipIf(!process.env.TEST_DATABASE_URL)(
  'database permits only the designated sole admin, including mixed roles and case variants',
  async () => {
    const client = postgres(process.env.TEST_DATABASE_URL!, { max: 1 });
    try {
      // Copies the migrated constraints and indexes, but never touches real accounts.
      await client`CREATE TEMP TABLE admin_constraint_test (LIKE "user" INCLUDING ALL)`;
      await client`INSERT INTO admin_constraint_test (id, name, email, role) VALUES ('owner', 'admin', 'maverov@gmail.com', 'admin')`;
      await expect(
        client`INSERT INTO admin_constraint_test (id, name, email, role) VALUES ('other', 'Other', 'other@example.com', 'admin')`,
      ).rejects.toMatchObject({ code: '23514' });
      await expect(
        client`INSERT INTO admin_constraint_test (id, name, email, role) VALUES ('mixed', 'Other', 'mixed@example.com', 'user,admin')`,
      ).rejects.toMatchObject({ code: '23514' });
      await expect(
        client`INSERT INTO admin_constraint_test (id, name, email, role) VALUES ('duplicate', 'admin', 'MAVEROV@gmail.com', 'admin')`,
      ).rejects.toMatchObject({ code: '23505' });
      await expect(
        client`UPDATE admin_constraint_test SET email = 'other@example.com' WHERE id = 'owner'`,
      ).rejects.toMatchObject({ code: '23514' });
      await client`INSERT INTO admin_constraint_test (id, name, email, role) VALUES ('normal', 'User', 'normal@example.com', 'user')`;
    } finally {
      await client.end();
    }
  },
);
