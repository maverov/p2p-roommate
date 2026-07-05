import { AuthCard, SignupForm } from '@/features/auth';

export default function SignupPage() {
  return (
    <AuthCard
      eyebrow="Get started"
      footerHref="/login"
      footerLabel="Sign in"
      footerText="Already have an account?"
      title="Create your Stay.bg account"
    >
      <SignupForm />
    </AuthCard>
  );
}
