import { VN_CITY_OPTIONS } from '@/lib/constants';

export interface ProvinceOption {
  /** Bare name matched against a listing's `city` (e.g. "Hồ Chí Minh"). */
  value: string;
  /** Bare name shown to the user too — no "Thành phố"/"Tỉnh" unit prefix. */
  label: string;
  /** v2 code — needed to look up this province's wards (see fetchWards). */
  code?: number;
}

export interface DistrictOption {
  /** Bare district name matched against a listing's `district`. */
  value: string;
  label: string;
  /** Legacy v1 code used to load wards for this district. */
  code?: number;
  /** Ward names belonging to this district, used to keep reverse-geocoded
   * province/district/ward values internally consistent. */
  wardNames?: string[];
}

interface RawProvince {
  name: string;
  code: number;
}

interface RawDistrict {
  name: string;
  code: number;
  wards?: { name: string }[];
}

/** The stored `city` has no unit prefix, so strip it to match ("Tỉnh Cao Bằng" → "Cao Bằng"). */
function stripUnitPrefix(name: string): string {
  return name.replace(/^(Thành phố|Tỉnh)\s+/u, '').trim();
}

/** Same idea, one tier down ("Phường Gò Vấp" → "Gò Vấp", "Xã Củ Chi" → "Củ Chi"). */
function stripWardPrefix(name: string): string {
  return name.replace(/^(Phường|Xã|Thị trấn|Đặc khu)\s+/u, '').trim();
}

/** Keep numeric districts such as "Quận 7" intact; remove administrative
 * prefixes for names that are stored without them (for example "Quận Hải
 * Châu" → "Hải Châu"). */
function stripDistrictPrefix(name: string): string {
  if (/^Quận\s+\d+$/u.test(name)) return name.trim();
  return name
    .replace(/^(Quận|Huyện|Thị xã|Thành phố)\s+/u, '')
    .trim();
}

/**
 * Vietnam's provinces from the public open-api (v2 reflects the 2025 merge into
 * 34 provinces + the province→ward two-tier structure). Fetched server-side and
 * cached a day; on any failure we fall back to a small built-in list so the
 * location filter never disappears.
 */
export async function fetchProvinces(): Promise<ProvinceOption[]> {
  try {
    const res = await fetch('https://provinces.open-api.vn/api/v1/p/', {
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!res.ok) return [...VN_CITY_OPTIONS];

    const raw = (await res.json()) as RawProvince[];
    if (!Array.isArray(raw) || raw.length === 0) return [...VN_CITY_OPTIONS];

    return raw
      .map((p) => {
        const bare = stripUnitPrefix(p.name);
        return { value: bare, label: bare, code: p.code };
      })
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
  } catch {
    return [...VN_CITY_OPTIONS];
  }
}

/**
 * Real wards (phường/xã) of a province, or of a selected district, straight
 * from the administrative API — not limited to whichever ward happens to have
 * an active listing today. With a district selected, its v1 code is used so
 * the ward list is scoped to that district.
 */
export async function fetchWards(
  provinceCode: number | undefined,
  districtCode?: number,
): Promise<string[]> {
  if (!provinceCode) return [];
  try {
    const endpoint = districtCode
      ? `https://provinces.open-api.vn/api/v1/d/${districtCode}?depth=2`
      : `https://provinces.open-api.vn/api/v1/p/${provinceCode}?depth=2`;
    const res = await fetch(endpoint, { next: { revalidate: 60 * 60 * 24 } });
    if (!res.ok) return [];
    const detail = (await res.json()) as { wards?: { name: string }[] };

    return (detail.wards ?? [])
      .map((w) => stripWardPrefix(w.name))
      .sort((a, b) => a.localeCompare(b, 'vi'));
  } catch {
    return [];
  }
}

/**
 * Districts are requested from the v1 endpoint because v2 intentionally models
 * Vietnam's new two-tier administration (province → ward). The fallback is an
 * empty list: the toolbar still keeps the district control disabled rather than
 * presenting options that cannot be matched by the backend.
 */
export async function fetchDistricts(
  provinceCode: number | undefined,
): Promise<DistrictOption[]> {
  if (!provinceCode) return [];
  try {
    const res = await fetch(
      // v1 is the pre-merge 3-level dataset; depth=3 is required to include
      // wards inside each district for ward→district consistency checks.
      `https://provinces.open-api.vn/api/v1/p/${provinceCode}?depth=3`,
      { next: { revalidate: 60 * 60 * 24 } },
    );
    if (!res.ok) return [];
    const detail = (await res.json()) as { districts?: RawDistrict[] };
    return (detail.districts ?? [])
      .map((district) => {
        const value = stripDistrictPrefix(district.name);
        const wardNames = (district.wards ?? [])
          .map((ward) => stripWardPrefix(ward.name))
          .filter((ward) => ward.length > 0)
          .sort((a, b) => a.localeCompare(b, 'vi'));
        return { value, label: value, code: district.code, wardNames };
      })
      .filter((district) => district.value.length > 0)
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
  } catch {
    return [];
  }
}
