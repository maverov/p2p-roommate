'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

import { useSignup } from '@/features/auth/api';
import { signupSchema, type SignupInput } from '@/features/auth/schemas';

type SignupFormProps = {
  /** Already sanitised by the page; where to land after a successful sign-up. */
  nextPath?: Route | null;
};

const FIELD_CLASSES =
  'mt-1 w-full rounded-md border border-brand-border bg-white px-3 py-2 text-brand-ink outline-none transition focus:border-brand-terracotta aria-[invalid=true]:border-brand-terracotta';

export function SignupForm({ nextPath }: SignupFormProps) {
  const router = useRouter();
  const signup = useSignup();
  const form = useForm<SignupInput>({
    defaultValues: {
      email: '',
      name: '',
      password: '',
    },
    resolver: zodResolver(signupSchema),
  });

  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    signup.mutate(values, {
      onSuccess: () => {
        router.replace(nextPath ?? '/');
        router.refresh();
      },
    });
  });

  return (
    <form className="space-y-4" noValidate onSubmit={onSubmit}>
      <div>
        <label className="text-sm font-medium text-brand-ink" htmlFor="name">
          Name
        </label>
        <input
          aria-describedby={errors.name ? 'signup-name-error' : undefined}
          aria-invalid={Boolean(errors.name)}
          autoComplete="name"
          className={FIELD_CLASSES}
          id="name"
          type="text"
          {...form.register('name')}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-brand-terracotta" id="signup-name-error">
            {errors.name.message}
          </p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-brand-ink" htmlFor="email">
          Email
        </label>
        <input
          aria-describedby={errors.email ? 'signup-email-error' : undefined}
          aria-invalid={Boolean(errors.email)}
          autoComplete="email"
          className={FIELD_CLASSES}
          id="email"
          type="email"
          {...form.register('email')}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-brand-terracotta" id="signup-email-error">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-brand-ink" htmlFor="password">
          Password
        </label>
        <input
          aria-describedby={errors.password ? 'signup-password-error' : undefined}
          aria-invalid={Boolean(errors.password)}
          autoComplete="new-password"
          className={FIELD_CLASSES}
          id="password"
          type="password"
          {...form.register('password')}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-brand-terracotta" id="signup-password-error">
            {errors.password.message}
          </p>
        )}
      </div>

      {signup.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {signup.error.message}
        </p>
      )}

      <button
        className="w-full rounded-md bg-brand-terracotta px-4 py-2.5 font-semibold text-white transition hover:bg-brand-terracotta-hover disabled:cursor-not-allowed disabled:opacity-60"
        disabled={signup.isPending}
        type="submit"
      >
        {signup.isPending ? 'Creating account...' : 'Create account'}
      </button>
    </form>
  );
}
