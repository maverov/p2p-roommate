import { describe, expect, it } from 'vitest';

import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@/lib/auth-rules';

import {
  createLoginSchema,
  createResetPasswordSchema,
  createSignupSchema,
  type ValidationTranslator,
} from '.';

// Echoes the key, so each assertion pins which message a rule produces.
const t: ValidationTranslator = (key) => key;

type ParseResult = { success: boolean; error?: { issues: Array<{ message: string }> } };

const messages = (result: ParseResult) => result.error?.issues.map((issue) => issue.message) ?? [];

describe('signup schema', () => {
  const schema = createSignupSchema(t);
  const valid = {
    name: 'Ana',
    email: 'ana@example.com',
    password: 'x'.repeat(PASSWORD_MIN_LENGTH),
  };

  it('accepts a valid signup and trims the email', () => {
    expect(schema.parse({ ...valid, email: '  ana@example.com ' }).email).toBe('ana@example.com');
  });

  it('enforces the shared password length rules', () => {
    const tooShort = 'x'.repeat(PASSWORD_MIN_LENGTH - 1);
    const tooLong = 'x'.repeat(PASSWORD_MAX_LENGTH + 1);

    expect(messages(schema.safeParse({ ...valid, password: tooShort }))).toEqual([
      'validation.passwordTooShort',
    ]);
    expect(messages(schema.safeParse({ ...valid, password: tooLong }))).toEqual([
      'validation.passwordTooLong',
    ]);
  });

  it('rejects a malformed email', () => {
    expect(messages(schema.safeParse({ ...valid, email: 'ana@' }))).toEqual([
      'validation.emailInvalid',
    ]);
  });
});

describe('login schema', () => {
  it('applies no length rule, so it does not reveal the password policy', () => {
    const result = createLoginSchema(t).safeParse({ email: 'ana@example.com', password: 'x' });

    expect(result.success).toBe(true);
  });
});

describe('reset password schema', () => {
  it('reports a mismatch on the confirmation field', () => {
    const password = 'x'.repeat(PASSWORD_MIN_LENGTH);
    const result = createResetPasswordSchema(t).safeParse({
      password,
      confirmPassword: `${password}y`,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({
      path: ['confirmPassword'],
      message: 'validation.passwordsDoNotMatch',
    });
  });
});
