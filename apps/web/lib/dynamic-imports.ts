// Examples of dynamic imports for code splitting
// Use these to lazy-load heavy components and reduce initial bundle

import dynamic from 'next/dynamic';

// Example 1: Lazy-load a complex component
export const HeavyMapComponent = dynamic(
  () => import('@/components/shared/Map'),
  {
    loading: () => <p>Loading map...</p>,
    ssr: false, // Disable SSR for browser-only libraries
  }
);

// Example 2: Lazy-load a modal
export const ConfirmDialog = dynamic(
  () => import('@/components/shared/ConfirmDialog'),
  {
    loading: () => <p>Loading...</p>,
  }
);

// Example 3: Lazy-load a form
export const ComplexForm = dynamic(
  () => import('@/features/listings/components/ComplexForm'),
  {
    loading: () => <p>Loading form...</p>,
  }
);

/**
 * Usage in components:
 *
 * import { HeavyMapComponent } from '@/lib/dynamic-imports';
 *
 * export function ListingDetail() {
 *   return (
 *     <div>
 *       <h1>Listing</h1>
 *       <Suspense fallback={<p>Loading map...</p>}>
 *         <HeavyMapComponent />
 *       </Suspense>
 *     </div>
 *   );
 * }
 */
