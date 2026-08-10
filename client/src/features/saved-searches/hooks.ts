'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createSavedSearch, deleteSavedSearch, getSavedSearches, updateSavedSearch } from './api';
import { useIsSignedIn } from '@/stores/auth-store';

export const savedSearchKeys = {
  all: ['saved-searches'] as const,
};

export function useSavedSearches() {
  const isSignedIn = useIsSignedIn();
  return useQuery({
    queryKey: savedSearchKeys.all,
    queryFn: getSavedSearches,
    enabled: isSignedIn,
  });
}

export function useCreateSavedSearch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSavedSearch,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: savedSearchKeys.all }),
  });
}

export function useUpdateSavedSearch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notificationsEnabled }: { id: string; notificationsEnabled: boolean }) =>
      updateSavedSearch(id, { notificationsEnabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: savedSearchKeys.all }),
  });
}

export function useDeleteSavedSearch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSavedSearch,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: savedSearchKeys.all }),
  });
}
