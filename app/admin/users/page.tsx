import { desc, ilike, or } from 'drizzle-orm';
import Link from 'next/link';
import { db } from '@/db';
import { user } from '@/db/schema';
import { BanUserForm } from '@/features/admin/components/BanUserForm';
import { UnbanUserButton } from '@/features/admin/components/UnbanUserButton';
import { requireAdminUser } from '@/lib/server/admin';
import { isAdmin } from '@/lib/roles';
import { routes } from '@/lib/routes';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  await requireAdminUser();
  const q = (searchParams.q ?? '').trim().slice(0, 100);
  const page = Math.floor(Math.max(1, Math.min(10000, Number(searchParams.page) || 1)));
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      banned: user.banned,
      banReason: user.banReason,
    })
    .from(user)
    .where(q ? or(ilike(user.name, `%${q}%`), ilike(user.email, `%${q}%`)) : undefined)
    .orderBy(desc(user.createdAt), user.id)
    .limit(51)
    .offset((Math.floor(page) - 1) * 50);
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Users</h1>
      <form className="flex gap-2">
        <input
          aria-label="Search users by name or email"
          className="rounded border p-2"
          name="q"
          defaultValue={q}
        />
        <button type="submit">Search</button>
      </form>
      <p>
        Unbanning restores access. Listings paused by a ban remain paused until the owner
        republishes them.
      </p>
      {rows.slice(0, 50).map((row) => (
        <section key={row.id} className="space-y-2 rounded-xl border bg-white p-4">
          <Link className="font-semibold underline" href={routes.profile('bg', row.id)}>
            {row.name}
          </Link>
          <p>
            {row.email} · {row.role ?? 'user'} · {row.banned ? 'Banned' : 'Active'}
          </p>
          {row.banReason && <p>{row.banReason}</p>}
          {!isAdmin(row) &&
            (row.banned ? (
              <UnbanUserButton userId={row.id} />
            ) : (
              <BanUserForm userId={row.id} userName={row.name} defaultReason="" />
            ))}
        </section>
      ))}
      {rows.length === 0 && <p>No users found.</p>}
      <nav className="flex gap-4" aria-label="Pagination">
        {page > 1 && (
          <Link href={routes.adminUsers(`q=${encodeURIComponent(q)}&page=${page - 1}`)}>
            Previous
          </Link>
        )}
        {rows.length > 50 && (
          <Link href={routes.adminUsers(`q=${encodeURIComponent(q)}&page=${page + 1}`)}>Next</Link>
        )}
      </nav>
    </div>
  );
}
