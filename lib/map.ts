import type { CityId } from '@/lib/areas';

import tiles from './map-tiles.json';

/**
 * Raster tile source. OpenStreetMap's own servers are fine for development and light
 * traffic only (see their tile usage policy): production sets a provider here. The CSP
 * `img-src` in `next.config.js` is derived from the same variable.
 */
export const MAP_TILE_URL = process.env.NEXT_PUBLIC_MAP_TILE_URL || tiles.defaultUrl;
export const MAP_ATTRIBUTION = process.env.NEXT_PUBLIC_MAP_ATTRIBUTION || tiles.defaultAttribution;

export type LatLng = { latitude: number; longitude: number };

export const CITY_CENTERS: Record<CityId, [number, number]> = {
  sofia: [42.6977, 23.3219],
  plovdiv: [42.1354, 24.7453],
};

export const BULGARIA_CENTER: [number, number] = [42.7339, 25.4858];

/** A generous box around Bulgaria: a pin outside it is a slip, not a listing. */
export const BULGARIA_BOUNDS = { minLat: 41.2, maxLat: 44.25, minLng: 22.35, maxLng: 28.65 };

export function isInBulgaria({ latitude, longitude }: LatLng) {
  return (
    latitude >= BULGARIA_BOUNDS.minLat &&
    latitude <= BULGARIA_BOUNDS.maxLat &&
    longitude >= BULGARIA_BOUNDS.minLng &&
    longitude <= BULGARIA_BOUNDS.maxLng
  );
}

/**
 * Public maps show the area, not the front door: 3 decimals is about 110 m, and the
 * listing page draws a circle wide enough to contain the true point.
 */
export const APPROXIMATE_RADIUS_METERS = 300;

export function approximate(value: number) {
  return Math.round(value * 1000) / 1000;
}
