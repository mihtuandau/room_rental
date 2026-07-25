'use client';

import Link from 'next/link';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { cn } from '@/lib/utils';
import { useIsSignedIn } from '@/stores/auth-store';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/features/notifications/hooks';
import type { NotificationItem } from '@/features/notifications/api';

export function NotificationsView() {
  const isSignedIn = useIsSignedIn();
  const { data, isPending, isError, refetch } = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();

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

  if (isPending) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

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
    <div className="space-y-4">
      {data.unreadCount > 0 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            <CheckCheck className="h-4 w-4" aria-hidden />
            Đánh dấu tất cả đã đọc
          </Button>
        </div>
      )}
      <ul className="space-y-2">
        {data.notifications.map((n) => (
          <NotificationRow key={n.id} notification={n} />
        ))}
      </ul>
    </div>
  );
}

// Tenant-side matches lead to the public listing; landlord-side moderation
// notifications lead to the owner's own edit page instead — a rejected room
// isn't publicly viewable, so /room/[slug] would just 404 for that one.
function notificationHref(n: NotificationItem): string | null {
  if (n.type === 'saved_search_match' && n.room) return `/room/${n.room.slug}`;
  if ((n.type === 'listing_approved' || n.type === 'listing_rejected') && n.roomId) {
    return `/manage/listings/${n.roomId}/edit`;
  }
  return null;
}

function NotificationRow({ notification }: { notification: NotificationItem }) {
  const markRead = useMarkNotificationRead();
  const href = notificationHref(notification);

  const handleClick = () => {
    if (!notification.isRead) markRead.mutate(notification.id);
  };

  const content = (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4 transition-colors',
        notification.isRead ? 'border-zinc-200 bg-white' : 'border-brand-200 bg-brand-50/40',
      )}
    >
      <span
        className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', !notification.isRead && 'bg-brand-600')}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-900">{notification.title}</p>
        {notification.body && <p className="mt-0.5 text-sm text-zinc-600">{notification.body}</p>}
        <p className="mt-1 text-xs text-zinc-500">
          {new Date(notification.createdAt).toLocaleString('vi-VN', {
            dateStyle: 'short',
            timeStyle: 'short',
          })}
        </p>
      </div>
    </div>
  );

  if (href) {
    return (
      <li>
        <Link href={href} onClick={handleClick} className="block">
          {content}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <button type="button" onClick={handleClick} className="block w-full text-left">
        {content}
      </button>
    </li>
  );
}
