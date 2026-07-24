import { apiRequest } from '@/lib/api-client';
import type { RoomCardItem } from '@/components/rooms/room-card';

export function fetchFavorites() {
  return apiRequest<RoomCardItem[]>('/favorites');
}

export function addFavorite(roomId: number) {
  return apiRequest<void>(`/favorites/${roomId}`, { method: 'POST' });
}

export function removeFavorite(roomId: number) {
  return apiRequest<void>(`/favorites/${roomId}`, { method: 'DELETE' });
}
