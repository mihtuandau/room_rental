'use client';

import { Heart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { RoomGrid } from '@/components/rooms/room-card';
import { useIsSignedIn } from '@/stores/auth-store';
import { useFavorites } from '@/features/favorites/hooks';

export function FavoritesView() {
  const isSignedIn = useIsSignedIn();
  const { data: rooms, isPending, isError, refetch } = useFavorites();

  if (!isSignedIn) {
    return (
      <EmptyState
        icon={<Heart className="h-10 w-10" />}
        title="Đăng nhập để xem tin đã lưu"
        description="Lưu lại những tin đăng bạn quan tâm để xem lại sau."
        action={{ label: 'Đăng nhập', href: `/login?next=${encodeURIComponent('/favorites')}` }}
      />
    );
  }

  if (isPending) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="aspect-[4/3] w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) return <ErrorState onRetry={() => refetch()} />;

  if (rooms.length === 0) {
    return (
      <EmptyState
        icon={<Heart className="h-10 w-10" />}
        title="Bạn chưa lưu tin nào"
        description="Bấm biểu tượng trái tim trên một tin đăng để lưu lại xem sau."
        action={{ label: 'Tìm phòng ngay', href: '/' }}
      />
    );
  }

  return <RoomGrid rooms={rooms} />;
}
