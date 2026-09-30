import 'server-only';

import { z } from 'zod';

const optional = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  /** Pool size per server instance. Lower it (e.g. 1) behind a pooler on serverless hosts. */
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  /** Resend API key. Without it, emails are printed to the server log (development only). */
  RESEND_API_KEY: optional,
  /** Verified sender, e.g. `Stay.bg <noreply@stay.bg>`. */
  EMAIL_FROM: optional,
  /** Vercel Blob read/write token for photo uploads (read by `@vercel/blob` itself). */
  BLOB_READ_WRITE_TOKEN: optional,
  /** OAuth client for "Continue with Google". Both halves, or the button stays hidden. */
  GOOGLE_CLIENT_ID: optional,
  GOOGLE_CLIENT_SECRET: optional,
  /** Meta app for "Continue with Facebook". Both halves, or the button stays hidden. */
  FACEBOOK_CLIENT_ID: optional,
  FACEBOOK_CLIENT_SECRET: optional,
});

export const serverEnv = serverEnvSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_POOL_MAX: process.env.DATABASE_POOL_MAX,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID,
  FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET,
});
