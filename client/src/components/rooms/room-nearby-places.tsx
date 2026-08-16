'use client';

import { useMemo, useState } from 'react';
import {
  Bus,
  ChevronDown,
  ChevronUp,
  Footprints,
  GraduationCap,
  Hospital,
  MapPin,
  Navigation,
  RotateCw,
  ShoppingBag,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNearbyPlaces } from '@/features/places/hooks';
import type { PlaceCategory } from '@/features/places/api';
import { cn } from '@/lib/utils';

interface CategoryFilter {
  key: PlaceCategory;
  label: string;
  icon: LucideIcon;
}

const CATEGORY_FILTERS: CategoryFilter[] = [
  { key: 'all', label: 'Tất cả', icon: MapPin },
  { key: 'education', label: 'Giáo dục', icon: GraduationCap },
  { key: 'shopping', label: 'Mua sắm & Chợ', icon: ShoppingBag },
  { key: 'health', label: 'Y tế', icon: Hospital },
  { key: 'transit', label: 'Giao thông', icon: Bus },
];

function getCategoryIcon(category: PlaceCategory): LucideIcon {
  switch (category) {
    case 'education':
      return GraduationCap;
    case 'shopping':
      return ShoppingBag;
    case 'health':
      return Hospital;
    case 'transit':
      return Bus;
    default:
      return MapPin;
  }
}

const INITIAL_VISIBLE_COUNT = 8;

export function RoomNearbyPlaces({
  latitude,
  longitude,
  address,
}: {
  latitude: number | null;
  longitude: number | null;
  address?: string;
}) {
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory>('all');
  const [showAll, setShowAll] = useState(false);

  const { data: places = [], isPending, isError, refetch, isFetching } = useNearbyPlaces(
    latitude,
    longitude,
    address,
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<PlaceCategory, number> = {
      all: places.length,
      education: 0,
      shopping: 0,
      health: 0,
      transit: 0,
      other: 0,
    };
    for (const place of places) {
      if (counts[place.category] !== undefined) {
        counts[place.category]++;
      }
    }
    return counts;
  }, [places]);

  const filteredPlaces = useMemo(() => {
    if (selectedCategory === 'all') return places;
    return places.filter((place) => place.category === selectedCategory);
  }, [places, selectedCategory]);

  const displayedPlaces = useMemo(() => {
    if (showAll) return filteredPlaces;
    return filteredPlaces.slice(0, INITIAL_VISIBLE_COUNT);
  }, [filteredPlaces, showAll]);

  const googleMapsExploreUrl =
    latitude != null && longitude != null
      ? `https://www.google.com/maps/search/truong+hoc+benh+vien+cho/@${latitude},${longitude},15z`
      : `https://www.google.com/maps/search/${encodeURIComponent(address ?? 'tien ich xung quanh')}`;

  if (latitude == null && longitude == null && !address) {
    return null;
  }

  return (
    <div className="space-y-4 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-heading text-base sm:text-lg font-bold tracking-tight text-zinc-900">
            Tiện ích xung quanh
          </h3>
          <p className="text-xs text-zinc-500">
            Trong bán kính 2 km
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-8 px-2 text-xs text-zinc-500 hover:text-zinc-900"
        >
          <RotateCw className={cn('h-3.5 w-3.5 mr-1.5', isFetching && 'animate-spin')} />
          Làm mới
        </Button>
      </div>

      {/* Category Filter Pills styled with brand color when active */}
      {!isPending && !isError && places.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {CATEGORY_FILTERS.map((cat) => {
            const count = categoryCounts[cat.key];
            if (cat.key !== 'all' && count === 0) return null;
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.key;

            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.key);
                  setShowAll(false);
                }}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all',
                  isActive
                    ? 'bg-brand-700 text-white shadow-xs'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{cat.label}</span>
                <span
                  className={cn(
                    'ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-semibold tabular-nums',
                    isActive ? 'bg-brand-800/60 text-white' : 'bg-zinc-200/80 text-zinc-600',
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Loading Skeletons */}
      {isPending && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-3.5 animate-pulse"
            >
              <div className="h-10 w-10 shrink-0 rounded-xl bg-zinc-200" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="h-4 w-32 rounded bg-zinc-200" />
                <div className="h-3 w-20 rounded bg-zinc-200" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error Fallback */}
      {isError && (
        <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-5 text-center space-y-3">
          <p className="text-xs text-zinc-600">
            Không tải được danh sách tiện ích. Bạn có thể xem trực tiếp qua Google Maps.
          </p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Thử lại
            </Button>
            <Button size="sm" asChild>
              <a href={googleMapsExploreUrl} target="_blank" rel="noopener noreferrer">
                <Navigation className="h-3.5 w-3.5 mr-1.5" />
                Mở Google Maps
              </a>
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isPending && !isError && places.length === 0 && (
        <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-6 text-center space-y-2.5">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400">
            <MapPin className="h-5 w-5" />
          </div>
          <p className="text-xs text-zinc-600">
            Chưa tìm thấy địa điểm nổi bật trong bán kính 2 km.
          </p>
          <Button variant="outline" size="sm" asChild>
            <a href={googleMapsExploreUrl} target="_blank" rel="noopener noreferrer">
              <Navigation className="h-3.5 w-3.5 mr-1.5 text-brand-700" />
              Khám phá trên Google Maps
            </a>
          </Button>
        </div>
      )}

      {/* Places List Grid */}
      {!isPending && !isError && filteredPlaces.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {displayedPlaces.map((place) => {
              const Icon = getCategoryIcon(place.category);

              return (
                <div
                  key={place.id}
                  className="flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white p-3.5 transition-all hover:border-zinc-300 hover:shadow-xs"
                >
                  {/* Left: Icon */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-brand-700">
                      {place.categoryLabel}
                    </span>
                    <p className="font-heading text-sm font-semibold text-zinc-900 truncate">
                      {place.name}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
                      <span className="font-medium text-zinc-800 tabular-nums">
                        {place.distanceFormatted}
                      </span>
                      <span className="text-zinc-300">·</span>
                      <span className="inline-flex items-center gap-1">
                        <Footprints className="h-3 w-3 text-zinc-400" />
                        {place.walkMinutes} phút đi bộ
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expand / Collapse Button if more than INITIAL_VISIBLE_COUNT */}
          {filteredPlaces.length > INITIAL_VISIBLE_COUNT && (
            <div className="text-center pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAll(!showAll)}
                className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
              >
                {showAll ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5 mr-1" />
                    Thu gọn
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5 mr-1" />
                    Xem thêm {filteredPlaces.length - INITIAL_VISIBLE_COUNT} địa điểm khác
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
