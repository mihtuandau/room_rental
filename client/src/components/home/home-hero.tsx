'use client';

import { useEffect, useMemo, useState } from 'react';
import { Banknote, CircleDotDashed, LocateFixed, Search } from 'lucide-react';
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
import {
  fetchDistricts,
  fetchWards,
  type ProvinceOption,
} from '@/features/locations/api';
import { useRoomsSearch } from '@/features/rooms/hooks';
import { isSearchExpanded, searchParsers, toSearchParams } from '@/features/rooms/search-params';
import { PRICE_RANGE_OPTIONS, RADIUS_OPTIONS } from '@/lib/constants';
import { HomeMap } from './home-map';

const ALL = '__all__';
const DEFAULT_RADIUS_KM = 3;
type SearchCenterMode = 'province' | 'nearby';

function AnimatedStat({
  value,
  label,
  suffix = '',
}: {
  value: number;
  label: string;
  suffix?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startedAt = window.performance.now();
    let frame = 0;
    const animate = (timestamp: number) => {
      const progress = Math.min((timestamp - startedAt) / 900, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(value * eased));
      if (progress < 1) frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [value]);

  return (
    <div className="text-center sm:text-left">
      <p className="text-lg font-bold tabular-nums text-brand-700">
        {displayValue.toLocaleString('vi-VN')}{suffix}
      </p>
      <p className="mt-0.5 text-[11px] text-zinc-500 sm:text-xs">{label}</p>
    </div>
  );
}

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
    hamlet?: string;
    locality?: string;
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

function normalizeDistrictFallback(value: string) {
  if (/^Quận\s+\d+$/iu.test(value.trim())) return value.trim();
  return stripPlacePrefix(value);
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
      address?.state,
      address?.province,
      address?.municipality,
      address?.city,
      address?.town,
      address?.village,
      address?.county,
      address?.state_district,
      address?.district,
      result.display_name,
    ],
    provinces.map((provinceOption) => provinceOption.value),
  );
  const provinceOption = provinces.find((option) => option.value === province);
  const districts = await fetchDistricts(provinceOption?.code);
  const wardCandidates = [
    address?.suburb,
    address?.quarter,
    address?.neighbourhood,
    address?.city_block,
    address?.hamlet,
    address?.locality,
    address?.village,
  ];
  const districtCandidates = [
    address?.city_district,
    address?.state_district,
    address?.district,
    address?.county,
    address?.borough,
  ];
  const districtFallbackCandidates = [
    address?.city_district,
    address?.state_district,
    address?.district,
    address?.county,
    address?.borough,
  ];
  // Prefer the district that owns the reverse-geocoded ward. This prevents
  // ambiguous geocoder strings from pairing a ward with an unrelated district
  // (for example Linh Xuân with Quận 1).
  const districtByWard = districts
    .map((districtOption) => ({
      district: districtOption,
      ward: matchByName(wardCandidates, districtOption.wardNames ?? []),
    }))
    // Numeric wards (e.g. "3") are repeated across many districts and cannot
    // identify a parent district by themselves. Only named wards may provide
    // the fallback district relationship.
    .find(
      (candidate) =>
        Boolean(candidate.ward) &&
        !/^\d+$/u.test(normalizePlaceName(candidate.ward ?? '')),
    );
  const district = districtByWard?.district.value ||
    matchByName(
      districtCandidates,
      districts.map((districtOption) => districtOption.value),
    ) ||
    normalizeDistrictFallback(
      districtFallbackCandidates.find(
        (candidate): candidate is string => Boolean(candidate?.trim()),
      ) ?? '',
    );
  const districtOption = districts.find((option) => option.value === district);
  const wards = await fetchWards(provinceOption?.code, districtOption?.code);
  const matchedWard =
    districtByWard?.ward ||
    matchByName(wardCandidates, wards);
  const fallbackWard = normalizeDistrictFallback(
    wardCandidates.find((candidate): candidate is string => Boolean(candidate?.trim())) ?? '',
  );
  // A numeric ward is ambiguous without its parent district. Do not expose a
  // misleading partial location if the reverse-geocoder omitted that parent.
  const ward =
    matchedWard || (wards.length === 0 && district && !/^\d+$/u.test(normalizePlaceName(fallbackWard)))
      ? matchedWard || fallbackWard
      : '';

  return { city: province, district, ward };
}

export function HomeHero({
  provinces,
  rooms,
}: {
  provinces: ProvinceOption[];
  rooms: RoomCardItem[];
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
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [radiusKm, setRadiusKm] = useState(urlState.radiusKm ?? DEFAULT_RADIUS_KM);
  const [priceRangeValue, setPriceRangeValue] = useState(
    PRICE_RANGE_OPTIONS.find(
      (p) => p.priceMin === urlState.priceMin && p.priceMax === urlState.priceMax,
    )?.value ?? ALL,
  );

  // The header can clear the search URL while this home component stays
  // mounted. Keep the hero's local controls aligned with the canonical URL so
  // returning from results never leaves a stale nearby center or radius behind.
  useEffect(() => {
    const parsedCenter =
      urlState.lat && urlState.lng
        ? [Number(urlState.lng), Number(urlState.lat)] as [number, number]
        : null;
    const hasCoordinates =
      parsedCenter !== null && parsedCenter.every((value) => Number.isFinite(value));
    const frame = window.requestAnimationFrame(() => {
      setCity(urlState.city);
      setKeyword(urlState.keyword);
      setCenterMode(urlState.mode === 'nearby' && hasCoordinates ? 'nearby' : 'province');
      setUserCenter(hasCoordinates ? parsedCenter : null);
      setRadiusKm(urlState.radiusKm ?? DEFAULT_RADIUS_KM);
      setPriceRangeValue(
        PRICE_RANGE_OPTIONS.find(
          (p) => p.priceMin === urlState.priceMin && p.priceMax === urlState.priceMax,
        )?.value ?? ALL,
      );
    });
    return () => window.cancelAnimationFrame(frame);
  }, [
    urlState.city,
    urlState.keyword,
    urlState.lat,
    urlState.lng,
    urlState.mode,
    urlState.priceMax,
    urlState.priceMin,
    urlState.radiusKm,
  ]);
  const expanded = isSearchExpanded(urlState);
  const liveSearchParams = useMemo(() => toSearchParams(urlState), [urlState]);
  const liveSearch = useRoomsSearch(liveSearchParams);
  const currentRooms = expanded ? (liveSearch.data?.rooms ?? rooms) : rooms;
  const locationSuggestions = keyword.trim()
    ? provinces
        .filter((province) => {
          const query = normalizePlaceName(keyword);
          return (
            normalizePlaceName(province.label).includes(query) ||
            normalizePlaceName(province.value).includes(query)
          );
        })
        .slice(0, 6)
    : [];

  // The results view owns the search controls once a search is expanded.
  // Avoid rendering a second hero form and map above the results toolbar.
  if (expanded) return null;

  const submit = (
    override?: {
      center?: [number, number];
      city?: string;
      district?: string;
      ward?: string;
      mode?: SearchCenterMode;
      radiusKm?: number;
    },
  ) => {
    const nextMode = override?.mode ?? centerMode;
    const nextCenter = override?.center ?? userCenter;
    const nextRadiusKm = override?.radiusKm ?? radiusKm;
    const typedLocation = keyword.trim();
    const matchedProvince = provinces.find(
      (province) =>
        normalizePlaceName(province.label) === normalizePlaceName(typedLocation) ||
        normalizePlaceName(province.value) === normalizePlaceName(typedLocation),
    );
    if (nextMode === 'nearby' && !nextCenter) {
      setLocationMessage('Bạn cần cho phép lấy vị trí trước khi tìm gần tôi.');
      return;
    }

    const range = PRICE_RANGE_OPTIONS.find((p) => p.value === priceRangeValue);
    setUrlState({
      keyword: matchedProvince ? '' : typedLocation,
      city: matchedProvince?.value ?? override?.city ?? city,
      district: nextMode === 'nearby' ? (override?.district ?? urlState.district) : '',
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
        let detectedDistrict = '';
        let detectedWard = '';
        setCenterMode('nearby');
        setUserCenter(nextCenter);
        setRadiusKm(DEFAULT_RADIUS_KM);

        try {
          const place = await resolveNearbyPlace(nextCenter, provinces);
          detectedCity = place.city;
          detectedDistrict = place.district;
          detectedWard = place.ward;
        } catch {
          detectedCity = '';
          detectedDistrict = '';
          detectedWard = '';
        }

        setCity(detectedCity);
        setLocationMessage(
          detectedCity
            ? `Đã tự chọn khu vực: ${
                detectedWard ? `${detectedWard}, ` : ''
              }${detectedDistrict ? `${detectedDistrict}, ` : ''}${detectedCity}.`
            : 'Đã ghim vị trí hiện tại nhưng chưa xác định được tỉnh/huyện/phường.',
        );
        submit({
          center: nextCenter,
          city: detectedCity,
          district: detectedDistrict,
          ward: detectedWard,
          mode: 'nearby',
          radiusKm: DEFAULT_RADIUS_KM,
        });
      },
      () => {
        setLocationMessage('Chưa lấy được vị trí. Bạn có thể nhập khu vực để tìm.');
      },
      // Do not reuse a stale location when the user explicitly presses "Gần tôi".
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 0 },
    );
  };

  return (
    <section
      id="tim-phong"
      className="relative isolate scroll-mt-20 overflow-visible bg-gradient-to-b from-brand-50/60 via-white to-zinc-50/30 pb-6 pt-8 sm:pb-10 sm:pt-14 lg:min-h-[500px] lg:py-12"
    >
      {/* Decorative blurred background blobs for premium aesthetic */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-brand-200 to-indigo-300 opacity-25 sm:left-[calc(50%-30rem)] sm:w-[72rem]" />
      </div>
      <div className="absolute inset-x-0 -bottom-40 -z-10 transform-gpu overflow-hidden blur-3xl" aria-hidden="true">
        <div className="relative right-0 aspect-[1155/678] w-[30rem] translate-x-1/3 bg-gradient-to-br from-indigo-200 to-brand-300 opacity-20 sm:w-[50rem]" />
      </div>

      <div className="mx-auto grid w-full max-w-7xl items-center gap-6 px-4 sm:px-6 lg:grid-cols-2 lg:gap-10">
        <div className="max-w-xl">
          <h1 className="mt-4 text-balance text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl">
            Tìm phòng nhanh hơn,
            <span className="block text-brand-700">sống an tâm mỗi ngày.</span>
          </h1>
          <p className="mt-3 max-w-prose text-base leading-7 text-zinc-600">
            Nhập khu vực hoặc chọn <span className="font-medium text-zinc-800">Gần tôi</span> để xem tin đăng phù hợp.
          </p>

          <form
            className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 shadow-card sm:p-5"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-zinc-900">Bạn muốn tìm ở đâu?</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Tìm theo khu vực hoặc trong bán kính quanh vị trí hiện tại.
                </p>
              </div>
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
                <div className="relative mt-1">
                <Input
                  value={keyword}
                  onFocus={() => setShowLocationSuggestions(true)}
                  onBlur={() => window.setTimeout(() => setShowLocationSuggestions(false), 120)}
                  onChange={(event) => {
                    setKeyword(event.target.value);
                    setCenterMode('province');
                    setCity('');
                    setLocationMessage('');
                  }}
                  placeholder="Ví dụ: Hải Châu, Bách Khoa, đường Lê Lợi…"
                  className="h-11"
                />
                {showLocationSuggestions && locationSuggestions.length > 0 ? (
                  <div className="absolute inset-x-0 top-[calc(100%+0.35rem)] z-30 overflow-hidden rounded-lg border border-zinc-200 bg-white p-1 text-left shadow-popover">
                    {locationSuggestions.map((province) => (
                      <button
                        key={province.value}
                        type="button"
                        className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-zinc-700 hover:bg-brand-50 hover:text-brand-700 focus-visible:bg-brand-50 focus-visible:outline-none"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setKeyword(province.label);
                          setCity(province.value);
                          setCenterMode('province');
                          setShowLocationSuggestions(false);
                        }}
                      >
                        {province.label}
                      </button>
                    ))}
                  </div>
                ) : null}
                </div>
              </Field>

              {centerMode === 'nearby' ? (
                <Field label="Bán kính" icon={<CircleDotDashed className="h-4 w-4" aria-hidden />}>
                  <Select value={String(radiusKm)} onValueChange={(value) => setRadiusKm(Number(value))}>
                    <SelectTrigger aria-label="Bán kính tìm kiếm" className="mt-1 h-11 w-full">
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
                    <SelectTrigger aria-label="Mức giá" className="mt-1 h-11 w-full">
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
          </form>

          <div className="mt-5 grid grid-cols-3 divide-x divide-zinc-200 border-t border-zinc-200/80 pt-4">
            <div className="pr-3 text-center sm:text-left">
              <AnimatedStat value={rooms.length} label="tin đang hiển thị" suffix="+" />
            </div>
            <div className="px-3 text-center sm:text-left">
              <AnimatedStat value={provinces.length} label="tỉnh, thành phố" />
            </div>
            <div className="pl-3 text-center sm:text-left">
              <AnimatedStat value={0} label="phí đăng tin" suffix=" ₫" />
            </div>
          </div>
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
