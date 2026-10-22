import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = vi.hoisted(() => ({
  data: {} as Record<string, Record<string, unknown>[]>,
  verificationEmail: vi.fn(),
  passwordEmail: vi.fn(),
}));
vi.mock('@/db', () => ({ db: {} }));
vi.mock('@better-auth/drizzle-adapter', async () => {
  const { memoryAdapter } = await import('better-auth/adapters/memory');
  return { drizzleAdapter: () => memoryAdapter(store.data) };
});
vi.mock('better-auth/next-js', () => ({ nextCookies: () => ({ id: 'test-cookie-adapter' }) }));
vi.mock('@/lib/server/env', () => ({
  serverEnv: {
    BETTER_AUTH_URL: 'http://localhost:3000',
    BETTER_AUTH_SECRET: 'test-only-secret-at-least-32-characters',
  },
}));
vi.mock('@/lib/server/social-auth', () => ({
  enabledSocialProviders: [],
  socialProviderCredentials: vi.fn(),
}));
vi.mock('@/features/uploads/server/blob', () => ({
  deleteUserUploads: vi.fn(),
  listUserUploads: vi.fn(),
}));
vi.mock('@/features/notifications/server/notify', () => ({
  sendPasswordResetEmail: store.passwordEmail,
  sendVerificationEmail: store.verificationEmail,
}));

import { auth } from './auth';

const account = {
  name: 'Test user',
  email: 'signup@example.test',
  password: 'Testing-passphrase-42',
  locale: 'bg',
};
const request = (path: string, body: unknown) =>
  new Request(`http://localhost:3000/api/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000' },
    body: JSON.stringify(body),
  });
beforeEach(() => {
  for (const model of ['user', 'session', 'account', 'verification', 'rateLimit'])
    store.data[model] = [];
  for (const key of Object.keys(store.data)) store.data[key] = [];
  vi.clearAllMocks();
});

describe('sign-up without email confirmation', () => {
  it('creates an unverified ordinary account and a working session without sending email', async () => {
    const response = await auth.handler(request('sign-up/email', account));
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.token).toBeTruthy();
    expect(result.user.emailVerified).toBe(false);
    expect(result.user.role).toBe('user');
    expect(response.headers.get('set-cookie')).toContain('session_token');
    expect(store.verificationEmail).not.toHaveBeenCalled();
    expect(store.passwordEmail).not.toHaveBeenCalled();
    const session = await auth.api.getSession({
      headers: new Headers({
        cookie: `better-auth.session_token=${response.headers.get('set-cookie')?.match(/better-auth\.session_token=([^;]+)/)?.[1]}`,
      }),
    });
    expect(session?.user.email).toBe(account.email);
  });
  it('allows the unverified account to sign in again and rejects duplicate registration', async () => {
    await auth.handler(request('sign-up/email', account));
    for (const email of [account.email, account.email.toUpperCase()]) {
      const duplicate = await auth.handler(
        request('sign-up/email', { ...account, email, password: 'Another-passphrase-42' }),
      );
      expect(duplicate.status).toBe(422);
      expect((await duplicate.json()).code).toBe('USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL');
    }
    expect(store.data.user).toHaveLength(1);
    const response = await auth.handler(
      request('sign-in/email', { email: account.email, password: account.password }),
    );
    expect(response.status).toBe(200);
    expect((await response.json()).token).toBeTruthy();
    expect(store.verificationEmail).not.toHaveBeenCalled();
  });
});
