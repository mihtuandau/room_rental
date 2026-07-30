'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Map as MlMap, Marker } from 'maplibre-gl';
import { LocateFixed, MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OSM_STYLE } from '@/lib/map-style';

const VIETNAM_CENTER: [number, number] = [108.2772, 14.0583];

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface GeocodingResult {
  lat: string;
  lon: string;
  display_name: string;
}

function isValidCoordinates({ latitude, longitude }: Coordinates) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

export function LocationPicker({
  addressQueries,
  autoSearch = false,
  latitude,
  longitude,
  onChange,
  error,
}: {
  addressQueries: string[];
  autoSearch?: boolean;
  latitude?: number;
  longitude?: number;
  onChange: (coordinates: Coordinates) => void;
  error?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const onChangeRef = useRef(onChange);
  const searchAbortRef = useRef<AbortController | null>(null);
  const [ready, setReady] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const hasCoordinates =
    latitude != null &&
    longitude != null &&
    isValidCoordinates({ latitude, longitude });
  const searchQueriesKey = addressQueries.join('\n');

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let cancelled = false;

    void import('maplibre-gl').then(({ Map, NavigationControl }) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = new Map({
        container: containerRef.current,
        style: OSM_STYLE,
        center: hasCoordinates
          ? [longitude, latitude]
          : VIETNAM_CENTER,
        zoom: hasCoordinates ? 16 : 5,
      });
      map.addControl(
        new NavigationControl({ showCompass: false }),
        'top-right',
      );
      map.on('click', (event) => {
        onChangeRef.current({
          latitude: event.lngLat.lat,
          longitude: event.lngLat.lng,
        });
        setStatus('Đã cập nhật vị trí ghim.');
      });
      map.on('load', () => {
        if (!cancelled) setReady(true);
      });
      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      searchAbortRef.current?.abort();
      markerRef.current?.remove();
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // The map is created once. Coordinate changes are handled by the marker
    // effect below without rebuilding the map instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!hasCoordinates) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    if (!map || !ready) return;

    let cancelled = false;
    void import('maplibre-gl').then(({ Marker }) => {
      if (cancelled) return;

      let marker = markerRef.current;
      if (!marker) {
        marker = new Marker({ color: '#00875a', draggable: true })
          .setLngLat([longitude, latitude])
          .addTo(map);
        marker.on('dragend', () => {
          const point = marker?.getLngLat();
          if (!point) return;
          onChangeRef.current({
            latitude: point.lat,
            longitude: point.lng,
          });
          setStatus('Đã cập nhật vị trí ghim.');
        });
        markerRef.current = marker;
      }
      marker.setLngLat([longitude, latitude]);
    });

    return () => {
      cancelled = true;
    };
  }, [hasCoordinates, latitude, longitude, ready]);

  const searchAddress = useCallback(async (source: 'auto' | 'manual') => {
    const queries = searchQueriesKey
      .split('\n')
      .map((query) => query.trim())
      .filter(Boolean);
    if (queries.length === 0) {
      setStatus('Nhập địa chỉ trước khi tìm vị trí trên bản đồ.');
      return;
    }

    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;
    setIsSearching(true);
    setStatus(source === 'auto' ? 'Đang tự động tìm vị trí…' : null);
    try {
      let result: GeocodingResult | undefined;
      let matchedQueryIndex = -1;

      for (let index = 0; index < queries.length; index += 1) {
        if (controller.signal.aborted) return;
        if (index > 0) {
          // Respect the public Nominatim limit while trying a broader fallback.
          await new Promise((resolve) => setTimeout(resolve, 1_100));
        }
        if (controller.signal.aborted) return;

        const params = new URLSearchParams({
          format: 'jsonv2',
          countrycodes: 'vn',
          limit: '1',
          q: queries[index],
        });
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?${params}`,
          {
            headers: {
              Accept: 'application/json',
              'Accept-Language': 'vi',
            },
            signal: controller.signal,
          },
        );
        if (!response.ok) throw new Error('Geocoding request failed');

        [result] = (await response.json()) as GeocodingResult[];
        if (result) {
          matchedQueryIndex = index;
          break;
        }
      }

      if (!result) {
        setStatus(
          'Không tìm thấy địa chỉ. Bạn có thể phóng to bản đồ và chạm để đặt ghim.',
        );
        return;
      }

      const coordinates = {
        latitude: Number(result.lat),
        longitude: Number(result.lon),
      };
      if (!isValidCoordinates(coordinates)) {
        throw new Error('Invalid geocoding coordinates');
      }

      onChangeRef.current(coordinates);
      mapRef.current?.flyTo({
        center: [coordinates.longitude, coordinates.latitude],
        zoom: 16,
      });
      setStatus(
        matchedQueryIndex === 0
          ? `Đã tự động ghim: ${result.display_name}`
          : `Đã ghim theo khu vực gần nhất: ${result.display_name}. Hãy kéo ghim để chỉnh chính xác.`,
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setStatus(
        'Chưa thể tìm địa chỉ lúc này. Bạn vẫn có thể chạm trực tiếp lên bản đồ để đặt ghim.',
      );
    } finally {
      if (searchAbortRef.current === controller) {
        setIsSearching(false);
      }
    }
  }, [searchQueriesKey]);

  useEffect(() => {
    if (!autoSearch || hasCoordinates || searchQueriesKey.length < 3) return;

    const timer = window.setTimeout(() => {
      void searchAddress('auto');
    }, 1_200);
    return () => window.clearTimeout(timer);
  }, [autoSearch, hasCoordinates, searchAddress, searchQueriesKey]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-900">
            Ghim vị trí trên bản đồ
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Tìm theo địa chỉ, sau đó kéo ghim hoặc chạm lên bản đồ để chỉnh.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void searchAddress('manual')}
          disabled={isSearching}
        >
          <Search className="h-4 w-4" aria-hidden />
          {isSearching ? 'Đang tìm…' : 'Tìm trên bản đồ'}
        </Button>
      </div>

      <div className="relative">
        <div
          ref={containerRef}
          role="application"
          aria-label="Bản đồ chọn vị trí tin đăng"
          className="h-72 w-full overflow-hidden rounded-xl border border-zinc-200"
        />
        {!hasCoordinates && (
          <div className="pointer-events-none absolute bottom-3 left-3 right-3 rounded-lg bg-white/95 px-3 py-2 text-xs text-zinc-600 shadow-sm backdrop-blur">
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-brand-700" aria-hidden />
              Chưa có vị trí ghim. Hãy tìm địa chỉ hoặc chạm lên bản đồ.
            </span>
          </div>
        )}
      </div>

      {hasCoordinates && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-brand-700">
          <LocateFixed className="h-4 w-4" aria-hidden />
          Đã chọn vị trí: {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </p>
      )}
      {status && (
        <p role="status" className="text-xs leading-5 text-zinc-600">
          {status}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}
