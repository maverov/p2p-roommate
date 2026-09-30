'use client';

import 'leaflet/dist/leaflet.css';

import type { Map as LeafletMap } from 'leaflet';
import { useEffect, useRef, useState } from 'react';

import { MAP_ATTRIBUTION, MAP_TILE_URL } from '@/lib/map';

export type Leaflet = typeof import('leaflet');
export type LeafletInstance = { L: Leaflet; map: LeafletMap };

type Options = {
  center: [number, number];
  zoom: number;
  /** Off where the map sits in a scrolling page, so the wheel scrolls the page. */
  scrollWheelZoom?: boolean;
};

/**
 * Leaflet touches `window` when it loads, so it is imported in an effect, never during
 * SSR, and only on pages that render a map. The map is created once per mount; callers
 * add their layers in their own effects once `instance` is set.
 */
export function useLeafletMap({ center, scrollWheelZoom = true, zoom }: Options) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [instance, setInstance] = useState<LeafletInstance | null>(null);
  // The first render's view seeds the map; later changes are applied by the caller.
  const initialView = useRef({ center, zoom, scrollWheelZoom });

  useEffect(() => {
    let cancelled = false;
    let map: LeafletMap | undefined;

    void import('leaflet').then(({ default: L }) => {
      if (cancelled || !containerRef.current) return;

      map = L.map(containerRef.current, initialView.current);
      L.tileLayer(MAP_TILE_URL, { attribution: MAP_ATTRIBUTION, maxZoom: 19 }).addTo(map);
      setInstance({ L, map });
    });

    return () => {
      cancelled = true;
      map?.remove();
      setInstance(null);
    };
  }, []);

  return { containerRef, instance };
}

/** Leaflet builds marker and popup markup from strings; listing text never goes in unescaped. */
export function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!,
  );
}

/** Leaflet panes use z-indexes up to 1000; this keeps them below the site's own overlays. */
export const MAP_CONTAINER =
  'relative z-0 w-full overflow-hidden rounded-[15px] border border-brand-border bg-brand-chip';
