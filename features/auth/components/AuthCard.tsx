import type { Route } from 'next';
import Link from 'next/link';

type AuthCardProps = {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  /** Built by `lib/routes` so the `?next=` round-trip survives login ↔ signup. */
  footer?: {
    href: Route;
    label: string;
    text?: string;
  };
};

export function AuthCard({ children, eyebrow, footer, title }: AuthCardProps) {
  return (
    <section className="w-full max-w-md rounded-lg border border-brand-border bg-white p-6 shadow-[0_16px_48px_rgba(48,51,41,0.10)]">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-terracotta">
        {eyebrow}
      </p>
      <h1 className="mt-2 font-serif text-3xl font-medium leading-tight text-brand-ink">
        {title}
      </h1>

      <div className="mt-6">{children}</div>

      {footer && (
        <p className="mt-6 text-sm text-brand-muted">
          {footer.text && `${footer.text} `}
          <Link
            className="font-semibold text-brand-terracotta hover:text-brand-terracotta-hover"
            href={footer.href}
          >
            {footer.label}
          </Link>
        </p>
      )}
    </section>
  );
}
