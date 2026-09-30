/**
 * Credential rules shared by the Better Auth server config (`lib/auth.ts`) and the
 * sign-up / reset forms, so the form can never accept a password the server rejects.
 */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const NAME_MIN_LENGTH = 2;

/** Social sign-in providers the app knows. Each is on only when its keys are set. */
export const SOCIAL_PROVIDERS = ['google', 'facebook'] as const;
export type SocialProvider = (typeof SOCIAL_PROVIDERS)[number];

export function isSocialProvider(value: unknown): value is SocialProvider {
  return SOCIAL_PROVIDERS.includes(value as SocialProvider);
}

/** Brand names, which are not translated. */
export const SOCIAL_PROVIDER_NAMES: Record<SocialProvider, string> = {
  google: 'Google',
  facebook: 'Facebook',
};
