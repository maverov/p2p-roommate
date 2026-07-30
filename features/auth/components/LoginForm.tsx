'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

import { useLogin } from '@/features/auth/api';
import { loginSchema, type LoginInput } from '@/features/auth/schemas';

type LoginFormProps = {
  /** Already sanitised by the page; where to land after a successful sign-in. */
  nextPath?: Route | null;
};

const FIELD_CLASSES =
  'mt-1 w-full rounded-md border border-brand-border bg-white px-3 py-2 text-brand-ink outline-none transition focus:border-brand-terracotta aria-[invalid=true]:border-brand-terracotta';

export function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const login = useLogin();
  const form = useForm<LoginInput>({
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: zodResolver(loginSchema),
  });

  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    login.mutate(values, {
      onSuccess: () => {
        // `replace` keeps the login screen out of the back-stack; `refresh`
        // re-renders server components (navbar, guards) with the new session.
        router.replace(nextPath ?? '/');
        router.refresh();
      },
    });
  });

  return (
    <form className="space-y-4" noValidate onSubmit={onSubmit}>
      <div>
        <label className="text-sm font-medium text-brand-ink" htmlFor="email">
          Email
        </label>
        <input
          aria-describedby={errors.email ? 'login-email-error' : undefined}
          aria-invalid={Boolean(errors.email)}
          autoComplete="email"
          className={FIELD_CLASSES}
          id="email"
          type="email"
          {...form.register('email')}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-brand-terracotta" id="login-email-error">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-brand-ink" htmlFor="password">
          Password
        </label>
        <input
          aria-describedby={errors.password ? 'login-password-error' : undefined}
          aria-invalid={Boolean(errors.password)}
          autoComplete="current-password"
          className={FIELD_CLASSES}
          id="password"
          type="password"
          {...form.register('password')}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-brand-terracotta" id="login-password-error">
            {errors.password.message}
          </p>
        )}
      </div>

      {login.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {login.error.message}
        </p>
      )}

      <button
        className="w-full rounded-md bg-brand-terracotta px-4 py-2.5 font-semibold text-white transition hover:bg-brand-terracotta-hover disabled:cursor-not-allowed disabled:opacity-60"
        disabled={login.isPending}
        type="submit"
      >
        {login.isPending ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}
