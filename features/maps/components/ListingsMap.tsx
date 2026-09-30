'use client';

import { useEffect } from 'react';

import { cn } from '@/utils';

import { MAP_CONTAINER, escapeHtml, useLeafletMap } from './useLeafletMap';

/** Everything a marker needs, already formatted on the server. */
export type MapListing = {
  id: string;
  title: string;
  href: string;
  priceLabel: string;
  areaLabel: string | null;
  latitude: number;
  longitude: number;
};

type ListingsMapProps = {
  listings: MapListing[];
  center: [number, number];
  labels: { region: string; view: string };
  className?: string;
};

// A zero-size marker anchored at the point, with the pill hung above it.
const PILL =
  'absolute left-0 top-0 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full border-2 border-white bg-brand-terracotta px-2.5 py-1 text-[12px] font-bold leading-4 text-white shadow-[0_4px_12px_rgba(48,51,41,0.3)] transition hover:bg-brand-terracotta-hover';

export function ListingsMap({ center, className, labels, listings }: ListingsMapProps) {
  const { containerRef, instance } = useLeafletMap({ center, zoom: 12 });

  useEffect(() => {
    if (!instance) return;

    const { L, map } = instance;
    const layer = L.layerGroup();
    const bounds = L.latLngBounds([]);

    for (const listing of listings) {
      const position: [number, number] = [listing.latitude, listing.longitude];

      L.marker(position, {
        icon: L.divIcon({
          className: '',
          html: `<span class="${PILL}">${escapeHtml(listing.priceLabel)}</span>`,
          iconSize: [0, 0],
        }),
        keyboard: true,
        riseOnHover: true,
        title: listing.title,
      })
        .bindPopup(() => popupContent(listing, labels.view))
        .addTo(layer);
      bounds.extend(position);
    }

    layer.addTo(map);

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
    }

    return () => {
      layer.remove();
    };
  }, [instance, labels.view, listings]);

  return (
    <div
      aria-label={labels.region}
      className={cn(MAP_CONTAINER, 'h-[70vh] min-h-[420px]', className)}
      ref={containerRef}
      role="region"
    />
  );
}

/** Built as DOM nodes with `textContent`, so a listing title can never inject markup. */
function popupContent(listing: MapListing, viewLabel: string) {
  const root = document.createElement('div');
  root.className = 'grid min-w-[180px] gap-1';

  const title = document.createElement('p');
  title.className = 'm-0 text-[14px] font-bold leading-5 text-brand-ink';
  title.textContent = listing.title;

  const meta = document.createElement('p');
  meta.className = 'm-0 text-[13px] leading-5 text-brand-muted';
  meta.textContent = [listing.priceLabel, listing.areaLabel].filter(Boolean).join(' · ');

  const link = document.createElement('a');
  link.className = 'mt-1 text-[13px] font-bold text-brand-terracotta hover:underline';
  link.href = listing.href;
  link.textContent = `${viewLabel} →`;

  root.append(title, meta, link);

  return root;
}
