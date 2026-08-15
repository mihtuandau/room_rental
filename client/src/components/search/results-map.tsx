'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { GeoJSONSource, Map as MlMap, Marker, Popup } from 'maplibre-gl';
import { PLACEHOLDER_IMAGE, type RoomCardItem } from '@/components/rooms/room-card';
import type { SearchState } from '@/features/rooms/search-params';
import { ROOM_TYPE_LABELS } from '@/lib/constants';
import { HOME_MAP_COLORS, OSM_STYLE } from '@/lib/map-style';
import { formatPriceShort } from '@/lib/utils';

const HCMC_CENTER: [number, number] = [106.7009, 10.7769];
const MARKER_COLLISION_OFFSET_DEGREES = 0.00024;
const USER_MARKER_COLLISION_KM = 0.05;

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

function getRoomImageUrl(room: RoomCardItem) {
  return room.images.find((image) => image.url)?.url ?? PLACEHOLDER_IMAGE;
}

function popupHtml(room: RoomCardItem) {
  return `<a class="rr-popup rr-popup--room" href="/room/${encodeURIComponent(room.slug)}">
    <img class="rr-popup-image" src="${escapeHtml(getRoomImageUrl(room))}" alt="" />
    <span class="rr-popup-title">${escapeHtml(room.title)}</span>
    <span class="rr-popup-meta">${escapeHtml(ROOM_TYPE_LABELS[room.roomType])} · ${escapeHtml(room.district ?? room.city)}</span>
    <span class="rr-popup-price">${escapeHtml(formatPriceShort(room.price))}/tháng</span>
    <span class="rr-popup-action">Xem chi tiết phòng →</span>
  </a>`;
}

function isLocated(room: RoomCardItem) {
  return (
    room.latitude != null &&
    room.longitude != null &&
    Number.isFinite(room.latitude) &&
    Number.isFinite(room.longitude)
  );
}

function circleFeature(center: [number, number], radiusKm: number) {
  const points: [number, number][] = [];
  const latitudeFactor = 111.32;
  const longitudeFactor = Math.max(1, 111.32 * Math.cos((center[1] * Math.PI) / 180));

  for (let i = 0; i <= 96; i += 1) {
    const angle = (i / 96) * Math.PI * 2;
    points.push([
      center[0] + (radiusKm / longitudeFactor) * Math.cos(angle),
      center[1] + (radiusKm / latitudeFactor) * Math.sin(angle),
    ]);
  }

  return {
    type: 'Feature' as const,
    properties: {},
    geometry: { type: 'Polygon' as const, coordinates: [points] },
  };
}

function distanceKm(from: [number, number], to: [number, number]) {
  const earthRadiusKm = 6371;
  const latitudeDelta = ((to[1] - from[1]) * Math.PI) / 180;
  const longitudeDelta = ((to[0] - from[0]) * Math.PI) / 180;
  const fromLatitude = (from[1] * Math.PI) / 180;
  const toLatitude = (to[1] * Math.PI) / 180;
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function coordinateKey(point: [number, number]) {
  return `${point[0].toFixed(5)}:${point[1].toFixed(5)}`;
}

function offsetMarkerPosition(point: [number, number], index: number) {
  const angle = ((index % 8) / 8) * Math.PI * 2;
  const ring = Math.floor(index / 8) + 1;

  return [
    point[0] + Math.cos(angle) * MARKER_COLLISION_OFFSET_DEGREES * ring,
    point[1] + Math.sin(angle) * MARKER_COLLISION_OFFSET_DEGREES * ring,
  ] as [number, number];
}

export function ResultsMap({
  rooms,
  state,
  activeId = null,
  onActivate,
}: {
  rooms: RoomCardItem[];
  state: SearchState;
  activeId?: number | null;
  onActivate?: (id: number | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const userMarkerRef = useRef<Marker | null>(null);
  const markerEls = useRef<Map<number, HTMLElement>>(new Map());
  const onActivateRef = useRef(onActivate);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onActivateRef.current = onActivate;
  });

  const userCenter = useMemo<[number, number] | null>(() => {
    if (state.mode !== 'nearby' || !state.lat || !state.lng) return null;
    const latitude = Number(state.lat);
    const longitude = Number(state.lng);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return [longitude, latitude];
  }, [state.lat, state.lng, state.mode]);
  const radiusKm = state.radiusKm ?? 3;
  const locatedRooms = useMemo(() => rooms.filter(isLocated), [rooms]);
  const roomsInRadius = useMemo(() => {
    if (!userCenter) return locatedRooms;
    return locatedRooms.filter((room) =>
      distanceKm(userCenter, [room.longitude as number, room.latitude as number]) <= radiusKm,
    );
  }, [locatedRooms, radiusKm, userCenter]);

  useEffect(() => {
    let cancelled = false;
    void import('maplibre-gl').then(({ Map, NavigationControl }) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      const map = new Map({
        container: containerRef.current,
        style: OSM_STYLE,
        center: userCenter ?? HCMC_CENTER,
        zoom: userCenter ? 12 : 11,
      });
      map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
      map.on('load', () => {
        if (!cancelled) setReady(true);
      });
      mapRef.current = map;
    });
    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // The map is created once. Data changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    if (!userCenter) {
      if (map.getLayer('results-radius-line')) map.removeLayer('results-radius-line');
      if (map.getLayer('results-radius-fill')) map.removeLayer('results-radius-fill');
      if (map.getSource('results-radius')) map.removeSource('results-radius');
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      return;
    }

    if (locatedRooms.length === 0) {
      map.easeTo({ center: userCenter, zoom: 12, duration: 300 });
    }
    const feature = circleFeature(userCenter, radiusKm);
    const source = map.getSource('results-radius');
    if (source?.type === 'geojson') {
      (source as GeoJSONSource).setData(feature);
    } else {
      map.addSource('results-radius', { type: 'geojson', data: feature });
      map.addLayer({
        id: 'results-radius-fill',
        type: 'fill',
        source: 'results-radius',
        paint: { 'fill-color': HOME_MAP_COLORS.radiusFill, 'fill-opacity': 0.18 },
      });
      map.addLayer({
        id: 'results-radius-line',
        type: 'line',
        source: 'results-radius',
        paint: {
          'line-color': HOME_MAP_COLORS.radiusLine,
          'line-width': 2.5,
          'line-opacity': 0.9,
          'line-dasharray': [2, 2],
        },
      });
    }

    let cancelled = false;
    void import('maplibre-gl').then(({ Marker, Popup }) => {
      if (cancelled || !userCenter) return;
      userMarkerRef.current?.remove();

      const markerButton = document.createElement('button');
      markerButton.type = 'button';
      markerButton.className = 'rr-user-marker';
      markerButton.setAttribute('aria-label', 'Vị trí của bạn');
      const dot = document.createElement('span');
      dot.className = 'rr-user-marker-dot';
      markerButton.appendChild(dot);

      const popupContent = document.createElement('div');
      popupContent.className = 'rr-popup rr-popup--user';
      const title = document.createElement('strong');
      title.className = 'rr-popup-title';
      title.textContent = 'Vị trí của bạn';
      const meta = document.createElement('span');
      meta.className = 'rr-popup-meta';
      meta.textContent = `Đang xem phòng trong bán kính ${radiusKm} km`;
      popupContent.append(title, meta);

      userMarkerRef.current = new Marker({ element: markerButton, anchor: 'center' })
        .setLngLat(userCenter)
        .setPopup(new Popup({ offset: 18, closeButton: false }).setDOMContent(popupContent))
        .addTo(map);
    });

    return () => {
      cancelled = true;
    };
  }, [locatedRooms.length, radiusKm, ready, userCenter]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const els = markerEls.current;
    els.clear();
    let cancelled = false;
    let closePopupOnMapClick: (() => void) | null = null;

    void import('maplibre-gl').then(({ Marker, Popup, LngLatBounds }) => {
      if (cancelled) return;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      const bounds = new LngLatBounds();
      if (userCenter) bounds.extend(userCenter);
      const renderedPoints = new Map<string, number>();
      let activePopup: Popup | null = null;
      let pinnedPopup: Popup | null = null;
      let closeTimer: ReturnType<typeof setTimeout> | null = null;
      closePopupOnMapClick = () => {
        activePopup?.remove();
        activePopup = null;
        pinnedPopup = null;
      };
      map.on('click', closePopupOnMapClick);

      for (const room of locatedRooms) {
        const roomPoint: [number, number] = [room.longitude as number, room.latitude as number];
        const key = coordinateKey(roomPoint);
        const collisionIndex = renderedPoints.get(key) ?? 0;
        renderedPoints.set(key, collisionIndex + 1);
        const isTooCloseToUser = userCenter
          ? distanceKm(userCenter, roomPoint) <= USER_MARKER_COLLISION_KM
          : false;
        const markerPoint =
          collisionIndex > 0 || isTooCloseToUser
            ? offsetMarkerPosition(roomPoint, collisionIndex)
            : roomPoint;
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'rr-marker';
        el.setAttribute('aria-label', `${room.title}, ${formatPriceShort(room.price)}`);

        const image = document.createElement('img');
        image.className = 'rr-marker-photo';
        image.src = getRoomImageUrl(room);
        image.alt = '';
        image.addEventListener('error', () => {
          image.src = PLACEHOLDER_IMAGE;
        });
        el.appendChild(image);

        const price = document.createElement('span');
        price.className = 'rr-marker-price';
        price.textContent = formatPriceShort(room.price);
        el.appendChild(price);

        el.addEventListener('mouseenter', () => onActivateRef.current?.(room.id));
        el.addEventListener('mouseleave', () => onActivateRef.current?.(null));

        // Leaving anchor unset uses MapLibre's automatic edge-aware placement.
        const popup = new Popup({ offset: 32, closeButton: false, closeOnClick: false }).setHTML(popupHtml(room));
        const cancelClose = () => {
          if (closeTimer) {
            clearTimeout(closeTimer);
            closeTimer = null;
          }
        };
        const scheduleClose = () => {
          if (pinnedPopup === popup) return;
          cancelClose();
          closeTimer = setTimeout(() => {
            popup.remove();
            if (activePopup === popup) activePopup = null;
            closeTimer = null;
          }, 180);
        };
        const openPopup = () => {
          cancelClose();
          activePopup?.remove();
          activePopup = popup;
          pinnedPopup = popup;
          popup.setLngLat(markerPoint).addTo(map);
          const popupLink = popup.getElement()?.querySelector<HTMLElement>('.rr-popup');
          if (popupLink && popupLink.dataset.hoverBound !== 'true') {
            popupLink.dataset.hoverBound = 'true';
            popupLink.addEventListener('mouseenter', cancelClose);
            popupLink.addEventListener('mouseleave', scheduleClose);
          }
        };
        el.addEventListener('click', (event) => {
          event.stopPropagation();
          openPopup();
        });
        el.addEventListener('mouseleave', scheduleClose);

        const marker = new Marker({ element: el, anchor: 'bottom' })
          .setLngLat(markerPoint)
          .addTo(map);
        markersRef.current.push(marker);
        els.set(room.id, el);
        bounds.extend(roomPoint);
      }

      if (locatedRooms.length > 0) {
        map.fitBounds(bounds, {
          padding: userCenter ? 72 : 64,
          maxZoom: userCenter ? 13 : 14,
          duration: userCenter ? 300 : 0,
        });
      }
    });

    return () => {
      cancelled = true;
      if (closePopupOnMapClick) map.off('click', closePopupOnMapClick);
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      els.clear();
    };
  }, [locatedRooms, ready, userCenter]);

  useEffect(() => {
    markerEls.current.forEach((el, id) => {
      el.classList.toggle('is-active', id === activeId);
    });
  }, [activeId]);

  return (
    <div className="relative h-[70vh] min-h-[420px] w-full overflow-hidden rounded-lg border border-zinc-200">
      <div ref={containerRef} className="h-full w-full" />
      {userCenter ? (
        <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-md border border-zinc-200 bg-white/95 px-3 py-2 text-xs shadow-card backdrop-blur-sm">
          <p className="font-medium text-zinc-900">Bán kính {radiusKm} km</p>
          <p className="mt-0.5 text-zinc-500">
            {roomsInRadius.length > 0
              ? `${roomsInRadius.length} phòng có tọa độ trong vùng`
              : 'Chưa có phòng có tọa độ trong vùng này'}
          </p>
        </div>
      ) : null}
    </div>
  );
}
