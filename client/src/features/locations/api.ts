import { VN_CITY_OPTIONS } from '@/lib/constants';

export interface ProvinceOption {
  /** Province name snapshot used for display and legacy API compatibility. */
  value: string;
  label: string;
  /** Current province code from the two-tier administrative catalog. */
  code?: number;
}

export interface WardOption {
  /** Bare ward/commune/special-zone name used for display. */
  value: string;
  label: string;
  /** Current ward code used for persistence and filtering. */
  code?: number;
}

/** @deprecated Districts are retained only for legacy URL/address display. */
export interface DistrictOption {
  value: string;
  label: string;
  code?: number;
  wardNames?: string[];
}

interface RawProvince {
  name: string;
  code: number;
  wards?: RawWard[];
}

interface RawWard {
  name: string;
  code: number;
}

function stripUnitPrefix(name: string): string {
  return name.replace(/^(Thành phố|Tỉnh)\s+/u, '').trim();
}

function stripWardPrefix(name: string): string {
  return name.replace(/^(Phường|Xã|Đặc khu)\s+/u, '').trim();
}

/**
 * Fetch the current 34-province catalog. The v2 API models the current
 * province → ward structure; v1 must not be used for new listing filters.
 */
export async function fetchProvinces(): Promise<ProvinceOption[]> {
  try {
    const res = await fetch('https://provinces.open-api.vn/api/v2/p/', {
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!res.ok) return [...VN_CITY_OPTIONS];

    const raw = (await res.json()) as RawProvince[];
    if (!Array.isArray(raw) || raw.length === 0) return [...VN_CITY_OPTIONS];

    return raw
      .map((province) => {
        const bare = stripUnitPrefix(province.name);
        return { value: bare, label: bare, code: province.code };
      })
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
  } catch {
    return [...VN_CITY_OPTIONS];
  }
}

export async function fetchWardOptions(
  provinceCode: number | undefined,
): Promise<WardOption[]> {
  if (!provinceCode) return [];
  try {
    const res = await fetch(
      `https://provinces.open-api.vn/api/v2/p/${provinceCode}?depth=2`,
      { next: { revalidate: 60 * 60 * 24 } },
    );
    if (!res.ok) return [];
    const detail = (await res.json()) as { wards?: RawWard[] };
    return (detail.wards ?? [])
      .map((ward) => {
        const value = stripWardPrefix(ward.name);
        return { value, label: value, code: ward.code };
      })
      .filter((ward) => ward.value.length > 0)
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
  } catch {
    return [];
  }
}

/** Compatibility wrapper for geocoding code that only needs a ward name. */
export async function fetchWards(
  provinceCode: number | undefined,
  _legacyDistrictCode?: number,
): Promise<string[]> {
  void _legacyDistrictCode;
  const wards = await fetchWardOptions(provinceCode);
  return wards.map((ward) => ward.value);
}

/**
 * Kept so old reverse-geocoding callers can degrade gracefully. New UI must
 * never use this function to populate a primary search filter.
 */
export async function fetchDistricts(
  _provinceCode: number | undefined,
): Promise<DistrictOption[]> {
  void _provinceCode;
  return [];
}
