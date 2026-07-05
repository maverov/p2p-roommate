import { useMutation } from '@tanstack/react-query';

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

export const useUser = () => {
  const session = useSession();

  return {
    ...session,
    user: session.data?.user ?? null,
  };
};
