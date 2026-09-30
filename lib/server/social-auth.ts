import 'server-only';

import { SOCIAL_PROVIDERS, type SocialProvider } from '@/lib/auth-rules';
import { serverEnv } from '@/lib/server/env';

const credentials: Record<SocialProvider, { clientId?: string; clientSecret?: string }> = {
  google: { clientId: serverEnv.GOOGLE_CLIENT_ID, clientSecret: serverEnv.GOOGLE_CLIENT_SECRET },
  facebook: {
    clientId: serverEnv.FACEBOOK_CLIENT_ID,
    clientSecret: serverEnv.FACEBOOK_CLIENT_SECRET,
  },
};

/**
 * Providers with both keys set. The auth config registers exactly these and the sign-in
 * pages render exactly these buttons, so a half-configured provider never shows up.
 */
export const enabledSocialProviders: SocialProvider[] = SOCIAL_PROVIDERS.filter(
  (provider) => credentials[provider].clientId && credentials[provider].clientSecret,
);

export function socialProviderCredentials(provider: SocialProvider) {
  const { clientId, clientSecret } = credentials[provider];

  return { clientId: clientId!, clientSecret: clientSecret! };
}
