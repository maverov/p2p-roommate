import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-brand-cream px-6 py-12">
      <Link className="flex items-center gap-2.5" href="/">
        <svg aria-hidden="true" className="h-10 w-10" fill="none" viewBox="0 0 40 40">
          <circle cx="20" cy="20" fill="#c85b36" r="18" />
          <path d="M20 8L26 24H14L20 8Z" fill="white" />
        </svg>
        <span className="text-2xl font-bold tracking-tight text-brand-terracotta">
          stay<span className="text-brand-ink">.bg</span>
        </span>
      </Link>

      {children}
    </main>
  );
}
