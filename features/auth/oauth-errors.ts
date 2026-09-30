/**
 * Better Auth sends a failed social sign-in back as `?error=<code>`. The codes a person
 * can do something about get their own message; the rest (expired state, provider
 * outage) share the generic one.
 */
const OAUTH_ERROR_KEYS = {
  email_not_found: 'emailMissing',
  account_not_linked: 'accountExists',
  access_denied: 'cancelled',
} as const;

export type OAuthErrorKey = (typeof OAUTH_ERROR_KEYS)[keyof typeof OAUTH_ERROR_KEYS] | 'generic';

export function oauthErrorKey(code: string): OAuthErrorKey {
  return OAUTH_ERROR_KEYS[code as keyof typeof OAUTH_ERROR_KEYS] ?? 'generic';
}
