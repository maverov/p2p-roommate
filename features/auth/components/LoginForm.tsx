'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

import { useLogin } from '@/features/auth/api';
import { loginSchema, type LoginInput } from '@/features/auth/schemas';

export function LoginForm() {
  const router = useRouter();
  const login = useLogin();
  const form = useForm<LoginInput>({
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = form.handleSubmit((values) => {
    login.mutate(values, {
      onSuccess: () => {
        router.push('/');
        router.refresh();
      },
    });
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="text-sm font-medium text-brand-ink" htmlFor="email">
          Email
        </label>
        <input
          autoComplete="email"
          className="mt-1 w-full rounded-md border border-brand-border bg-white px-3 py-2 text-brand-ink outline-none transition focus:border-brand-terracotta"
          id="email"
          type="email"
          {...form.register('email')}
        />
        {form.formState.errors.email && (
          <p className="mt-1 text-sm text-brand-terracotta">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-brand-ink" htmlFor="password">
          Password
        </label>
        <input
          autoComplete="current-password"
          className="mt-1 w-full rounded-md border border-brand-border bg-white px-3 py-2 text-brand-ink outline-none transition focus:border-brand-terracotta"
          id="password"
          type="password"
          {...form.register('password')}
        />
        {form.formState.errors.password && (
          <p className="mt-1 text-sm text-brand-terracotta">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      {login.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
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
