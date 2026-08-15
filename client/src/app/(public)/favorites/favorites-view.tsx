'use client';

import { Heart } from 'lucide-react';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { RoomGrid } from '@/components/rooms/room-card';
import { RoomGridSkeleton } from '@/components/rooms/room-card-skeleton';
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
    return <RoomGridSkeleton count={6} />;
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
