import { inferAdditionalFields } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  // Mirrors `user.additionalFields` in `lib/auth.ts` without importing the server config.
  plugins: [inferAdditionalFields({ user: { locale: { type: 'string', required: false } } })],
});

export const { signIn, signUp, signOut, useSession } = authClient;
