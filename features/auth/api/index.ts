'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useRouterRefresh } from '@/hooks';
import { authClient, useSession } from '@/lib/auth-client';
import type { Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';

import type { LoginInput, SignupInput } from '../schemas';

type AuthClientResponse<TData> = {
  data: TData | null;
  error: { code?: string; message?: string; status?: number } | null;
};

/** Keeps Better Auth's error code and HTTP status so forms can pick a translated message. */
export class AuthRequestError extends Error {
  constructor(
    readonly code: string | undefined,
    readonly status: number | undefined,
  ) {
    super(code ?? 'AUTH_REQUEST_FAILED');
    this.name = 'AuthRequestError';
  }
}

function unwrapAuthResponse<TData>(response: AuthClientResponse<TData>) {
  if (response.error) {
    throw new AuthRequestError(response.error.code, response.error.status);
  }

  return response.data;
}

export type AuthErrorKey =
  | 'errors.invalidCredentials'
  | 'errors.emailNotVerified'
  | 'errors.tooManyRequests'
  | 'errors.generic';

export function authErrorKey(error: unknown): AuthErrorKey {
  if (!(error instanceof AuthRequestError)) {
    return 'errors.generic';
  }

  if (error.status === 429) return 'errors.tooManyRequests';
  if (error.code === 'EMAIL_NOT_VERIFIED') return 'errors.emailNotVerified';
  if (error.code === 'INVALID_EMAIL_OR_PASSWORD') return 'errors.invalidCredentials';

  return 'errors.generic';
}

export const useLogin = (nextPath?: string) => {
  return useMutation({
    mutationFn: async (credentials: LoginInput) => {
      const response = await authClient.signIn.email({
        ...credentials,
        // Where the re-sent verification link lands if the address is still unconfirmed.
        callbackURL: routes.verifyEmail(nextPath),
      });

      return unwrapAuthResponse(response);
    },
  });
};

export const useSignup = (locale: Locale, nextPath?: string) => {
  return useMutation({
    mutationFn: async (data: SignupInput) => {
      const response = await authClient.signUp.email({
        ...data,
        locale,
        callbackURL: routes.verifyEmail(nextPath),
      });

      return unwrapAuthResponse(response);
    },
  });
};

export const useRequestPasswordReset = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await authClient.requestPasswordReset({
        email,
        redirectTo: routes.resetPassword(),
      });

      return unwrapAuthResponse(response);
    },
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: async (input: { token: string; newPassword: string }) => {
      const response = await authClient.resetPassword(input);

      return unwrapAuthResponse(response);
    },
  });
};

export const useSignOut = () => {
  const { isRefreshing, refresh } = useRouterRefresh();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await authClient.signOut();

      return unwrapAuthResponse(response);
    },
    onSuccess: () => {
      // Drop every cached response so the next user of this browser cannot read
      // the previous session's listings, messages or favourites.
      queryClient.clear();
      refresh();
    },
  });

  // Busy until the signed-out navbar has actually rendered, not just until the request returns.
  return { ...mutation, isPending: mutation.isPending || isRefreshing };
};

export const useUser = () => {
  const session = useSession();

  return {
    ...session,
    user: session.data?.user ?? null,
  };
};
