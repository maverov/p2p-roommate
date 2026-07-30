// Pure utility functions (formatCurrency, formatDate, cn(), etc.)
// Export your utilities here

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names and lets later Tailwind utilities win over earlier ones,
 * so a caller's `className` can always override a component's defaults.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
