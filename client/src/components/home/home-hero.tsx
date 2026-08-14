'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
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
import {
  fetchDistricts,
  fetchWards,
  type ProvinceOption,
} from '@/features/locations/api';
import { isSearchExpanded, searchParsers } from '@/features/rooms/search-params';
import { PRICE_RANGE_OPTIONS, RADIUS_OPTIONS } from '@/lib/constants';

const ALL = '__all__';
const DEFAULT_RADIUS_KM = 3;
const HERO_IMAGES = [
  { src: '/banner.png', alt: 'Phòng sáng thoáng với ban công nhiều ánh sáng' },
  { src: '/room1.jpg', alt: 'Phòng có gác và khu bếp nhỏ gọn' },
  { src: '/room3.jpg', alt: 'Không gian phòng có gác và nội thất tiện nghi' },
] as const;
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
  const [locationMessage, setLocationMessage] = useState('');
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const [flippingIndex, setFlippingIndex] = useState<number | null>(null);
  const [radiusKm, setRadiusKm] = useState(urlState.radiusKm ?? DEFAULT_RADIUS_KM);
  const [priceRangeValue, setPriceRangeValue] = useState(
    PRICE_RANGE_OPTIONS.find(
      (p) => p.priceMin === urlState.priceMin && p.priceMax === urlState.priceMax,
    )?.value ?? ALL,
  );

  const handleFlipNext = useCallback(() => {
    if (flippingIndex !== null) return;
    const current = heroImageIndex;

    setFlippingIndex(current);
    setHeroImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);

    setTimeout(() => {
      setFlippingIndex(null);
    }, 650);
  }, [flippingIndex, heroImageIndex]);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduceMotion.matches) return;

    const timer = window.setInterval(() => {
      handleFlipNext();
    }, 5_500);

    return () => window.clearInterval(timer);
  }, [handleFlipNext]);

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
      className="relative isolate scroll-mt-20 overflow-visible bg-gradient-to-b from-brand-50/50 via-brand-50/30 to-surface-page pb-8 pt-8 sm:pb-12 sm:pt-12 lg:min-h-[560px] lg:py-14"
    >
      <div className="mx-auto flex flex-col w-full max-w-7xl px-4 sm:px-6 lg:grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center lg:gap-12">
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

          <div className="order-3 z-10 -mt-8 px-1 sm:-mt-12 lg:mt-6 lg:px-0">
            <form
              className="rounded-xl border border-border-strong bg-surface-card p-3 shadow-card sm:p-5"
              onSubmit={(event) => {
                event.preventDefault();
                submit();
              }}
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-3 sm:mb-0">
                <div>
                  <p className="text-sm font-medium text-zinc-900">Bạn muốn tìm ở đâu?</p>
                  <p className="mt-1 hidden text-xs text-zinc-500 sm:block">
                    Tìm theo khu vực hoặc trong bán kính quanh vị trí hiện tại.
                  </p>
                </div>
                <Button
                  type="button"
                  variant={centerMode === 'nearby' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={useNearby}
                  className="hidden sm:inline-flex"
                >
                  <LocateFixed className="h-4 w-4" aria-hidden />
                  Gần tôi
                </Button>
              </div>

            {centerMode === 'nearby' && userCenter ? (
              <div className="mb-3 mt-0 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 sm:mb-0 sm:mt-3">
                <LocateFixed className="h-3.5 w-3.5" aria-hidden />
                Đã ghim vị trí của bạn trên bản đồ
              </div>
            ) : null}

            <div className="mt-0 flex flex-row items-center gap-2 sm:mt-4 sm:grid sm:gap-3 lg:grid-cols-[minmax(0,1fr)_10rem_auto] lg:items-end">
              <Field className="flex-1 sm:flex-none" label="Từ khóa hoặc khu vực" icon={<Search className="h-4 w-4" aria-hidden />}>
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
                <button
                  type="button"
                  onClick={useNearby}
                  className={`absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 sm:hidden ${
                    centerMode === 'nearby' ? 'bg-brand-50 text-brand-600' : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600'
                  }`}
                  aria-label="Tìm quanh đây"
                  title="Tìm quanh đây"
                >
                  <LocateFixed className="h-4 w-4" aria-hidden />
                </button>
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
                    <SelectTrigger aria-label="Bán kính tìm kiếm" className="h-10 w-[100px] whitespace-nowrap sm:h-11 sm:w-full">
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
                    <SelectTrigger aria-label="Mức giá" className="h-10 w-[100px] whitespace-nowrap sm:h-11 sm:w-full">
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

              <Button type="submit" aria-label="Tìm" className="h-10 w-10 shrink-0 p-0 sm:h-11 sm:w-auto sm:px-6">
                <Search className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline sm:ml-2">{expanded ? 'Cập nhật' : 'Tìm'}</span>
              </Button>
            </div>
            {locationMessage ? <p className="mt-3 text-xs text-zinc-500">{locationMessage}</p> : null}
            </form>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-6 lg:mt-6">
              {[
                { value: '1,200+', label: 'tin đăng' },
                { value: '100%', label: 'kiểm duyệt' },
                { value: '15+', label: 'quận / huyện' },
                { value: 'Miễn phí', label: 'đăng tin' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-baseline gap-1.5">
                  <span className="text-lg font-semibold tracking-tight text-brand-700 sm:text-xl">{stat.value}</span>
                  <span className="text-xs text-zinc-500">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative order-2 flex flex-col items-center justify-center lg:items-end lg:justify-center min-h-[360px] w-full sm:min-h-[460px] lg:h-[540px] p-2 sm:p-4">
          {/* Ambient Warm Glow Accent behind Polaroid Stack */}
          <div className="absolute inset-x-8 inset-y-6 z-0 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

          {/* Polaroid Vintage Stack Container (Enlarged Size) */}
          <div
            onClick={handleFlipNext}
            title="Bấm để lật xem ảnh tiếp theo"
            className="group/polaroid relative h-[330px] sm:h-[420px] lg:h-[490px] w-full max-w-[520px] cursor-pointer select-none [perspective:1500px]"
          >
            {/* Page 3: Deep Stack Polaroid (Bottom) */}
            <div className="absolute inset-0 z-0 -translate-x-8 sm:-translate-x-10 translate-y-3.5 -rotate-[5deg] scale-[0.93] rounded-2xl bg-white p-2.5 pb-6 sm:p-3 sm:pb-7 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] ring-1 ring-zinc-900/10 opacity-100 transition-all duration-300 group-hover/polaroid:-translate-x-12">
              <div className="relative h-full w-full overflow-hidden rounded-xl bg-zinc-900">
                <Image
                  src={HERO_IMAGES[(heroImageIndex + 2) % HERO_IMAGES.length].src}
                  alt=""
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Page 2: Middle Stack Polaroid (Peeking) */}
            <div className="absolute inset-0 z-10 -translate-x-4 sm:-translate-x-5 translate-y-2 -rotate-[2.5deg] scale-[0.96] rounded-2xl bg-white p-2.5 pb-6 sm:p-3 sm:pb-7 shadow-[0_25px_45px_-12px_rgba(0,0,0,0.24)] ring-1 ring-zinc-900/10 opacity-100 transition-all duration-300 group-hover/polaroid:-translate-x-7">
              {/* Translucent Washi Tape Strip on Middle Card */}
              <div className="absolute -top-3.5 right-12 z-50 h-7 w-26 rotate-[6deg] bg-amber-100/80 border-y border-amber-300/50 backdrop-blur-[3px] shadow-[0_2px_4px_rgba(0,0,0,0.08)] pointer-events-none" />
              
              <div className="relative h-full w-full overflow-hidden rounded-xl bg-zinc-900">
                <Image
                  src={HERO_IMAGES[(heroImageIndex + 1) % HERO_IMAGES.length].src}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>

            {/* Page 1: Primary Active Polaroid Card */}
            <div className="absolute inset-0 z-20 rounded-2xl bg-white p-2.5 pb-6 sm:p-3 sm:pb-7 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.28)] ring-1 ring-zinc-900/10 transition-transform duration-300 group-hover/polaroid:scale-[1.01]">
              {/* Translucent Textured Washi Tape Strip on Top Polaroid */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-50 h-8 w-32 -rotate-[2.5deg] bg-amber-50/90 border-y border-amber-200/80 backdrop-blur-[3px] shadow-[0_2px_6px_rgba(0,0,0,0.08)] pointer-events-none flex items-center justify-center">
                <div className="h-full w-full bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:6px_6px] opacity-10" />
              </div>

              {/* Photo Viewport with inner photo shadow stroke */}
              <div className="relative h-full w-full overflow-hidden rounded-xl bg-zinc-900 shadow-inner">
                <Image
                  src={HERO_IMAGES[heroImageIndex].src}
                  alt={HERO_IMAGES[heroImageIndex].alt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            </div>

            {/* Exiting 3D Oblique Page Turn Overlay */}
            {flippingIndex !== null && (
              <div
                key={`flipping-${flippingIndex}`}
                className="absolute inset-0 z-40 rounded-2xl bg-white p-2.5 pb-6 sm:p-3 sm:pb-7 shadow-2xl ring-1 ring-zinc-900/10 animate-page-flip-right pointer-events-none [transform-origin:right_center]"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-50 h-8 w-32 -rotate-[2.5deg] bg-amber-50/90 border-y border-amber-200/80 backdrop-blur-[3px] shadow-[0_2px_6px_rgba(0,0,0,0.08)] pointer-events-none" />

                <div className="relative h-full w-full overflow-hidden rounded-xl bg-zinc-900">
                  <Image
                    src={HERO_IMAGES[flippingIndex].src}
                    alt=""
                    fill
                    priority
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover"
                  />
                  {/* Realistic Book Crease Shadow Overlay for Right Flip */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-black/40 via-transparent to-black/20" />
                </div>
              </div>
            )}
          </div>

          {/* Minimalist Dots Bar */}
          <div className="mt-6 flex items-center gap-2 z-30">
            {HERO_IMAGES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setHeroImageIndex(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === heroImageIndex ? 'w-6 bg-brand-600' : 'w-2 bg-zinc-300 hover:bg-zinc-400'
                }`}
                aria-label={`Xem ảnh ${i + 1}`}
              />
            ))}
          </div>
        </div>
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
