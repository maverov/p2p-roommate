import { desc, eq, ilike } from 'drizzle-orm';
import Link from 'next/link';
import { db } from '@/db';
import { listings, user } from '@/db/schema';
import { ArchiveListingButton } from '@/features/admin/components/ArchiveListingButton';
import { RestoreListingButton } from '@/features/admin/components/RestoreListingButton';
import { requireAdminUser } from '@/lib/server/admin';
import { routes } from '@/lib/routes';

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  await requireAdminUser();
  const q = (searchParams.q ?? '').trim().slice(0, 100);
  const page = Math.floor(Math.max(1, Math.min(10000, Number(searchParams.page) || 1)));
  const rows = await db
    .select({ id: listings.id, title: listings.title, status: listings.status, owner: user.email })
    .from(listings)
    .innerJoin(user, eq(listings.ownerId, user.id))
    .where(q ? ilike(listings.title, `%${q}%`) : undefined)
    .orderBy(desc(listings.createdAt), listings.id)
    .limit(51)
    .offset((Math.floor(page) - 1) * 50);
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Listings</h1>
      <form className="flex gap-2">
        <input
          aria-label="Search listings by title"
          className="rounded border p-2"
          name="q"
          defaultValue={q}
        />
        <button type="submit">Search</button>
      </form>
      <p>
        Removal archives a listing. Restore returns it to paused so the owner can review and
        republish it.
      </p>
      {rows.slice(0, 50).map((row) => (
        <section key={row.id} className="space-y-2 rounded-xl border bg-white p-4">
          <h2 className="font-semibold">{row.title}</h2>
          <p>
            {row.owner} · {row.status}
          </p>
          {row.status === 'PUBLISHED' && (
            <Link className="underline" href={routes.listing('bg', row.id)}>
              View listing
            </Link>
          )}
          {row.status === 'ARCHIVED' ? (
            <RestoreListingButton listingId={row.id} />
          ) : (
            <ArchiveListingButton listingId={row.id} />
          )}
        </section>
      ))}
      {rows.length === 0 && <p>No listings found.</p>}
      <nav className="flex gap-4" aria-label="Pagination">
        {page > 1 && (
          <Link href={routes.adminListings(`q=${encodeURIComponent(q)}&page=${page - 1}`)}>
            Previous
          </Link>
        )}
        {rows.length > 50 && (
          <Link href={routes.adminListings(`q=${encodeURIComponent(q)}&page=${page + 1}`)}>
            Next
          </Link>
        )}
      </nav>
    </div>
  );
}
