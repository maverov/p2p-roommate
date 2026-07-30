import Link from 'next/link';

import { StateMessage } from '@/components/shared/StateMessage';

/** Root-level 404, used for paths outside the locale tree (e.g. /favicon-typo). */
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center bg-brand-cream px-6 py-16">
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
          body="Адресът не съществува. · This address does not exist."
          title="Страницата не е намерена · Page not found"
        />
      </div>
    </main>
  );
}
