'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import type { GeoJSONSource, Map as MlMap, Marker, Popup } from 'maplibre-gl';
import type { RoomCardItem } from '@/components/rooms/room-card';
import { PLACEHOLDER_IMAGE } from '@/components/rooms/room-card';
import { HOME_MAP_COLORS, OSM_STYLE } from '@/lib/map-style';
import { formatPriceShort } from '@/lib/utils';

const VIETNAM_CENTER: [number, number] = [108.2772, 14.0583];
const HCMC_CENTER: [number, number] = [106.7009, 10.7769];
const MARKER_COLLISION_OFFSET_DEGREES = 0.00024;
const USER_MARKER_COLLISION_KM = 0.05;

const CITY_CENTERS: Record<string, [number, number]> = {
  'Hồ Chí Minh': [106.7009, 10.7769],
  'Hà Nội': [105.8342, 21.0278],
  'Đà Nẵng': [108.2022, 16.0544],
  'Bình Dương': [106.6667, 11.1667],
  'Đồng Nai': [107.1676, 10.9453],
  'Cần Thơ': [105.7469, 10.0452],
  'Hải Phòng': [106.6881, 20.8449],
};

type SearchCenterMode = 'province' | 'nearby';

interface HomeMapProps {
  rooms: RoomCardItem[];
  radiusKm: number;
  selectedCity: string;
  centerMode: SearchCenterMode;
  userCenter: [number, number] | null;
}

function isLocated(room: RoomCardItem) {
  return (
    room.latitude != null &&
    room.longitude != null &&
    Number.isFinite(room.latitude) &&
    Number.isFinite(room.longitude) &&
    room.latitude >= -90 &&
    room.latitude <= 90 &&
    room.longitude >= -180 &&
    room.longitude <= 180
  );
}

function getRoomImageUrl(room: RoomCardItem) {
  return room.images.find((image) => image.url)?.url ?? PLACEHOLDER_IMAGE;
}

function averageCenter(rooms: RoomCardItem[]): [number, number] | null {
  if (rooms.length === 0) return null;
  const total = rooms.reduce(
    (sum, room) => ({
      longitude: sum.longitude + (room.longitude as number),
      latitude: sum.latitude + (room.latitude as number),
    }),
    { longitude: 0, latitude: 0 },
  );

  return [total.longitude / rooms.length, total.latitude / rooms.length];
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

export function HomeMap({
  rooms,
  radiusKm,
  selectedCity,
  centerMode,
  userCenter,
}: HomeMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const userMarkerRef = useRef<Marker | null>(null);
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const locatedRooms = useMemo(() => rooms.filter(isLocated), [rooms]);
  const cityRooms = useMemo(
    () => (selectedCity ? locatedRooms.filter((room) => room.city === selectedCity) : locatedRooms),
    [locatedRooms, selectedCity],
  );
  const hasFocusedCenter = centerMode === 'nearby' ? userCenter != null : Boolean(selectedCity);
  const hasRadiusCenter = centerMode === 'nearby' && userCenter != null;
  const center = useMemo<[number, number]>(() => {
    if (centerMode === 'nearby' && userCenter) return userCenter;
    return averageCenter(cityRooms) ?? CITY_CENTERS[selectedCity] ?? (selectedCity ? HCMC_CENTER : VIETNAM_CENTER);
  }, [centerMode, cityRooms, selectedCity, userCenter]);
  const visibleRooms = useMemo(() => {
    if (!hasFocusedCenter) return locatedRooms;
    if (!hasRadiusCenter) return cityRooms;
    return locatedRooms;
  }, [cityRooms, hasFocusedCenter, hasRadiusCenter, locatedRooms]);
  useEffect(() => {
    let cancelled = false;
    void import('maplibre-gl').then(({ Map, NavigationControl }) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      const map = new Map({
        container: containerRef.current,
        style: OSM_STYLE,
        center,
        zoom: hasFocusedCenter ? 11.5 : 5.3,
      });
      map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
      let loaded = false;
      map.on('load', () => {
        if (cancelled) return;
        loaded = true;
        map.resize();
        setReady(true);
      });
      map.on('error', () => {
        if (!loaded) setMapError(true);
      });
      mapRef.current = map;

      const resizeObserver = new ResizeObserver(() => map.resize());
      resizeObserver.observe(containerRef.current);
      map.once('remove', () => resizeObserver.disconnect());
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
    // The map is initialized once. Center/marker changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    let cancelled = false;
    void import('maplibre-gl').then(({ LngLatBounds }) => {
      if (cancelled) return;

      if (visibleRooms.length > 1 || (hasRadiusCenter && visibleRooms.length > 0)) {
        const bounds = new LngLatBounds();
        if (hasRadiusCenter) bounds.extend(center);
        visibleRooms.forEach((room) => {
          bounds.extend([room.longitude as number, room.latitude as number]);
        });
        map.fitBounds(bounds, {
          padding: 64,
          maxZoom: hasRadiusCenter ? 13 : 12,
          duration: 350,
        });
        return;
      }

      map.easeTo({
        center,
        zoom: hasFocusedCenter ? 12 : 5.3,
        duration: 350,
      });
    });

    if (!hasRadiusCenter) {
      if (map.getLayer('home-radius-line')) map.removeLayer('home-radius-line');
      if (map.getLayer('home-radius-fill')) map.removeLayer('home-radius-fill');
      if (map.getSource('home-radius')) map.removeSource('home-radius');
      return () => {
        cancelled = true;
      };
    }

    const feature = circleFeature(center, radiusKm);
    const source = map.getSource('home-radius');
    if (source?.type === 'geojson') {
      (source as GeoJSONSource).setData(feature);
      return () => {
        cancelled = true;
      };
    }

    map.addSource('home-radius', { type: 'geojson', data: feature });
    map.addLayer({
      id: 'home-radius-fill',
      type: 'fill',
      source: 'home-radius',
      paint: { 'fill-color': HOME_MAP_COLORS.radiusFill, 'fill-opacity': 0.18 },
    });
    map.addLayer({
      id: 'home-radius-line',
      type: 'line',
      source: 'home-radius',
      paint: {
        'line-color': HOME_MAP_COLORS.radiusLine,
        'line-width': 2.5,
        'line-opacity': 0.9,
        'line-dasharray': [2, 2],
      },
    });

    return () => {
      cancelled = true;
    };
  }, [center, hasFocusedCenter, hasRadiusCenter, radiusKm, ready, visibleRooms]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    let cancelled = false;
    void import('maplibre-gl').then(({ Marker, Popup }) => {
      if (cancelled) return;

      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      if (centerMode !== 'nearby' || !userCenter) return;

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
      meta.textContent = `Đang tìm phòng trong bán kính ${radiusKm} km`;
      popupContent.append(title, meta);

      userMarkerRef.current = new Marker({ element: markerButton, anchor: 'center' })
        .setLngLat(userCenter)
        .setPopup(new Popup({ offset: 18, closeButton: false }).setDOMContent(popupContent))
        .addTo(map);
    });

    return () => {
      cancelled = true;
    };
  }, [centerMode, radiusKm, ready, userCenter]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    let cancelled = false;
    let closePopupOnMapClick: (() => void) | null = null;
    void import('maplibre-gl').then(({ Marker, Popup }) => {
      if (cancelled) return;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
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

      for (const room of visibleRooms) {
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
        const markerButton = document.createElement('button');
        markerButton.type = 'button';
        markerButton.className = 'rr-marker';
        markerButton.setAttribute('aria-label', `${room.title}, ${formatPriceShort(room.price)}`);

        const image = document.createElement('img');
        image.className = 'rr-marker-photo';
        image.src = getRoomImageUrl(room);
        image.alt = '';
        image.addEventListener('error', () => {
          image.src = PLACEHOLDER_IMAGE;
        });
        markerButton.appendChild(image);

        const price = document.createElement('span');
        price.className = 'rr-marker-price';
        price.textContent = formatPriceShort(room.price);
        markerButton.appendChild(price);

        const popupLink = document.createElement('a');
        popupLink.className = 'rr-popup rr-popup--room';
        popupLink.href = `/room/${encodeURIComponent(room.slug)}`;
        const popupImage = document.createElement('img');
        popupImage.className = 'rr-popup-image';
        popupImage.src = getRoomImageUrl(room);
        popupImage.alt = '';
        popupImage.addEventListener('error', () => {
          popupImage.src = PLACEHOLDER_IMAGE;
        });
        popupLink.appendChild(popupImage);
        const title = document.createElement('strong');
        title.className = 'rr-popup-title';
        title.textContent = room.title;
        const meta = document.createElement('span');
        meta.className = 'rr-popup-meta';
        meta.textContent = `${room.district}, ${room.city}`;
        const popupPrice = document.createElement('span');
        popupPrice.className = 'rr-popup-price';
        popupPrice.textContent = `${formatPriceShort(room.price)}/tháng`;
        const popupAction = document.createElement('span');
        popupAction.className = 'rr-popup-action';
        popupAction.textContent = 'Xem chi tiết phòng →';
        popupLink.append(title, meta, popupPrice, popupAction);

        // Leaving anchor unset uses MapLibre's automatic edge-aware placement.
        const popup = new Popup({ offset: 32, closeButton: false, closeOnClick: false }).setDOMContent(popupLink);
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
        };
        markerButton.addEventListener('click', (event) => {
          event.stopPropagation();
          openPopup();
        });
        markerButton.addEventListener('mouseleave', scheduleClose);
        popupLink.addEventListener('mouseenter', cancelClose);
        popupLink.addEventListener('mouseleave', scheduleClose);

        markersRef.current.push(
          new Marker({ element: markerButton, anchor: 'bottom' })
            .setLngLat(markerPoint)
            .addTo(map),
        );
      }
    });

    return () => {
      cancelled = true;
      if (closePopupOnMapClick) map.off('click', closePopupOnMapClick);
    };
  }, [ready, userCenter, visibleRooms]);

  const areaLabel =
    centerMode === 'nearby' && userCenter
      ? 'vị trí của bạn'
      : selectedCity
        ? selectedCity
        : 'các khu vực nổi bật';

  return (
    <div className="relative h-full min-h-[260px] overflow-hidden rounded-xl bg-brand-50 sm:min-h-[320px] lg:min-h-[380px]">
      <div ref={containerRef} className="h-full w-full" />
      {mapError ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-brand-50/95 px-6 text-center">
          <div className="max-w-xs rounded-xl border border-zinc-200 bg-white/95 px-4 py-3 shadow-card">
            <p className="text-sm font-medium text-zinc-800">Không thể tải bản đồ</p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Bạn vẫn có thể dùng bộ lọc và xem danh sách phòng bình thường.
            </p>
          </div>
        </div>
      ) : !ready ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-brand-50/90 backdrop-blur-[1px]">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/95 px-3 py-2 text-xs font-medium text-zinc-600 shadow-card">
            <LoaderCircle className="h-4 w-4 animate-spin text-brand-600" aria-hidden />
            Đang tải bản đồ…
          </div>
        </div>
      ) : null}
      <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-md border border-zinc-200 bg-white/95 px-3 py-2 text-xs shadow-card backdrop-blur-sm">
        <p className="font-medium text-zinc-900">Bản đồ tìm phòng</p>
        <p className="mt-0.5 text-zinc-500">
          {hasRadiusCenter
            ? `Bán kính ${radiusKm} km quanh ${areaLabel}`
            : selectedCity
              ? `Đang xem tin đăng tại ${areaLabel}`
              : 'Chọn tỉnh hoặc dùng gần tôi'}
        </p>
      </div>
    </div>
  );
}
