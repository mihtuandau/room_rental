'use client';

import { useMemo, useState } from 'react';
import { Banknote, CircleDotDashed, LocateFixed, Search, ShieldCheck } from 'lucide-react';
import { useQueryStates } from 'nuqs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { RoomCardItem } from '@/components/rooms/room-card';
import { fetchWards, type ProvinceOption } from '@/features/locations/api';
import { useRoomsSearch } from '@/features/rooms/hooks';
import { isSearchExpanded, searchParsers, toSearchParams } from '@/features/rooms/search-params';
import { PRICE_RANGE_OPTIONS, RADIUS_OPTIONS } from '@/lib/constants';
import { HomeMap } from './home-map';

const ALL = '__all__';
const DEFAULT_RADIUS_KM = 3;
type SearchCenterMode = 'province' | 'nearby';

interface ReverseGeocodeResponse {
  display_name?: string;
  address?: {
    road?: string;
    pedestrian?: string;
    residential?: string;
    city_block?: string;
    borough?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    state_district?: string;
    province?: string;
    municipality?: string;
    county?: string;
    district?: string;
    suburb?: string;
    quarter?: string;
    neighbourhood?: string;
    city_district?: string;
  };
}

function stripPlacePrefix(value: string) {
  return value
    .replace(
      /^(Thành phố|Thanh pho|Tỉnh|Tinh|Phường|Phuong|Xã|Xa|Thị trấn|Thi tran|Quận|Quan|Huyện|Huyen)\s+/iu,
      '',
    )
    .trim();
}

function normalizePlaceName(value: string) {
  return stripPlacePrefix(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function matchByName<T extends string>(rawValues: (string | undefined)[], options: readonly T[]) {
  const normalizedValues = rawValues
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => normalizePlaceName(value));
  const normalizedOptions = options.map((option) => ({
    option,
    normalized: normalizePlaceName(option),
  }));

  for (const normalized of normalizedValues) {
    const exact = normalizedOptions.find(({ normalized: optionName }) => optionName === normalized);
    if (exact) return exact.option;
  }

  for (const normalized of normalizedValues) {
    const contains = normalizedOptions.find(({ normalized: optionName }) => {
      if (!optionName || !normalized) return false;
      return normalized.includes(optionName) || optionName.includes(normalized);
    });
    if (contains) return contains.option;
  }

  return '';
}

async function reverseGeocodeLocation([longitude, latitude]: [number, number]) {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(latitude),
    lon: String(longitude),
    zoom: '18',
    addressdetails: '1',
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
    headers: { Accept: 'application/json', 'Accept-Language': 'vi' },
  });
  if (!response.ok) throw new Error('Reverse geocoding failed');
  return (await response.json()) as ReverseGeocodeResponse;
}

async function resolveNearbyPlace(center: [number, number], provinces: ProvinceOption[]) {
  const result = await reverseGeocodeLocation(center);
  const address = result.address;
  const province = matchByName(
    [
      address?.city,
      address?.town,
      address?.village,
      address?.state,
      address?.province,
      address?.municipality,
      address?.county,
      address?.state_district,
      address?.district,
      result.display_name,
    ],
    provinces.map((provinceOption) => provinceOption.value),
  );
  const provinceOption = provinces.find((option) => option.value === province);
  const wards = await fetchWards(provinceOption?.code);
  const ward = matchByName(
    [
      address?.suburb,
      address?.quarter,
      address?.neighbourhood,
      address?.city_district,
      address?.borough,
      address?.city_block,
      address?.residential,
      address?.pedestrian,
      address?.road,
      address?.village,
      address?.town,
      address?.county,
      address?.district,
      result.display_name,
    ],
    wards,
  );

  return { city: province, ward };
}

export function HomeHero({
  provinces,
  rooms,
  totalRooms = 0,
}: {
  provinces: ProvinceOption[];
  rooms: RoomCardItem[];
  totalRooms?: number;
}) {
  const [urlState, setUrlState] = useQueryStates(searchParsers, {
    history: 'push',
    shallow: true,
  });

  const [city, setCity] = useState(urlState.city);
  const [keyword, setKeyword] = useState(urlState.keyword);
  const [centerMode, setCenterMode] = useState<SearchCenterMode>(
    urlState.mode === 'nearby' ? 'nearby' : 'province',
  );
  const [userCenter, setUserCenter] = useState<[number, number] | null>(
    urlState.lng && urlState.lat ? [Number(urlState.lng), Number(urlState.lat)] : null,
  );
  const [locationMessage, setLocationMessage] = useState('');
  const [radiusKm, setRadiusKm] = useState(urlState.radiusKm ?? DEFAULT_RADIUS_KM);
  const [priceRangeValue, setPriceRangeValue] = useState(
    PRICE_RANGE_OPTIONS.find(
      (p) => p.priceMin === urlState.priceMin && p.priceMax === urlState.priceMax,
    )?.value ?? ALL,
  );
  const expanded = isSearchExpanded(urlState);
  const liveSearchParams = useMemo(() => toSearchParams(urlState), [urlState]);
  const liveSearch = useRoomsSearch(liveSearchParams);
  const currentRooms = expanded ? (liveSearch.data?.rooms ?? rooms) : rooms;
  const currentTotalRooms = expanded ? (liveSearch.data?.total ?? totalRooms) : totalRooms;

  // The results view owns the search controls once a search is expanded.
  // Avoid rendering a second hero form and map above the results toolbar.
  if (expanded) return null;

  const submit = (
    override?: {
      center?: [number, number];
      city?: string;
      ward?: string;
      mode?: SearchCenterMode;
      radiusKm?: number;
    },
  ) => {
    const nextMode = override?.mode ?? centerMode;
    const nextCenter = override?.center ?? userCenter;
    const nextRadiusKm = override?.radiusKm ?? radiusKm;
    if (nextMode === 'nearby' && !nextCenter) {
      setLocationMessage('Bạn cần cho phép lấy vị trí trước khi tìm gần tôi.');
      return;
    }

    const range = PRICE_RANGE_OPTIONS.find((p) => p.value === priceRangeValue);
    setUrlState({
      keyword: keyword.trim(),
      city: override?.city ?? city,
      ward: nextMode === 'nearby' ? (override?.ward ?? urlState.ward) : '',
      roomType: urlState.roomType,
      priceMin: range?.priceMin ?? null,
      priceMax: range?.priceMax ?? null,
      mode: nextMode === 'nearby' ? 'nearby' : 'area',
      lat: nextMode === 'nearby' && nextCenter ? String(nextCenter[1]) : null,
      lng: nextMode === 'nearby' && nextCenter ? String(nextCenter[0]) : null,
      radiusKm: nextMode === 'nearby' ? nextRadiusKm : null,
      all: true,
      page: 1,
    });
  };

  const useNearby = () => {
    if (!navigator.geolocation) {
      setLocationMessage('Trình duyệt chưa hỗ trợ lấy vị trí hiện tại.');
      return;
    }

    setLocationMessage('Đang lấy vị trí của bạn...');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextCenter: [number, number] = [position.coords.longitude, position.coords.latitude];
        let detectedCity = '';
        let detectedWard = '';
        setCenterMode('nearby');
        setUserCenter(nextCenter);
        setRadiusKm(DEFAULT_RADIUS_KM);

        try {
          const place = await resolveNearbyPlace(nextCenter, provinces);
          detectedCity = place.city;
          detectedWard = place.ward;
        } catch {
          detectedCity = '';
          detectedWard = '';
        }

        setCity(detectedCity);
        setLocationMessage(
          detectedCity
            ? `Đã tự chọn khu vực: ${detectedWard ? `${detectedWard}, ` : ''}${detectedCity}.`
            : 'Đã ghim vị trí hiện tại nhưng chưa xác định được tỉnh/phường.',
        );
        submit({
          center: nextCenter,
          city: detectedCity,
          ward: detectedWard,
          mode: 'nearby',
          radiusKm: DEFAULT_RADIUS_KM,
        });
      },
      () => {
        setLocationMessage('Chưa lấy được vị trí. Bạn có thể nhập khu vực để tìm.');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
    );
  };

  return (
    <section
      id="tim-phong"
      className="relative isolate scroll-mt-20 overflow-hidden py-10 sm:py-12"
    >
      <div className="mx-auto grid w-full max-w-7xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:gap-12">
        <div className="max-w-xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            Tin đăng được kiểm duyệt trước khi hiển thị
          </p>
          <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl">
            Tìm phòng nhanh hơn,
            <span className="block text-brand-700">sống an tâm mỗi ngày.</span>
          </h1>
          <p className="mt-4 max-w-prose text-base leading-7 text-zinc-600">
            Nhập khu vực, tên đường hoặc dùng vị trí hiện tại để xem các tin đăng phù hợp.
          </p>

          <form
            className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 shadow-card sm:p-5"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-zinc-900">Bạn muốn tìm ở đâu?</p>
              <Button
                type="button"
                variant={centerMode === 'nearby' ? 'primary' : 'outline'}
                size="sm"
                onClick={useNearby}
              >
                <LocateFixed className="h-4 w-4" aria-hidden />
                Gần tôi
              </Button>
            </div>

            {centerMode === 'nearby' && userCenter ? (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700">
                <LocateFixed className="h-3.5 w-3.5" aria-hidden />
                Đã ghim vị trí của bạn trên bản đồ
              </div>
            ) : null}

            <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_10rem_auto] lg:items-end">
              <Field label="Từ khóa hoặc khu vực" icon={<Search className="h-4 w-4" aria-hidden />}>
                <Input
                  value={keyword}
                  onChange={(event) => {
                    setKeyword(event.target.value);
                    setCenterMode('province');
                    setCity('');
                    setLocationMessage('');
                  }}
                  placeholder="Ví dụ: Hải Châu, Bách Khoa, đường Lê Lợi…"
                  className="mt-1 h-11"
                />
              </Field>

              {centerMode === 'nearby' ? (
                <Field label="Bán kính" icon={<CircleDotDashed className="h-4 w-4" aria-hidden />}>
                  <Select value={String(radiusKm)} onValueChange={(value) => setRadiusKm(Number(value))}>
                    <SelectTrigger className="mt-1 h-11 w-full">
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
                </Field>
              ) : (
                <Field label="Lọc giá" icon={<Banknote className="h-4 w-4" aria-hidden />}>
                  <Select value={priceRangeValue} onValueChange={setPriceRangeValue}>
                    <SelectTrigger className="mt-1 h-11 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>Mọi giá</SelectItem>
                      {PRICE_RANGE_OPTIONS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}

              <Button type="submit" className="h-11 w-full lg:w-auto lg:px-6">
                <Search className="h-4 w-4" aria-hidden />
                {expanded ? 'Cập nhật' : 'Tìm'}
              </Button>
            </div>
            {locationMessage ? <p className="mt-3 text-xs text-zinc-500">{locationMessage}</p> : null}
            <p className="mt-3 text-xs text-zinc-500">
              Hiện có{' '}
              <span className="font-medium text-brand-700">
                {currentTotalRooms.toLocaleString('vi-VN')} tin đăng
              </span>{' '}
              để bạn khám phá.
            </p>
          </form>
        </div>

        <HomeMap
          rooms={currentRooms}
          radiusKm={radiusKm}
          selectedCity=""
          centerMode={centerMode}
          userCenter={userCenter}
        />
      </div>
    </section>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 text-left">
      <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-600">
        {icon}
        {label}
      </span>
      {children}
    </div>
  );
}
