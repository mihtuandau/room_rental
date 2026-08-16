export type PlaceCategory = 'all' | 'education' | 'shopping' | 'health' | 'transit' | 'other';

export interface NearbyPlace {
  id: string;
  name: string;
  category: PlaceCategory;
  categoryLabel: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  distanceFormatted: string;
  walkMinutes: number;
  driveMinutes: number;
}

export async function fetchNearbyPlaces(
  latitude: number | null,
  longitude: number | null,
  address?: string,
  radiusMeters = 2000,
): Promise<NearbyPlace[]> {
  const params = new URLSearchParams();
  if (latitude != null) params.set('lat', String(latitude));
  if (longitude != null) params.set('lng', String(longitude));
  if (address) params.set('address', address);
  params.set('radius', String(radiusMeters));

  const response = await fetch(`/api/places/nearby?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch nearby places: ${response.statusText}`);
  }

  return response.json();
}
