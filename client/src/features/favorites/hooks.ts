'use client';

import { useSyncExternalStore } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-client';
import { useAuthStore, useIsSignedIn } from '@/stores/auth-store';
import { addFavorite, fetchFavorites, removeFavorite } from './api';

export const favoriteKeys = { all: ['favorites'] as const };

/**
 * The favorites query is client-owned and can be populated as soon as the
 * refresh-cookie bootstrap completes. Keep it disabled for the first client
 * render so a server-rendered card cannot hydrate with a different heart state.
 */
function subscribeToClient() {
  return () => undefined;
}

function useClientReady() {
  return useSyncExternalStore(
    subscribeToClient,
    () => true,
    () => false,
  );
}

export function useFavorites() {
  const isSignedIn = useIsSignedIn();
  const isBootstrapped = useAuthStore((s) => s.isBootstrapped);
  const isClientReady = useClientReady();
  const isReady = isClientReady && isBootstrapped && isSignedIn;

  const query = useQuery({
    queryKey: favoriteKeys.all,
    queryFn: fetchFavorites,
    enabled: isReady,
  });

  return {
    ...query,
    data: isReady ? (query.data ?? []) : [],
  };
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
