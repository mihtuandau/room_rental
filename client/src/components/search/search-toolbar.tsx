'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, MapPin, Search } from 'lucide-react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DistrictOption, ProvinceOption } from '@/features/locations/api';
import { useDistricts, useWards } from '@/features/locations/hooks';
import type { SearchState } from '@/features/rooms/search-params';
import { RADIUS_OPTIONS } from '@/lib/constants';

// Radix Select forbids an empty item value, so "no filter" uses a sentinel.
const ALL = '__all__';

/**
 * The single, always-visible search surface: province → district → ward → keyword. It
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
  const districts = useDistricts(cityCode);
  const districtCode = districts.data?.find((d) => d.value === state.district)?.code;
  const wards = useWards(cityCode, districtCode);
  const districtOptions = useMemo(() => districts.data ?? [], [districts.data]);
  const wardOptions = wards.data ?? [];
  const shouldShowCurrentDistrict =
    Boolean(state.district) &&
    !districtOptions.some((district) => district.value === state.district);
  const shouldShowCurrentWard =
    Boolean(state.ward) && !wardOptions.some((ward) => ward === state.ward);

  // A reverse-geocoder can return a ward while omitting or mislabelling its
  // parent district. Reconcile the URL against the authoritative district
  // ward lists so an impossible pair (for example Linh Xuân + Quận 1) is
  // corrected as soon as the location data finishes loading.
  useEffect(() => {
    if (districts.isLoading || !state.ward || districtOptions.length === 0) return;
    const normalizedWard = state.ward
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    // Numeric ward names are not globally unique (many districts have a
    // "Phường 3"), so they must never be used to infer a district.
    if (/^\d+$/u.test(normalizedWard)) return;
    const districtForWard = districtOptions.find((district) =>
      district.wardNames?.some(
        (ward) =>
          ward
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase() === normalizedWard,
      ),
    );
    if (districtForWard && districtForWard.value !== state.district) {
      onChange({ district: districtForWard.value, page: 1 });
    }
  }, [districtOptions, districts.isLoading, onChange, state.district, state.ward]);

  const submitKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    onChange({ keyword: keyword.trim() });
  };

  return (
    <form
      onSubmit={submitKeyword}
      className="flex flex-col gap-1.5 rounded-lg border border-zinc-200 bg-white p-1.5 shadow-card sm:flex-row sm:flex-nowrap sm:items-center"
    >
      <LocationPicker
        state={state}
        provinces={provinces}
        districtOptions={districtOptions}
        wardOptions={wardOptions}
        shouldShowCurrentDistrict={shouldShowCurrentDistrict}
        shouldShowCurrentWard={shouldShowCurrentWard}
        districtsLoading={districts.isLoading}
        wardsLoading={wards.isLoading}
        onChange={onChange}
      />

      <span className="hidden h-6 w-px bg-zinc-200 sm:block" aria-hidden />

      {state.mode === 'nearby' ? (
        <>
          <Select
            value={String(state.radiusKm ?? 3)}
            onValueChange={(value) =>
              onChange({ radiusKm: Number(value), mode: 'nearby', page: 1 })
            }
          >
            <SelectTrigger className="border-0 shadow-none sm:w-28" aria-label="Bán kính tìm kiếm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RADIUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="hidden h-6 w-px bg-zinc-200 sm:block" aria-hidden />
        </>
      ) : null}

      <Input
        key={state.keyword}
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

function LocationPicker({
  state,
  provinces,
  districtOptions,
  wardOptions,
  shouldShowCurrentDistrict,
  shouldShowCurrentWard,
  districtsLoading,
  wardsLoading,
  onChange,
}: {
  state: SearchState;
  provinces: ProvinceOption[];
  districtOptions: DistrictOption[];
  wardOptions: string[];
  shouldShowCurrentDistrict: boolean;
  shouldShowCurrentWard: boolean;
  districtsLoading: boolean;
  wardsLoading: boolean;
  onChange: (patch: Partial<SearchState>) => void;
}) {
  const summary =
    [state.ward, state.district, state.city].filter(Boolean).join(', ') ||
    'Chọn khu vực';

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          className="inline-flex h-10 min-w-0 items-center justify-between gap-2 rounded-md px-3 text-left text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 sm:w-48"
          aria-label="Chọn khu vực"
        >
          <span className="flex min-w-0 items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
            <span className="truncate">{summary}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={8}
          className="z-50 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-zinc-200 bg-white p-4 shadow-popover focus:outline-none"
        >
          <div className="mb-3">
            <p className="text-sm font-semibold text-zinc-900">Chọn khu vực</p>
            <p className="mt-1 text-xs text-zinc-500">
              Chọn tỉnh, quận/huyện và phường/xã để lọc chính xác hơn.
            </p>
          </div>

          <div className="space-y-3">
            <Select
              value={state.city || ALL}
              onValueChange={(v) =>
                onChange({
                  city: v === ALL ? '' : v,
                  district: '',
                  ward: '',
                  mode: 'area',
                  lat: null,
                  lng: null,
                  radiusKm: null,
                })
              }
            >
              <SelectTrigger className="w-full" aria-label="Tỉnh, thành phố">
                <SelectValue placeholder="Tỉnh, thành phố" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Toàn quốc</SelectItem>
                {provinces.map((province) => (
                  <SelectItem key={province.value} value={province.value}>
                    {province.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={state.district || ALL}
              onValueChange={(v) =>
                onChange({
                  district: v === ALL ? '' : v,
                  ward: '',
                  mode: 'area',
                  lat: null,
                  lng: null,
                  radiusKm: null,
                })
              }
              disabled={!state.city || districtsLoading}
            >
              <SelectTrigger className="w-full" aria-label="Quận, huyện">
                <SelectValue placeholder="Quận, huyện" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tất cả quận/huyện</SelectItem>
                {shouldShowCurrentDistrict ? (
                  <SelectItem value={state.district}>{state.district}</SelectItem>
                ) : null}
                {districtOptions.map((district) => (
                  <SelectItem key={district.value} value={district.value}>
                    {district.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
              disabled={!state.city || wardsLoading}
            >
              <SelectTrigger className="w-full" aria-label="Phường, xã">
                <SelectValue placeholder="Phường, xã" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tất cả phường/xã</SelectItem>
                {shouldShowCurrentWard ? (
                  <SelectItem value={state.ward}>{state.ward}</SelectItem>
                ) : null}
                {wardOptions.map((ward) => (
                  <SelectItem key={ward} value={ward}>
                    {ward}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
