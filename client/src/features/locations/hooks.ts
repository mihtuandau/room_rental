'use client';

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';

function fetchDistricts(city: string) {
  return apiRequest<string[]>(`/rooms/districts?city=${encodeURIComponent(city)}`);
}

/**
 * Districts that actually have active listings in the given city — sourced from
 * the data so the dropdown options always match what a filter can return. Idle
 * until a city is picked.
 */
export function useDistricts(city: string) {
  return useQuery({
    queryKey: ['districts', city],
    queryFn: () => fetchDistricts(city),
    enabled: !!city,
    staleTime: 60 * 60 * 1000,
  });
}
