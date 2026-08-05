'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchDistricts, fetchWards } from './api';

export function useDistricts(provinceCode: number | undefined) {
  return useQuery({
    queryKey: ['districts', provinceCode],
    queryFn: () => fetchDistricts(provinceCode),
    enabled: !!provinceCode,
    staleTime: 60 * 60 * 1000,
  });
}

/** Real districts for the selected province. */
/**
 * Real wards (phường/xã) for the selected province/district, sourced from the
 * public VN administrative API (see fetchWards) — not from whatever happens
 * to exist in our `rooms` table, so every real ward is selectable even before
 * anyone has posted a listing there.
 */
export function useWards(provinceCode: number | undefined, districtCode?: number) {
  return useQuery({
    queryKey: ['wards', provinceCode, districtCode],
    queryFn: () => fetchWards(provinceCode, districtCode),
    enabled: !!provinceCode,
    staleTime: 60 * 60 * 1000,
  });
}
