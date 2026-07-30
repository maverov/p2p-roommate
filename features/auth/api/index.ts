'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { authClient, useSession } from '@/lib/auth-client';

import type { LoginInput, SignupInput } from '../schemas';

type AuthClientResponse<TData> = {
  data: TData | null;
  error: { message?: string } | null;
};

function unwrapAuthResponse<TData>(response: AuthClientResponse<TData>) {
  if (response.error) {
    throw new Error(response.error.message ?? 'Authentication failed');
  }

  return response.data;
}

export const useLogin = () => {
  return useMutation({
    mutationFn: async (credentials: LoginInput) => {
      const response = await authClient.signIn.email(credentials);

      return unwrapAuthResponse(response);
    },
  });
};

export const useSignup = () => {
  return useMutation({
    mutationFn: async (data: SignupInput) => {
      const response = await authClient.signUp.email(data);

      return unwrapAuthResponse(response);
    },
  });
};

export const useSignOut = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await authClient.signOut();

      return unwrapAuthResponse(response);
    },
    onSuccess: () => {
      // Drop every cached response so the next user of this browser cannot read
      // the previous session's listings, messages or favourites.
      queryClient.clear();
      router.refresh();
    },
  });
};

export const useUser = () => {
  const session = useSession();

  return {
    ...session,
    user: session.data?.user ?? null,
  };
};
