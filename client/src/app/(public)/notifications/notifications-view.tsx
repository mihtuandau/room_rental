'use client';

import { Bell } from 'lucide-react';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { useNotifications } from '@/features/notifications/hooks';
import { useIsSignedIn } from '@/stores/auth-store';
import {
  NotificationList,
  NotificationsSkeleton,
} from './_components/notification-list';

export function NotificationsView() {
  const isSignedIn = useIsSignedIn();
  const { data, isPending, isError, refetch } = useNotifications();

  if (!isSignedIn) {
    return (
      <EmptyState
        icon={<Bell className="h-10 w-10" />}
        title="Đăng nhập để xem thông báo"
        description="Theo dõi thông báo về tin đăng và tìm kiếm đã lưu của bạn."
        action={{
          label: 'Đăng nhập',
          href: `/login?next=${encodeURIComponent('/notifications')}`,
        }}
      />
    );
  }
  if (isPending) return <NotificationsSkeleton />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (data.notifications.length === 0) {
    return (
      <EmptyState
        icon={<Bell className="h-10 w-10" />}
        title="Chưa có thông báo nào"
        description="Thông báo về tin đăng và tìm kiếm đã lưu của bạn sẽ xuất hiện ở đây."
      />
    );
  }

  return (
    <NotificationList
      notifications={data.notifications}
      unreadCount={data.unreadCount}
    />
  );
}
