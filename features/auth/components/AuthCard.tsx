import Link from 'next/link';
import type { Route } from 'next';

type AuthCardProps = {
  children: React.ReactNode;
  eyebrow: string;
  footerHref: Route;
  footerLabel: string;
  footerText: string;
  title: string;
};

export function AuthCard({
  children,
  eyebrow,
  footerHref,
  footerLabel,
  footerText,
  title,
}: AuthCardProps) {
  return (
    <section className="w-full max-w-md rounded-lg border border-brand-border bg-white p-6 shadow-[0_16px_48px_rgba(48,51,41,0.10)]">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-terracotta">
        {eyebrow}
      </p>
      <h1 className="mt-2 font-serif text-3xl font-medium leading-tight text-brand-ink">
        {title}
      </h1>

      <div className="mt-6">{children}</div>

      <p className="mt-6 text-sm text-brand-muted">
        {footerText}{' '}
        <Link className="font-semibold text-brand-terracotta hover:text-brand-terracotta-hover" href={footerHref}>
          {footerLabel}
        </Link>
      </p>
    </section>
  );
}
