// Pure utility functions (formatCurrency, formatDate, cn(), etc.)
// Export your utilities here

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
