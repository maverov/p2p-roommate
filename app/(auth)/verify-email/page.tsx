import { redirect } from 'next/navigation';

import { routes, sanitizeNextPath } from '@/lib/routes';

/** Keep old bookmarks usable without claiming that an email was verified. */
export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  redirect(routes.login(sanitizeNextPath(searchParams.next) ?? undefined));
}
