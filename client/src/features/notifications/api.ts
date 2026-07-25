import { apiRequest } from '@/lib/api-client';

export type NotificationType = 'listing_approved' | 'listing_rejected' | 'saved_search_match';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  roomId: number | null;
  room: { slug: string } | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsPage {
  notifications: NotificationItem[];
  total: number;
  page: number;
  pageSize: number;
  unreadCount: number;
}

export function fetchNotifications(page = 1) {
  return apiRequest<NotificationsPage>(`/notifications?page=${page}`);
}

export function markNotificationRead(id: string) {
  return apiRequest<NotificationItem>(`/notifications/${id}/read`, { method: 'PATCH' });
}

export function markAllNotificationsRead() {
  return apiRequest<{ success: boolean }>('/notifications/read-all', { method: 'PATCH' });
}
