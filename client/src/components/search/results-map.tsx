'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef, useState } from 'react';
import type { Map as MlMap, Marker } from 'maplibre-gl';
import { formatPriceShort } from '@/lib/utils';
import { OSM_STYLE } from '@/lib/map-style';
import { ROOM_TYPE_LABELS } from '@/lib/constants';
import type { RoomCardItem } from '@/components/rooms/room-card';

const HCMC_CENTER: [number, number] = [106.7009, 10.7769];

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};
function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c] ?? c);
}

function popupHtml(room: RoomCardItem) {
  return `<a class="rr-popup" href="/room/${encodeURIComponent(room.slug)}">
    <span class="rr-popup-title">${escapeHtml(room.title)}</span>
    <span class="rr-popup-meta">${escapeHtml(ROOM_TYPE_LABELS[room.roomType])} · ${escapeHtml(room.district)}</span>
    <span class="rr-popup-price">${escapeHtml(formatPriceShort(room.price))}/tháng</span>
  </a>`;
}

export function ResultsMap({
  rooms,
  activeId = null,
  onActivate,
}: {
  rooms: RoomCardItem[];
  /** Room to highlight, synced with the list. */
  activeId?: number | null;
  onActivate?: (id: number | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markerEls = useRef<Map<number, HTMLElement>>(new Map());
  // Keep the callback in a ref so marker listeners always call the latest one
  // without the markers effect depending on its identity.
  const onActivateRef = useRef(onActivate);
  useEffect(() => {
    onActivateRef.current = onActivate;
  });
  const [ready, setReady] = useState(false);

  // Create the map once on mount.
  useEffect(() => {
    let cancelled = false;
    void import('maplibre-gl').then(({ Map, NavigationControl }) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      const map = new Map({
        container: containerRef.current,
        style: OSM_STYLE,
        center: HCMC_CENTER,
        zoom: 11,
      });
      map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
      map.on('load', () => {
        if (!cancelled) setReady(true);
      });
      mapRef.current = map;
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // (Re)draw markers whenever the results change or the map becomes ready.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const markers: Marker[] = [];
    const els = markerEls.current;
    els.clear();
    let cancelled = false;

    void import('maplibre-gl').then(({ Marker, Popup, LngLatBounds }) => {
      if (cancelled) return;
      const located = rooms.filter(
        (r) => r.latitude != null && r.longitude != null,
      );
      const bounds = new LngLatBounds();

      for (const room of located) {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'rr-marker';
        el.textContent = formatPriceShort(room.price);
        el.addEventListener('mouseenter', () => onActivateRef.current?.(room.id));
        el.addEventListener('mouseleave', () => onActivateRef.current?.(null));

        const popup = new Popup({ offset: 22, closeButton: false }).setHTML(
          popupHtml(room),
        );
        const marker = new Marker({ element: el })
          .setLngLat([room.longitude as number, room.latitude as number])
          .setPopup(popup)
          .addTo(map);
        markers.push(marker);
        els.set(room.id, el);
        bounds.extend([room.longitude as number, room.latitude as number]);
      }

      if (located.length > 0) {
        map.fitBounds(bounds, { padding: 64, maxZoom: 14, duration: 0 });
      }
    });

    return () => {
      cancelled = true;
      markers.forEach((m) => m.remove());
      els.clear();
    };
  }, [rooms, ready]);

  // Highlight the active marker when the selection changes (e.g. list hover).
  useEffect(() => {
    markerEls.current.forEach((el, id) => {
      el.classList.toggle('is-active', id === activeId);
    });
  }, [activeId]);

  return (
    <div
      ref={containerRef}
      className="h-[70vh] min-h-[420px] w-full overflow-hidden rounded-lg border border-zinc-200"
    />
  );
}
