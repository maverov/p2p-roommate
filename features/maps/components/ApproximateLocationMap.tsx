'use client';

import { useEffect } from 'react';

import { APPROXIMATE_RADIUS_METERS } from '@/lib/map';

import { MAP_CONTAINER, useLeafletMap } from './useLeafletMap';

type ApproximateLocationMapProps = {
  /** Already rounded by the server (`approximate`), so the exact point never ships. */
  latitude: number;
  longitude: number;
  label: string;
};

const BRAND_TERRACOTTA = '#c85b36';

export function ApproximateLocationMap({
  label,
  latitude,
  longitude,
}: ApproximateLocationMapProps) {
  const { containerRef, instance } = useLeafletMap({
    center: [latitude, longitude],
    scrollWheelZoom: false,
    zoom: 15,
  });

  useEffect(() => {
    if (!instance) return;

    const circle = instance.L.circle([latitude, longitude], {
      color: BRAND_TERRACOTTA,
      fillColor: BRAND_TERRACOTTA,
      fillOpacity: 0.18,
      radius: APPROXIMATE_RADIUS_METERS,
      weight: 2,
    }).addTo(instance.map);

    return () => {
      circle.remove();
    };
  }, [instance, latitude, longitude]);

  return (
    <div
      aria-label={label}
      className={`${MAP_CONTAINER} h-[280px]`}
      ref={containerRef}
      role="region"
    />
  );
}
