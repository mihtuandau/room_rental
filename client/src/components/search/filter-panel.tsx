'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { cn, formatPriceShort } from '@/lib/utils';
import {
  AMENITY_TYPE_LABELS,
  ROOM_TYPE_OPTIONS,
  type AmenityType,
} from '@/lib/constants';
import { useIsSignedIn } from '@/stores/auth-store';
import { useCreateSavedSearch } from '@/features/saved-searches/hooks';
import type { Amenity } from '@/features/amenities/api';
import type { SearchState } from '@/features/rooms/search-params';

interface FilterPanelProps {
  state: SearchState;
  amenities: Amenity[];
  /** Applies a partial change and resets pagination to page 1. */
  onChange: (patch: Partial<SearchState>) => void;
  onClear: () => void;
}

const AMENITY_TYPE_ORDER: AmenityType[] = ['basic', 'utility', 'security', 'nearby'];

// Slider bounds — generous enough to cover the market without making the
// draggable range feel imprecise. Values above the max collapse to "trở lên".
const PRICE_BOUNDS: [number, number] = [0, 20_000_000];
const PRICE_STEP = 500_000;
const AREA_BOUNDS: [number, number] = [0, 100];
const AREA_STEP = 5;

function priceLabel(v: number) {
  return v >= PRICE_BOUNDS[1] ? `${formatPriceShort(v)}+` : formatPriceShort(v);
}
function areaLabel(v: number) {
  return v >= AREA_BOUNDS[1] ? `${v}+ m²` : `${v} m²`;
}

export function FilterPanel({ state, amenities, onChange, onClear }: FilterPanelProps) {
  const router = useRouter();
  const isSignedIn = useIsSignedIn();
  const createSavedSearch = useCreateSavedSearch();

  // Sliders update this local pair live while dragging; onChange (→ the URL)
  // only fires on release (onValueCommit), so dragging doesn't spam the router.
  const [priceRange, setPriceRange] = useState<[number, number]>([
    state.priceMin ?? PRICE_BOUNDS[0],
    state.priceMax ?? PRICE_BOUNDS[1],
  ]);
  const [areaRange, setAreaRange] = useState<[number, number]>([
    state.areaMin ?? AREA_BOUNDS[0],
    state.areaMax ?? AREA_BOUNDS[1],
  ]);

  const commitPrice = ([min, max]: number[]) =>
    onChange({
      priceMin: min <= PRICE_BOUNDS[0] ? null : min,
      priceMax: max >= PRICE_BOUNDS[1] ? null : max,
    });
  const commitArea = ([min, max]: number[]) =>
    onChange({
      areaMin: min <= AREA_BOUNDS[0] ? null : min,
      areaMax: max >= AREA_BOUNDS[1] ? null : max,
    });

  const toggleAmenity = (id: number) => {
    const next = state.amenityIds.includes(id)
      ? state.amenityIds.filter((a) => a !== id)
      : [...state.amenityIds, id];
    onChange({ amenityIds: next });
  };

  const hasActiveFilters =
    !!state.roomType ||
    state.priceMin !== null ||
    state.priceMax !== null ||
    state.areaMin !== null ||
    state.areaMax !== null ||
    state.verifiedOnly ||
    state.amenityIds.length > 0;

  const grouped = AMENITY_TYPE_ORDER.map((type) => ({
    type,
    items: amenities.filter((a) => a.type === type),
  })).filter((g) => g.items.length > 0);

  const handleSaveSearch = () => {
    if (!isSignedIn) {
      router.push(`/login?next=${encodeURIComponent('/')}`);
      return;
    }
    createSavedSearch.mutate(
      {
        city: state.city || undefined,
        ward: state.ward || undefined,
        roomType: state.roomType ?? undefined,
        priceMin: state.priceMin ?? undefined,
        priceMax: state.priceMax ?? undefined,
        areaMin: state.areaMin ?? undefined,
        areaMax: state.areaMax ?? undefined,
      },
      {
        onSuccess: () =>
          toast.success('Đã lưu tìm kiếm. Có tin mới phù hợp sẽ báo cho bạn.'),
        onError: () => toast.error('Không lưu được, thử lại nhé.'),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Bộ lọc nâng cao
        </h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-md text-xs text-brand-700 underline underline-offset-2 hover:text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
          >
            Xoá tất cả
          </button>
        )}
      </div>

      <fieldset className="space-y-3">
        <legend className="mb-1 text-sm font-medium">Giá thuê (đ/tháng)</legend>
        <Slider
          value={priceRange}
          min={PRICE_BOUNDS[0]}
          max={PRICE_BOUNDS[1]}
          step={PRICE_STEP}
          minStepsBetweenThumbs={1}
          onValueChange={(v) => setPriceRange(v as [number, number])}
          onValueCommit={commitPrice}
        />
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-md border border-zinc-200 px-2.5 py-1.5 text-sm tabular-nums">
            {priceLabel(priceRange[0])}
          </span>
          <span className="text-sm text-zinc-400">đến</span>
          <span className="rounded-md border border-zinc-200 px-2.5 py-1.5 text-sm tabular-nums">
            {priceLabel(priceRange[1])}
          </span>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-1 text-sm font-medium">Diện tích (m²)</legend>
        <Slider
          value={areaRange}
          min={AREA_BOUNDS[0]}
          max={AREA_BOUNDS[1]}
          step={AREA_STEP}
          minStepsBetweenThumbs={1}
          onValueChange={(v) => setAreaRange(v as [number, number])}
          onValueCommit={commitArea}
        />
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>Từ {areaLabel(areaRange[0])}</span>
          <span>Đến {areaLabel(areaRange[1])}</span>
        </div>
      </fieldset>

      <div>
        <h3 className="mb-2 text-sm font-medium">Loại phòng</h3>
        <div className="flex flex-wrap gap-2">
          {ROOM_TYPE_OPTIONS.map((type) => {
            const active = state.roomType === type.value;
            return (
              <button
                key={type.value}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  onChange({ roomType: active ? null : type.value })
                }
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2',
                  active
                    ? 'border-brand-600 bg-brand-50 font-medium text-brand-700'
                    : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50',
                )}
              >
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      {grouped.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Tiện ích</h3>
          {grouped.map((group) => (
            <div key={group.type} className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {AMENITY_TYPE_LABELS[group.type]}
              </p>
              <div className="space-y-2">
                {group.items.map((amenity) => {
                  const id = `amenity-${amenity.id}`;
                  return (
                    <label
                      key={amenity.id}
                      htmlFor={id}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <Checkbox
                        id={id}
                        checked={state.amenityIds.includes(amenity.id)}
                        onCheckedChange={() => toggleAmenity(amenity.id)}
                      />
                      {amenity.name}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <h3 className="mb-2 text-sm font-medium">Xác minh</h3>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            aria-pressed={!!state.verifiedOnly}
            onClick={() => onChange({ verifiedOnly: true })}
            className={cn(
              'flex items-center justify-between rounded-md border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2',
              state.verifiedOnly
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50',
            )}
          >
            Chỉ tin đã xác minh
            <ShieldCheck className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            aria-pressed={!state.verifiedOnly}
            onClick={() => onChange({ verifiedOnly: false })}
            className={cn(
              'rounded-md px-4 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2',
              !state.verifiedOnly
                ? 'bg-zinc-100 text-zinc-900'
                : 'text-zinc-500 hover:bg-zinc-50',
            )}
          >
            Tất cả tin đăng
          </button>
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={handleSaveSearch}
        disabled={createSavedSearch.isPending}
      >
        <Bookmark className="h-4 w-4" aria-hidden />
        {createSavedSearch.isPending ? 'Đang lưu…' : 'Lưu tìm kiếm này'}
      </Button>
    </div>
  );
}
