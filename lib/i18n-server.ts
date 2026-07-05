import 'server-only';
import type { Locale } from '@/lib/i18n';

interface MessageTree {
  [key: string]: string | MessageTree;
}

function resolvePath(messages: MessageTree, path: string): string | undefined {
  const segments = path.split('.');
  let current: string | MessageTree | undefined = messages;

  for (const segment of segments) {
    if (!current || typeof current === 'string') {
      return undefined;
    }
    current = current[segment];
  }

  return typeof current === 'string' ? current : undefined;
}

export async function getTranslations(locale: Locale) {
  const messages = (await import(`../locales/${locale}.json`)).default as MessageTree;

  return (key: string) => {
    const value = resolvePath(messages, key);
    return value ?? key;
  };
}
