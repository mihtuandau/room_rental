'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchWards } from './api';

/**
 * Real wards (phường/xã) for the given province, sourced from the public VN
 * administrative API (see fetchWards) — not from whatever happens to exist
 * in our `rooms` table, so every real ward is selectable even before anyone
 * has posted a listing there. Idle until a city (and its code) is known.
 */
export function useWards(code: number | undefined) {
  return useQuery({
    queryKey: ['wards', code],
    queryFn: () => fetchWards(code),
    enabled: !!code,
    staleTime: 60 * 60 * 1000,
  });
}
