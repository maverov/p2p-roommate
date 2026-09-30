import 'server-only';

import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { waitUntil } from '@vercel/functions';
import { betterAuth } from 'better-auth';
import { getOAuthState } from 'better-auth/api';
import { nextCookies } from 'better-auth/next-js';
import { admin } from 'better-auth/plugins/admin';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import * as schema from '@/db/schema';
import { deleteUserUploads, listUserUploads } from '@/features/uploads/server/blob';
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from '@/features/notifications/server/notify';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@/lib/auth-rules';
import { defaultLocale, isLocale } from '@/lib/i18n';
import { runInBackground } from '@/lib/server/background';
import { serverEnv } from '@/lib/server/env';
import { enabledSocialProviders, socialProviderCredentials } from '@/lib/server/social-auth';

/**
 * Provider photos live on hosts the image allowlist rejects (`lib/images.ts`), and
 * `next/image` would throw on them, so social accounts start without one and people
 * upload their own.
 */
const withoutProviderPhoto = () => ({ image: undefined });

const socialProviders = Object.fromEntries(
  enabledSocialProviders.map((provider) => [
    provider,
    {
      ...socialProviderCredentials(provider),
      mapProfileToUser: withoutProviderPhoto,
      // Lets someone signed in to several Google accounts pick one.
      ...(provider === 'google' && { prompt: 'select_account' as const }),
    },
  ]),
);

/** Uploaded photo URLs of a user being deleted, collected before the rows cascade away. */
const pendingUploadCleanup = new Map<string, string[]>();

export const auth = betterAuth({
  appName: 'Stay.bg',
  baseURL: serverEnv.BETTER_AUTH_URL,
  secret: serverEnv.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: PASSWORD_MIN_LENGTH,
    maxPasswordLength: PASSWORD_MAX_LENGTH,
    // No session until the address is confirmed, so nobody can sign up as someone else.
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: ({ user, url }) => sendPasswordResetEmail(user, url),
  },
  emailVerification: {
    sendOnSignUp: true,
    // An unverified sign-in attempt re-sends the link instead of dead-ending.
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: 24 * 60 * 60,
    sendVerificationEmail: ({ user, url }) => sendVerificationEmail(user, url),
    afterEmailVerification: async (user) => {
      // The profile keeps its own copy for the public "email verified" badge.
      await db
        .update(schema.userProfiles)
        .set({ emailVerified: true, updatedAt: new Date() })
        .where(eq(schema.userProfiles.userId, user.id));
    },
  },
  socialProviders,
  account: {
    accountLinking: {
      enabled: true,
      /*
       * Google vouches for the address it returns, so a Google sign-in joins an existing
       * account with that email. Facebook gives no such guarantee: it never links
       * implicitly (`account_not_linked`), since that would hand an account to whoever
       * put the owner's address on a Facebook profile.
       */
      trustedProviders: ['google'],
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user, context) => {
          // Email sign-up sends `locale` itself; a social sign-up carries the page's
          // language through the OAuth round trip (`additionalData` in `SocialSignIn`).
          if (!context?.path.startsWith('/callback/')) return;

          const state = await getOAuthState();
          const locale = state?.locale;

          return isLocale(locale) ? { data: { ...user, locale } } : undefined;
        },
      },
    },
  },
  user: {
    additionalFields: {
      /** Language of the emails this user receives. Validated where it is read. */
      locale: { type: 'string', required: false, defaultValue: defaultLocale, input: true },
    },
    deleteUser: {
      enabled: true,
      beforeDelete: async (user) => {
        pendingUploadCleanup.set(user.id, await listUserUploads(user.id));
      },
      afterDelete: async (user) => {
        const urls = pendingUploadCleanup.get(user.id) ?? [];
        pendingUploadCleanup.delete(user.id);
        runInBackground(deleteUserUploads(urls), 'delete uploads of a deleted account');
      },
    },
  },
  // In memory (the default) every serverless instance would count separately.
  rateLimit: {
    storage: 'database',
    window: 60,
    max: 100,
  },
  advanced: {
    // Emails go out after the response, so a reset request answers in the same time
    // whether or not the account exists, and never waits on the email provider.
    backgroundTasks: { handler: (promise) => waitUntil(promise) },
  },
  // `nextCookies` must stay last so it can set cookies for every other plugin's responses.
  plugins: [admin(), nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
