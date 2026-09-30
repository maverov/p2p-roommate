'use client';

import { Printer } from 'lucide-react';

/** Opens the browser's print dialog, which also offers "Save as PDF". */
export function PrintButton({ label }: { label: string }) {
  return (
    <button
      className="inline-flex items-center gap-2 rounded-[10px] bg-brand-terracotta px-4 py-2.5 text-[14px] font-bold text-white transition hover:bg-brand-terracotta-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terracotta"
      onClick={() => window.print()}
      type="button"
    >
      <Printer aria-hidden="true" size={16} strokeWidth={2} />
      {label}
    </button>
  );
}
