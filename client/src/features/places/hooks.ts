import { useQuery } from '@tanstack/react-query';
import { fetchNearbyPlaces, type NearbyPlace } from './api';

export const placeKeys = {
  all: ['places'] as const,
  nearby: (lat: number | null, lng: number | null, address?: string) =>
    [...placeKeys.all, 'nearby', lat, lng, address] as const,
};

export function useNearbyPlaces(
  latitude: number | null,
  longitude: number | null,
  address?: string,
  enabled = true,
) {
  const hasLocation = (latitude != null && longitude != null) || Boolean(address && address.trim().length > 0);

  return useQuery<NearbyPlace[]>({
    queryKey: placeKeys.nearby(latitude, longitude, address),
    queryFn: () => {
      return fetchNearbyPlaces(latitude, longitude, address);
    },
    enabled: enabled && hasLocation,
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
}
