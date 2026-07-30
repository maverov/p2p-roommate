/**
 * Shape of the better-auth user as it reaches the UI. Declared explicitly
 * rather than inferred from `lib/auth.ts` so client components never pull a
 * `server-only` module into their import graph.
 */
export type SessionUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
};

export type AuthSession = {
  user: SessionUser;
  expiresAt: Date;
};
