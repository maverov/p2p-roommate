import { redirect } from 'next/navigation';

import { AuthCard, LoginForm } from '@/features/auth';
import { routes, sanitizeNextPath } from '@/lib/routes';
import { getServerUser } from '@/lib/server/session';

type LoginPageProps = {
  searchParams: {
    next?: string;
  };
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const nextPath = sanitizeNextPath(searchParams.next);
  const user = await getServerUser();

  if (user) {
    redirect(nextPath ?? '/');
  }

  return (
    <AuthCard
      eyebrow="Welcome back"
      footerHref={routes.signup(nextPath ?? undefined)}
      footerLabel="Create one"
      footerText="No account yet?"
      title="Sign in to Stay.bg"
    >
      <LoginForm nextPath={nextPath} />
    </AuthCard>
  );
}
