import { Ban } from 'lucide-react';

/** Stands in for a contact form when a block rules contact out. */
export function ContactUnavailable({ message }: { message: string }) {
  return (
    <p className="flex items-start gap-2 rounded-[10px] border border-brand-border bg-brand-chip px-4 py-3 text-[13px] leading-5 text-brand-muted">
      <Ban aria-hidden="true" className="mt-0.5 shrink-0" size={15} strokeWidth={2} />
      {message}
    </p>
  );
}
