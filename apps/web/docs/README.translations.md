# Translations (i18n) Guide

This app uses locale-prefixed routes with JSON dictionaries in `locales/`.

## Current setup

- Supported locales are defined in `lib/i18n.ts` (`bg`, `en`).
- Locale routing middleware is in `middleware.ts`.
- Message files live in `locales/<locale>.json`.
- Server translation helper: `lib/i18n-server.ts`.
- Locale switcher UI: `components/ui/LocaleSwitcher.tsx`.

## Add a new translation key

1. Add the same key path to both `locales/en.json` and `locales/bg.json`.
2. Read it in server components with `getTranslations(locale)`.

Example locale files:

```json
{
  "home": {
    "welcome": "Welcome to P2P Roommate",
    "switch_language": "Switch language"
  }
}
```

```json
{
  "home": {
    "welcome": "Добре дошли в P2P Roommate",
    "switch_language": "Смени езика"
  }
}
```

Example server component usage:

```tsx
import type { Locale } from '@/lib/i18n';
import { getTranslations } from '@/lib/i18n-server';

export default async function HomePage({ params }: { params: { locale: Locale } }) {
  const t = await getTranslations(params.locale);

  return (
    <main>
      <h1>{t('home.welcome')}</h1>
    </main>
  );
}
```

## Add a new locale

1. Add locale code to `locales` in `lib/i18n.ts`.
2. Create `locales/<new-locale>.json`.
3. Add translations for all existing keys.

```ts
export const locales = ['bg', 'en', 'de'] as const;
```

## Best practices

1. Keep key paths stable (`feature.section.label` style).
2. Always add keys to all locales in the same PR.
3. Avoid hardcoded user-facing strings in components.
4. Keep interpolation and formatting consistent across languages.
