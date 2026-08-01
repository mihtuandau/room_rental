'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ProvinceOption } from '@/features/locations/api';
import { useWards } from '@/features/locations/hooks';
import type { SearchState } from '@/features/rooms/search-params';

// Radix Select forbids an empty item value, so "no filter" uses a sentinel.
const ALL = '__all__';

/**
 * The single, always-visible search surface: province → ward → keyword. It
 * writes the same URL state the results read, so it's editable right where the
 * results are — no jumping back to a hero. Price/type/area/amenities are the
 * "Bộ lọc" refinements, kept separate on purpose.
 */
export function SearchToolbar({
  state,
  provinces,
  onChange,
}: {
  state: SearchState;
  provinces: ProvinceOption[];
  onChange: (patch: Partial<SearchState>) => void;
}) {
  const [keyword, setKeyword] = useState(state.keyword);
  const cityCode = provinces.find((p) => p.value === state.city)?.code;
  const wards = useWards(cityCode);
  const wardOptions = wards.data ?? [];
  const shouldShowCurrentWard =
    Boolean(state.ward) && !wardOptions.some((ward) => ward === state.ward);

  const submitKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    onChange({ keyword: keyword.trim() });
  };

  return (
    <form
      onSubmit={submitKeyword}
      className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-2 shadow-card sm:flex-row sm:items-center"
    >
      <Select
        value={state.city || ALL}
        onValueChange={(v) =>
          // Changing province invalidates the ward, so clear it.
          onChange({
            city: v === ALL ? '' : v,
            ward: '',
            mode: 'area',
            lat: null,
            lng: null,
            radiusKm: null,
          })
        }
      >
        <SelectTrigger
          className="border-0 shadow-none sm:w-40"
          aria-label="Tỉnh, thành phố"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Toàn quốc</SelectItem>
          {provinces.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="hidden h-6 w-px bg-zinc-200 sm:block" aria-hidden />

      <Select
        value={state.ward || ALL}
        onValueChange={(v) =>
          onChange({
            ward: v === ALL ? '' : v,
            mode: 'area',
            lat: null,
            lng: null,
            radiusKm: null,
          })
        }
        disabled={!state.city}
      >
        <SelectTrigger
          className="border-0 shadow-none sm:w-40"
          aria-label="Phường, xã"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Tất cả phường/xã</SelectItem>
          {shouldShowCurrentWard ? (
            <SelectItem value={state.ward}>
              {state.ward}
            </SelectItem>
          ) : null}
          {wardOptions.map((w) => (
            <SelectItem key={w} value={w}>
              {w}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="hidden h-6 w-px bg-zinc-200 sm:block" aria-hidden />

      <Input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="Tên đường, khu vực, từ khoá…"
        aria-label="Từ khoá"
        className="flex-1 border-0 shadow-none focus:ring-0"
      />

      <Button type="submit" className="shrink-0">
        <Search className="h-4 w-4" aria-hidden />
        Tìm
      </Button>
    </form>
  );
}
