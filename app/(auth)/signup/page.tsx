import { redirect } from 'next/navigation';

import { AuthCard, SignupForm } from '@/features/auth';
import { routes, sanitizeNextPath } from '@/lib/routes';
import { getServerUser } from '@/lib/server/session';

type SignupPageProps = {
  searchParams: {
    next?: string;
  };
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const nextPath = sanitizeNextPath(searchParams.next);
  const user = await getServerUser();

  if (user) {
    redirect(nextPath ?? '/');
  }

  return (
    <AuthCard
      eyebrow="Get started"
      footerHref={routes.login(nextPath ?? undefined)}
      footerLabel="Sign in"
      footerText="Already have an account?"
      title="Create your Stay.bg account"
    >
      <SignupForm nextPath={nextPath} />
    </AuthCard>
  );
}
