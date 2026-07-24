'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-client';
import { useIsSignedIn } from '@/stores/auth-store';
import { addFavorite, fetchFavorites, removeFavorite } from './api';

export const favoriteKeys = { all: ['favorites'] as const };

export function useFavorites() {
  const isSignedIn = useIsSignedIn();
  return useQuery({
    queryKey: favoriteKeys.all,
    queryFn: fetchFavorites,
    enabled: isSignedIn,
  });
}

/** Whether a specific room is in the signed-in user's favorites. */
export function useIsFavorited(roomId: number) {
  const { data, isPending } = useFavorites();
  return { isFavorited: !!data?.some((r) => r.id === roomId), isPending };
}

export function useToggleFavorite(roomId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (isFavorite: boolean) =>
      isFavorite ? removeFavorite(roomId) : addFavorite(roomId),
    onSuccess: (_data, isFavorite) => {
      qc.invalidateQueries({ queryKey: favoriteKeys.all });
      toast.success(isFavorite ? 'Đã bỏ lưu tin.' : 'Đã lưu tin.');
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 401) return; // caller redirects
      toast.error('Không lưu được, thử lại nhé.');
    },
  });
}
