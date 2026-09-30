import 'server-only';

import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { account } from '@/db/schema';
import { isSocialProvider, type SocialProvider } from '@/lib/auth-rules';

export type SignInMethods = { hasPassword: boolean; socialProviders: SocialProvider[] };

/** How the user can prove it is them: a password, and/or linked Google or Facebook. */
export async function getSignInMethods(userId: string): Promise<SignInMethods> {
  const rows = await db
    .select({ providerId: account.providerId })
    .from(account)
    .where(eq(account.userId, userId));
  const providers = rows.map((row) => row.providerId);

  return {
    hasPassword: providers.includes('credential'),
    socialProviders: providers.filter(isSocialProvider),
  };
}
