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

## Client components: pass translated strings as props

`getTranslations` is server-only (`lib/i18n-server.ts` imports `server-only`), so client components should receive translated text from a parent server component.

### Server component -> client component example

```tsx
// app/[locale]/page.tsx (Server Component)
import type { Locale } from '@/lib/i18n';
import { getTranslations } from '@/lib/i18n-server';
import { WelcomeCard } from '@/components/shared/WelcomeCard';

export default async function HomePage({ params }: { params: { locale: Locale } }) {
  const t = await getTranslations(params.locale);

  return (
    <WelcomeCard
      title={t('home.welcome')}
      switchLanguageLabel={t('home.switch_language')}
    />
  );
}
```

```tsx
// components/shared/WelcomeCard.tsx (Client Component)
'use client';

interface WelcomeCardProps {
  title: string;
  switchLanguageLabel: string;
}

export function WelcomeCard({ title, switchLanguageLabel }: WelcomeCardProps) {
  return (
    <section>
      <h2>{title}</h2>
      <button type="button">{switchLanguageLabel}</button>
    </section>
  );
}
```

### Pass only what the client needs

Prefer passing small, explicit props (or a typed `labels` object) instead of passing a generic translation function.

```tsx
interface LoginLabels {
  email: string;
  password: string;
  submit: string;
}

// Server component
const labels: LoginLabels = {
  email: t('auth.login.email'),
  password: t('auth.login.password'),
  submit: t('auth.login.submit'),
};
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
4. For client components, translate in server components and pass typed props.
5. Keep interpolation and formatting consistent across languages.
