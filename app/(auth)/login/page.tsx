import { AuthCard, LoginForm } from '@/features/auth';

export default function LoginPage() {
  return (
    <AuthCard
      eyebrow="Welcome back"
      footerHref="/signup"
      footerLabel="Create one"
      footerText="No account yet?"
      title="Sign in to Stay.bg"
    >
      <LoginForm />
    </AuthCard>
  );
}
