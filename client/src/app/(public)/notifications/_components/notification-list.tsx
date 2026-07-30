'use client';

import Link from 'next/link';
import { CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { NotificationItem } from '@/features/notifications/api';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from '@/features/notifications/hooks';
import { cn } from '@/lib/utils';

export function NotificationsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className="h-20 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function NotificationList({
  notifications,
  unreadCount,
}: {
  notifications: NotificationItem[];
  unreadCount: number;
}) {
  const markAllRead = useMarkAllNotificationsRead();

  return (
    <div className="space-y-4">
      {unreadCount > 0 ? (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            <CheckCheck className="h-4 w-4" aria-hidden />
            {markAllRead.isPending
              ? 'Đang đánh dấu…'
              : 'Đánh dấu tất cả đã đọc'}
          </Button>
        </div>
      ) : null}
      <ul className="space-y-2">
        {notifications.map((notification) => (
          <NotificationRow
            key={notification.id}
            notification={notification}
          />
        ))}
      </ul>
    </div>
  );
}

function notificationHref(notification: NotificationItem) {
  if (notification.type === 'saved_search_match' && notification.room) {
    return `/room/${notification.room.slug}`;
  }
  if (
    (notification.type === 'listing_approved' ||
      notification.type === 'listing_rejected') &&
    notification.roomId
  ) {
    return `/manage/listings/${notification.roomId}/edit`;
  }
  return null;
}

function NotificationRow({
  notification,
}: {
  notification: NotificationItem;
}) {
  const markRead = useMarkNotificationRead();
  const href = notificationHref(notification);

  function handleClick() {
    if (!notification.isRead && !markRead.isPending) {
      markRead.mutate(notification.id);
    }
  }

  const content = (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4 transition-colors',
        notification.isRead
          ? 'border-zinc-200 bg-white'
          : 'border-brand-200 bg-brand-50/40',
      )}
    >
      <span
        className={cn(
          'mt-1.5 h-2 w-2 shrink-0 rounded-full',
          !notification.isRead && 'bg-brand-600',
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-900">
          {notification.title}
        </p>
        {notification.body ? (
          <p className="mt-0.5 text-sm text-zinc-600">
            {notification.body}
          </p>
        ) : null}
        <p className="mt-1 text-xs text-zinc-500">
          {new Date(notification.createdAt).toLocaleString('vi-VN', {
            dateStyle: 'short',
            timeStyle: 'short',
          })}
        </p>
      </div>
    </div>
  );

  return href ? (
    <li>
      <Link href={href} onClick={handleClick} className="block">
        {content}
      </Link>
    </li>
  ) : (
    <li>
      <button
        type="button"
        onClick={handleClick}
        disabled={markRead.isPending}
        className="block w-full text-left"
      >
        {content}
      </button>
    </li>
  );
}
