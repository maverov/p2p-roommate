'use client';

import type { LeafletMouseEvent, Marker } from 'leaflet';
import { useEffect, useRef } from 'react';

import { isInBulgaria, type LatLng } from '@/lib/map';

import { MAP_CONTAINER, useLeafletMap } from './useLeafletMap';

type LocationPickerProps = {
  value: LatLng | null;
  /** Where to look when there is no pin yet: the listing's city. */
  fallbackCenter: [number, number];
  onChange: (value: LatLng | null) => void;
  labels: { region: string; hint: string; clear: string; pin: string };
};

const PIN =
  'absolute left-0 top-0 block size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-brand-terracotta shadow-[0_2px_8px_rgba(48,51,41,0.4)]';

/** Six decimals is about 10 cm; anything finer is noise from the pointer. */
const round = (value: number) => Math.round(value * 1e6) / 1e6;

/** Click the map to drop the pin, drag it to adjust. */
export function LocationPicker({ fallbackCenter, labels, onChange, value }: LocationPickerProps) {
  const { containerRef, instance } = useLeafletMap({
    center: value ? [value.latitude, value.longitude] : fallbackCenter,
    scrollWheelZoom: false,
    zoom: value ? 16 : 13,
  });
  const markerRef = useRef<Marker | null>(null);
  // Map listeners are bound once; the ref always calls the latest handler.
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (!instance) return;

    const pick = ({ lat, lng }: { lat: number; lng: number }) => {
      const next = { latitude: round(lat), longitude: round(lng) };

      if (isInBulgaria(next)) onChangeRef.current(next);
    };
    const onClick = (event: LeafletMouseEvent) => pick(event.latlng);

    instance.map.on('click', onClick);

    return () => {
      instance.map.off('click', onClick);
    };
  }, [instance]);

  const latitude = value?.latitude;
  const longitude = value?.longitude;
  const [centerLat, centerLng] = fallbackCenter;

  useEffect(() => {
    if (!instance) return;

    const { L, map } = instance;

    if (latitude === undefined || longitude === undefined) {
      markerRef.current?.remove();
      markerRef.current = null;
      map.setView([centerLat, centerLng], 13);

      return;
    }

    // A marker from a map that has since been torn down is not reused.
    if (markerRef.current && map.hasLayer(markerRef.current)) {
      markerRef.current.setLatLng([latitude, longitude]);

      return;
    }

    const marker = L.marker([latitude, longitude], {
      draggable: true,
      icon: L.divIcon({ className: '', html: `<span class="${PIN}"></span>`, iconSize: [0, 0] }),
      keyboard: true,
      title: labels.pin,
    }).addTo(map);

    let dragStart = marker.getLatLng();

    marker.on('dragstart', () => {
      dragStart = marker.getLatLng();
    });
    marker.on('dragend', () => {
      const position = marker.getLatLng();
      const next = { latitude: round(position.lat), longitude: round(position.lng) };

      if (isInBulgaria(next)) {
        onChangeRef.current(next);
      } else {
        marker.setLatLng(dragStart);
      }
    });
    markerRef.current = marker;
  }, [centerLat, centerLng, instance, labels.pin, latitude, longitude]);

  return (
    <div className="grid gap-2">
      <div
        aria-label={labels.region}
        className={`${MAP_CONTAINER} h-[300px]`}
        ref={containerRef}
        role="region"
      />
      <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-brand-muted">
        <p>{labels.hint}</p>
        {value && (
          <button
            className="font-semibold text-brand-terracotta hover:underline"
            onClick={() => onChange(null)}
            type="button"
          >
            {labels.clear}
          </button>
        )}
      </div>
    </div>
  );
}
