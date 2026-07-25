'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useIsSignedIn } from '@/stores/auth-store';
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from './api';

export const notificationKeys = { all: ['notifications'] as const };

export function useNotifications() {
  const isSignedIn = useIsSignedIn();
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: () => fetchNotifications(1),
    enabled: isSignedIn,
    // No websocket/push in this app yet — polling is how the header badge and
    // the list ever learn about a new notification without a manual refresh.
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}
