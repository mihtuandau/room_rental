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

export interface SavedSearch {
  id: string;
  city: string | null;
  district: string | null;
  ward: string | null;
  roomType: RoomType | null;
  priceMin: number | null;
  priceMax: number | null;
  areaMin: number | null;
  areaMax: number | null;
  notificationsEnabled: boolean;
  lastNotifiedAt: string | null;
  createdAt: string;
}

export function createSavedSearch(input: CreateSavedSearchInput) {
  return apiRequest<{ id: string }>('/saved-searches', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getSavedSearches() {
  return apiRequest<SavedSearch[]>('/saved-searches');
}

export function updateSavedSearch(id: string, input: { notificationsEnabled: boolean }) {
  return apiRequest<SavedSearch>(`/saved-searches/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteSavedSearch(id: string) {
  return apiRequest<{ success: boolean }>(`/saved-searches/${id}`, {
    method: 'DELETE',
  });
}
