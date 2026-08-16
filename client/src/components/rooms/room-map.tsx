'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef, useState } from 'react';
import type { Map as MlMap, Marker } from 'maplibre-gl';
import { OSM_STYLE } from '@/lib/map-style';

/** A single, non-interactive-marker map centred on one listing — no key, no billing account. */
export function RoomMap({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void import('maplibre-gl').then(({ Map, NavigationControl }) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      const map = new Map({
        container: containerRef.current,
        style: OSM_STYLE,
        center: [longitude, latitude],
        zoom: 15,
      });
      map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
      map.on('load', () => {
        if (!cancelled) setReady(true);
      });
      mapRef.current = map;
    });
    return () => {
      cancelled = true;
      markerRef.current?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // Only re-run for a genuinely different listing — the map is created once
    // per mount, not re-centred reactively on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    void import('maplibre-gl').then(({ Marker }) => {
      markerRef.current = new Marker({ color: '#00875a' })
        .setLngLat([longitude, latitude])
        .addTo(map);
    });
  }, [ready, latitude, longitude]);

  return (
    <div
      ref={containerRef}
      className="h-[320px] w-full"
    />
  );
}
