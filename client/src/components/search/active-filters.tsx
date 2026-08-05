'use client';

import { X } from 'lucide-react';
import { ROOM_TYPE_LABELS } from '@/lib/constants';
import { formatPriceShort } from '@/lib/utils';
import type { Amenity } from '@/features/amenities/api';
import type { SearchState } from '@/features/rooms/search-params';

interface ActiveFiltersProps {
  state: SearchState;
  amenities: Amenity[];
  /** Applies a partial change and resets pagination to page 1. */
  onChange: (patch: Partial<SearchState>) => void;
  onClear: () => void;
}

interface Chip {
  key: string;
  label: string;
  remove: Partial<SearchState>;
}

function priceLabel(min: number | null, max: number | null): string | null {
  if (min !== null && max !== null)
    return `${formatPriceShort(min)} – ${formatPriceShort(max)}`;
  if (min !== null) return `Từ ${formatPriceShort(min)}`;
  if (max !== null) return `Đến ${formatPriceShort(max)}`;
  return null;
}

/**
 * Shows what's currently filtered, so the renter can see their search reflected
 * (and undo any part). This is what makes "did I search or not?" unambiguous.
 */
export function ActiveFilters({
  state,
  amenities,
  onChange,
  onClear,
}: ActiveFiltersProps) {
  const chips: Chip[] = [];

  if (state.mode === 'nearby')
    chips.push({
      key: 'nearby',
      label: state.radiusKm ? `Gần vị trí của bạn (${state.radiusKm} km)` : 'Gần vị trí của bạn',
      remove: { mode: 'area', lat: null, lng: null, radiusKm: null },
    });

  if (state.keyword)
    chips.push({ key: 'keyword', label: `“${state.keyword}”`, remove: { keyword: '' } });
  // Removing an ancestor also clears all finer location levels.
  if (state.city)
    chips.push({
      key: 'city',
      label: state.city,
      remove: { city: '', district: '', ward: '' },
    });
  if (state.district)
    chips.push({
      key: 'district',
      label: state.district,
      remove: { district: '', ward: '' },
    });
  if (state.ward)
    chips.push({ key: 'ward', label: state.ward, remove: { ward: '' } });
  if (state.roomType)
    chips.push({
      key: 'roomType',
      label: ROOM_TYPE_LABELS[state.roomType],
      remove: { roomType: null },
    });

  const price = priceLabel(state.priceMin, state.priceMax);
  if (price)
    chips.push({ key: 'price', label: price, remove: { priceMin: null, priceMax: null } });

  if (state.areaMin !== null || state.areaMax !== null) {
    const label =
      state.areaMin !== null && state.areaMax !== null
        ? `${state.areaMin} – ${state.areaMax} m²`
        : state.areaMin !== null
          ? `Từ ${state.areaMin} m²`
          : `Đến ${state.areaMax} m²`;
    chips.push({ key: 'area', label, remove: { areaMin: null, areaMax: null } });
  }

  if (state.verifiedOnly)
    chips.push({
      key: 'verified',
      label: 'Đã xác minh',
      remove: { verifiedOnly: false },
    });

  for (const id of state.amenityIds) {
    const amenity = amenities.find((a) => a.id === id);
    if (amenity)
      chips.push({
        key: `amenity-${id}`,
        label: amenity.name,
        remove: { amenityIds: state.amenityIds.filter((a) => a !== id) },
      });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onChange(chip.remove)}
          className="inline-flex items-center gap-1.5 rounded-full border border-brand-600 bg-brand-50 py-1 pl-3 pr-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        >
          {chip.label}
          <X className="h-3.5 w-3.5 opacity-70" aria-label={`Bỏ lọc ${chip.label}`} />
        </button>
      ))}

      {chips.length > 1 && (
        <button
          type="button"
          onClick={onClear}
          className="rounded-md px-2 text-sm text-zinc-500 underline underline-offset-4 transition-colors hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
        >
          Xoá tất cả
        </button>
      )}
    </div>
  );
}
