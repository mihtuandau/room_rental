import { VN_CITY_OPTIONS } from '@/lib/constants';

export interface ProvinceOption {
  /** Bare name matched against a listing's `city` (e.g. "Hồ Chí Minh"). */
  value: string;
  /** Bare name shown to the user too — no "Thành phố"/"Tỉnh" unit prefix. */
  label: string;
}

interface RawProvince {
  name: string;
  code: number;
}

/** The stored `city` has no unit prefix, so strip it to match ("Tỉnh Cao Bằng" → "Cao Bằng"). */
function stripUnitPrefix(name: string): string {
  return name.replace(/^(Thành phố|Tỉnh)\s+/u, '').trim();
}

/**
 * Vietnam's provinces from the public open-api (v2 reflects the 2025 merge into
 * 34 provinces + the province→ward two-tier structure). Fetched server-side and
 * cached a day; on any failure we fall back to a small built-in list so the
 * location filter never disappears.
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
      .map((p) => {
        const bare = stripUnitPrefix(p.name);
        return { value: bare, label: bare };
      })
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
  } catch {
    return [...VN_CITY_OPTIONS];
  }
}
