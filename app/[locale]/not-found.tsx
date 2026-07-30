import Link from 'next/link';

import { StateMessage } from '@/components/shared/StateMessage';

/**
 * Renders inside the locale layout, so a missing listing keeps the navbar and
 * footer instead of dropping the visitor onto a bare page.
 *
 * The locale is not available to `not-found.tsx`, so the copy is bilingual.
 */
export default function LocaleNotFound() {
  return (
    <main className="flex min-h-[60vh] items-center bg-brand-cream px-6 py-16">
      <div className="mx-auto w-full max-w-xl">
        <StateMessage
          action={
            <Link
              className="rounded-[10px] bg-brand-terracotta px-4 py-2.5 text-[14px] font-bold text-white transition hover:bg-brand-terracotta-hover"
              href="/"
            >
              Към началото / Go home
            </Link>
          }
          body="Възможно е да е премахната или адресът да е грешен. · It may have been removed, or the address is wrong."
          title="Страницата не е намерена · Page not found"
        />
      </div>
    </main>
  );
}
