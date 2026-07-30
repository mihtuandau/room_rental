'use client';

import { EmptyState, ErrorState } from '@/components/ui/states';
import { useMyRooms } from '@/features/rooms/hooks';
import {
  OverviewPanels,
  OverviewSkeleton,
  OverviewStats,
} from './_components/overview-panels';

export function DashboardOverviewView() {
  const { data: rooms, isPending, isError, refetch } = useMyRooms();

  if (isPending) return <OverviewSkeleton />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (rooms.length === 0) {
    return (
      <EmptyState
        title="Bạn chưa đăng tin nào"
        description="Đăng tin cho thuê để tiếp cận hàng nghìn người thuê tiềm năng."
        action={{ label: 'Đăng tin ngay', href: '/manage/listings/new' }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <OverviewStats rooms={rooms} />
      <OverviewPanels rooms={rooms} />
    </div>
  );
}
