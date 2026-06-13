import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher';
import type { Locale } from '@/lib/i18n';
import { getTranslations } from '@/lib/i18n-server';
import { getNeighborhoodGroupsByCity } from "../../../../packages/shared/src/areas";


interface PageProps {
  params: {
    locale: Locale;
  };
}

export default async function HomePage({ params }: PageProps) {
  const t = await getTranslations(params.locale);
  const groups = getNeighborhoodGroupsByCity("sofia");

  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-between">
      <header className="self-end" aria-label={t('home.switch_language')}>
        <LocaleSwitcher />
      </header>
      <h1 className="text-3xl font-semibold tracking-tight">{t('home.welcome')}</h1>
    </main>
  );
}
