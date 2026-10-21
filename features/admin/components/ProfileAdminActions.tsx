import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { user } from '@/db/schema';
import { isAdmin } from '@/lib/roles';
import { getServerUser } from '@/lib/server/session';
import { BanUserForm } from './BanUserForm';
import { UnbanUserButton } from './UnbanUserButton';

export async function ProfileAdminActions({ userId }: { userId: string }) {
  if (!isAdmin(await getServerUser())) return null;
  const [target] = await db
    .select({ id: user.id, name: user.name, role: user.role, banned: user.banned })
    .from(user)
    .where(eq(user.id, userId));
  if (!target || isAdmin(target)) return null;
  return (
    <section
      className="mb-4 rounded-xl border border-red-200 bg-white p-4"
      aria-label="Admin controls"
    >
      <h2 className="mb-2 font-semibold">Admin controls</h2>
      {target.banned ? (
        <UnbanUserButton userId={target.id} />
      ) : (
        <BanUserForm userId={target.id} userName={target.name} defaultReason="" />
      )}
    </section>
  );
}
