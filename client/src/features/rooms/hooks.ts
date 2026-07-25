import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import {
  createRoom,
  fetchMyRooms,
  fetchRooms,
  revealContact,
  setRoomAmenities,
  type SearchParams,
} from './api';

export const roomKeys = {
  all: ['rooms'] as const,
  search: (params: SearchParams) => [...roomKeys.all, 'search', params] as const,
  detail: (slug: string) => [...roomKeys.all, 'detail', slug] as const,
  mine: () => [...roomKeys.all, 'mine'] as const,
};

/** The signed-in user's own listings, any status — powers "Tin của tôi". */
export function useMyRooms() {
  return useQuery({ queryKey: roomKeys.mine(), queryFn: fetchMyRooms });
}

export function useRoomsSearch(params: SearchParams) {
  return useQuery({
    queryKey: roomKeys.search(params),
    queryFn: () => fetchRooms(params),
    // Keep the current results visible (dimmed) while the next page loads instead
    // of collapsing the layout into skeletons on every page change.
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

/**
 * Reveals the landlord's phone/Zalo. Requires sign-in (JwtAuthGuard on the
 * backend) — the caller should route a 401 to a sign-in prompt rather than a
 * generic error, per skill ui-state-patterns.
 */
export function useRevealContact(roomId: number) {
  return useMutation({
    mutationFn: (type: 'phone' | 'zalo' | 'message') =>
      revealContact(roomId, type),
  });
}

export function useCreateRoom() {
  return useMutation({ mutationFn: createRoom });
}

export function useSetRoomAmenities() {
  return useMutation({
    mutationFn: ({ roomId, amenityIds }: { roomId: number; amenityIds: number[] }) =>
      setRoomAmenities(roomId, amenityIds),
  });
}
