import { apiRequest } from '@/lib/api-client';
import type { RoomType } from '@/lib/constants';

/** Matches the backend's CreateSavedSearchDto — keyword/amenities aren't supported there. */
export interface CreateSavedSearchInput {
  city?: string;
  district?: string;
  ward?: string;
  roomType?: RoomType;
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
}

export function createSavedSearch(input: CreateSavedSearchInput) {
  return apiRequest<{ id: string }>('/saved-searches', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
