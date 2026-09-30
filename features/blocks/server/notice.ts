import 'server-only';

import { getTranslations } from 'next-intl/server';

import type { Locale } from '@/lib/i18n';

import { isBlocked, type BlockState } from './repository';

/**
 * What to show in place of a contact form, or `null` when contact is open. The person
 * who was blocked sees the same wording as for any unavailable contact.
 */
export async function blockNotice(
  state: BlockState | null,
  name: string,
  locale: Locale,
): Promise<string | null> {
  if (!state || !isBlocked(state)) return null;

  const t = await getTranslations({ locale, namespace: 'common' });

  return state.blockedByViewer ? t('block.blockedByYou', { name }) : t('block.unavailable');
}
