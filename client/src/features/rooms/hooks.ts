import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createRoom,
  deleteRoom,
  deleteRoomImage,
  fetchMyRoomDetail,
  fetchMyRooms,
  fetchRooms,
  revealContact,
  setRoomAmenities,
  updateRoom,
  type SearchParams,
  type UpdateRoomInput,
} from './api';

export const roomKeys = {
  all: ['rooms'] as const,
  search: (params: SearchParams) => [...roomKeys.all, 'search', params] as const,
  detail: (slug: string) => [...roomKeys.all, 'detail', slug] as const,
  mine: () => [...roomKeys.all, 'mine'] as const,
  mineDetail: (id: number) => [...roomKeys.all, 'mine', id] as const,
};

/** The signed-in user's own listings, any status — powers "Tin của tôi". */
export function useMyRooms() {
  return useQuery({ queryKey: roomKeys.mine(), queryFn: fetchMyRooms });
}

/** Full detail of one of the caller's own listings, any status — powers the edit form. */
export function useMyRoomDetail(id: number) {
  return useQuery({
    queryKey: roomKeys.mineDetail(id),
    queryFn: () => fetchMyRoomDetail(id),
  });
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

export function useUpdateRoom(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateRoomInput) => updateRoom(id, input),
    // PATCH /rooms/:id returns the updated room WITHOUT images/amenities (no
    // `include` on that Prisma call) — writing it straight into the
    // mineDetail cache would leave `.images`/`.amenities` undefined and crash
    // any component still reading it. Invalidate instead so both refetch the
    // full shape from GET /rooms/mine/:id.
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roomKeys.mine() });
      qc.invalidateQueries({ queryKey: roomKeys.mineDetail(id) });
    },
  });
}

export function useDeleteRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteRoom,
    onSuccess: () => qc.invalidateQueries({ queryKey: roomKeys.mine() }),
  });
}

/** Deletes one image immediately (no staging) — the room already exists by
 * the time this is used (the edit page), unlike the create form's flow. */
export function useDeleteRoomImage(roomId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (imageId: string) => deleteRoomImage(roomId, imageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: roomKeys.mineDetail(roomId) }),
  });
}
