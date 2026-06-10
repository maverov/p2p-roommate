'use client';

import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher';
import type { Locale } from './layout';

interface PageProps {
  params: {
    locale: Locale;
  };
}

export default function HomePage({ params }: PageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="self-end">
        <LocaleSwitcher />
      </div>
      <h1>
        {params.locale === 'bg'
          ? 'Добре дошли в P2P Roommate'
          : 'Welcome to P2P Roommate'}
      </h1>
    </main>
  );
}
