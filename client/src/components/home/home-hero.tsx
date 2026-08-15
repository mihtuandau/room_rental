'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { CircleDotDashed, LocateFixed, LoaderCircle, Search } from 'lucide-react';
import { useQueryStates } from 'nuqs';
import { REASONS } from '@/components/home/why-choose-us';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  fetchDistricts,
  fetchWards,
  type ProvinceOption,
} from '@/features/locations/api';
import { isSearchExpanded, searchParsers } from '@/features/rooms/search-params';
import { RADIUS_OPTIONS } from '@/lib/constants';

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
}: {
  provinces: ProvinceOption[];
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
  const [isLocating, setIsLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [radiusKm, setRadiusKm] = useState(urlState.radiusKm ?? DEFAULT_RADIUS_KM);

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

    setUrlState({
      keyword: matchedProvince ? '' : typedLocation,
      city: matchedProvince?.value ?? override?.city ?? city,
      district: nextMode === 'nearby' ? (override?.district ?? urlState.district) : '',
      ward: nextMode === 'nearby' ? (override?.ward ?? urlState.ward) : '',
      roomType: urlState.roomType,
      priceMin: null,
      priceMax: null,
      mode: nextMode === 'nearby' ? 'nearby' : 'area',
      lat: nextMode === 'nearby' && nextCenter ? String(nextCenter[1]) : null,
      lng: nextMode === 'nearby' && nextCenter ? String(nextCenter[0]) : null,
      radiusKm: nextMode === 'nearby' ? nextRadiusKm : null,
      all: true,
      page: 1,
    });
  };

  const useNearby = () => {
    if (isLocating) return;

    if (!navigator.geolocation) {
      setLocationMessage('Trình duyệt chưa hỗ trợ lấy vị trí hiện tại.');
      return;
    }

    setIsLocating(true);
    setLocationMessage('Đang lấy vị trí của bạn…');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextCenter: [number, number] = [position.coords.longitude, position.coords.latitude];
        let detectedCity = '';
        let detectedDistrict = '';
        let detectedWard = '';

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

        // Apply the nearby layout only after location lookup is complete. This
        // avoids an intermediate render where the form reflows before the
        // nearby search state is ready.
        setCenterMode('nearby');
        setUserCenter(nextCenter);
        setRadiusKm(DEFAULT_RADIUS_KM);
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
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        setLocationMessage('Chưa lấy được vị trí. Bạn có thể nhập khu vực để tìm.');
      },
      // Do not reuse a stale location when the user explicitly presses "Gần tôi".
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 0 },
    );
  };

  return (
    <section
      id="tim-phong"
      className="relative isolate scroll-mt-20 overflow-visible bg-gradient-to-b from-surface-page via-brand-50/20 to-surface-page pb-8 pt-8 sm:pb-12 sm:pt-12 lg:min-h-[624px] lg:py-14"
    >
      <div className="mobile-hero-map pointer-events-none relative -mt-8 mb-6 aspect-[1792/878] w-full overflow-hidden sm:-mt-12 sm:mb-8 lg:hidden" aria-hidden="true">
        <Image
          src="/hero-district-1-map-mobile-top-bottom-fade.png"
          alt=""
          fill
          sizes="100vw"
          className="hero-map-mobile-art object-contain object-center"
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-0 hidden overflow-hidden lg:block" aria-hidden="true">
        <div className="hero-map-background absolute -right-[20%] top-28 aspect-[3/4] w-[94%] sm:-right-[12%] sm:top-20 sm:w-[76%] lg:right-0 lg:top-0 lg:aspect-[1717/916] lg:w-[min(88%,1168px)]">
          <Image
            src="/hero-district-1-map.png"
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 82vw, 105vw"
            className="hero-map-art object-contain object-right"
          />
        </div>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-4 sm:px-6 lg:min-h-[512px] lg:grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center lg:gap-12">
        <div className="contents lg:block lg:max-w-xl">
          <div className="order-1 pb-5 lg:pb-0">
            <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl">
              Tìm phòng nhanh hơn,
              <span className="block text-brand-700">sống an tâm mỗi ngày.</span>
            </h1>
            <p className="mt-3 max-w-prose text-base leading-7 text-zinc-600">
              Nhập khu vực hoặc chọn <span className="font-medium text-zinc-800">Gần tôi</span> để xem tin đăng phù hợp.
            </p>
          </div>

          <div className="order-3 z-10 mt-4 px-1 sm:mt-6 lg:mt-6 lg:px-0">
            <form
              className="rounded-xl border border-border-subtle bg-surface-card p-3 shadow-card sm:p-5"
              onSubmit={(event) => {
                event.preventDefault();
                submit();
              }}
            >
              <div className="mb-2 sm:mb-0">
                <div>
                  <p className="text-sm font-medium text-zinc-900">Bạn muốn tìm ở đâu?</p>
                  <p className="mt-1 hidden text-xs text-zinc-500 sm:block">
                    Tìm theo khu vực hoặc trong bán kính quanh vị trí hiện tại.
                  </p>
                </div>
              </div>

            {centerMode === 'nearby' && userCenter ? (
              <div className="mb-3 mt-0 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 sm:mb-0 sm:mt-3">
                <LocateFixed className="h-3.5 w-3.5" aria-hidden />
                Đã ghim vị trí của bạn trên bản đồ
              </div>
            ) : null}

            <div className="mt-0 flex flex-row items-end gap-2 sm:mt-4 sm:gap-3">
              <Field className="min-w-0 flex-1" label="Từ khóa hoặc khu vực" icon={<Search className="h-4 w-4" aria-hidden />}>
                <div className="relative">
                <Input
                  aria-label="Từ khóa hoặc khu vực"
                  value={keyword}
                  onFocus={() => setShowLocationSuggestions(true)}
                  onBlur={() => window.setTimeout(() => setShowLocationSuggestions(false), 120)}
                  onChange={(event) => {
                    setKeyword(event.target.value);
                    setCenterMode('province');
                    setCity('');
                    setLocationMessage('');
                  }}
                  placeholder="Khu vực, tên đường..."
                  className="h-10 pr-9 sm:h-11 sm:pr-3"
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

              <div className="contents">
                <Button
                  type="button"
                  variant={centerMode === 'nearby' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={useNearby}
                  disabled={isLocating}
                  className="h-10 shrink-0 px-2 sm:h-11 sm:px-3"
                >
                  {isLocating ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <LocateFixed className="h-4 w-4" aria-hidden />
                  )}
                  <span>Gần tôi</span>
                </Button>

                {centerMode === 'nearby' ? (
                  <Field className="min-w-0 flex-1 sm:flex-none" label="Bán kính" icon={<CircleDotDashed className="h-4 w-4" aria-hidden />}>
                    <Select value={String(radiusKm)} onValueChange={(value) => setRadiusKm(Number(value))}>
                      <SelectTrigger aria-label="Bán kính tìm kiếm" className="h-10 w-full whitespace-nowrap sm:h-11 sm:w-32">
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
                ) : null}

                <Button type="submit" aria-label="Tìm" className="h-10 w-10 shrink-0 p-0 sm:h-11 sm:w-auto sm:px-6">
                  <Search className="h-4 w-4" aria-hidden />
                  <span className="hidden sm:inline sm:ml-2">{expanded ? 'Cập nhật' : 'Tìm'}</span>
                </Button>
              </div>
            </div>
            {locationMessage ? <p className="mt-3 text-xs text-zinc-500">{locationMessage}</p> : null}
            </form>

            <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-3 sm:gap-4">
              {REASONS.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex items-start gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <p className="font-heading text-sm font-medium text-zinc-900">{title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-500">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="hidden lg:block" aria-hidden="true" />
      </div>

    </section>
  );
}

function Field({
  label,
  icon,
  className,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`min-w-0 text-left ${className ?? ''}`}>
      <span className="mb-1.5 hidden items-center gap-1.5 text-xs font-medium text-zinc-600 sm:flex">
        {icon}
        {label}
      </span>
      {children}
    </div>
  );
}
