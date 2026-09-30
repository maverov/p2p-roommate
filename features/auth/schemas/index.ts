import { z } from 'zod';

import { NAME_MIN_LENGTH, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@/lib/auth-rules';

type ValidationKey =
  | 'validation.required'
  | 'validation.emailInvalid'
  | 'validation.passwordTooShort'
  | 'validation.passwordTooLong'
  | 'validation.nameTooShort'
  | 'validation.passwordsDoNotMatch';

/** The `auth` namespace translator, narrowed to what the schemas need. */
export type ValidationTranslator = (
  key: ValidationKey,
  values?: Record<string, string | number>,
) => string;

/**
 * Schemas are built per render from the active translator, so validation messages come
 * from the catalogue like every other string, and the length rules come from
 * `lib/auth-rules` — the same constants the Better Auth server config enforces.
 */
const email = (t: ValidationTranslator) =>
  z.string().trim().min(1, t('validation.required')).email(t('validation.emailInvalid'));

const newPassword = (t: ValidationTranslator) =>
  z
    .string()
    .min(PASSWORD_MIN_LENGTH, t('validation.passwordTooShort', { min: PASSWORD_MIN_LENGTH }))
    .max(PASSWORD_MAX_LENGTH, t('validation.passwordTooLong', { max: PASSWORD_MAX_LENGTH }));

export const createLoginSchema = (t: ValidationTranslator) =>
  z.object({
    email: email(t),
    // No length rule at sign-in: it would only reveal the policy to a guesser.
    password: z.string().min(1, t('validation.required')),
  });

export const createSignupSchema = (t: ValidationTranslator) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(NAME_MIN_LENGTH, t('validation.nameTooShort', { min: NAME_MIN_LENGTH })),
    email: email(t),
    password: newPassword(t),
  });

export const createForgotPasswordSchema = (t: ValidationTranslator) =>
  z.object({ email: email(t) });

export const createResetPasswordSchema = (t: ValidationTranslator) =>
  z
    .object({ password: newPassword(t), confirmPassword: z.string() })
    .refine((values) => values.password === values.confirmPassword, {
      message: t('validation.passwordsDoNotMatch'),
      path: ['confirmPassword'],
    });

export type LoginInput = z.infer<ReturnType<typeof createLoginSchema>>;
export type SignupInput = z.infer<ReturnType<typeof createSignupSchema>>;
export type ForgotPasswordInput = z.infer<ReturnType<typeof createForgotPasswordSchema>>;
export type ResetPasswordInput = z.infer<ReturnType<typeof createResetPasswordSchema>>;
