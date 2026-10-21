import 'server-only';

import { approximate } from '@/lib/map';

/** Public reads never carry a street address or a precise map pin. */
export function publicListingLocation<
  T extends {
    addressLine: string | null;
    latitude: number | null;
    longitude: number | null;
  },
>(listing: T): T {
  return {
    ...listing,
    addressLine: null,
    latitude: listing.latitude === null ? null : approximate(listing.latitude),
    longitude: listing.longitude === null ? null : approximate(listing.longitude),
  };
}
