'use client';

import { AdminPageHeader } from '@/components/admin/admin-page';
import { ErrorState } from '@/components/ui/states';
import {
  useAdminDashboardSummary,
  usePendingAdminReports,
  usePendingAdminRooms,
} from '@/features/admin/hooks';
import { DashboardQueues } from './_components/dashboard-queues';
import { DashboardSkeleton } from './_components/dashboard-skeleton';
import { DashboardStats } from './_components/dashboard-stats';
import { PriorityQueue } from './_components/priority-queue';
import { WorkloadChart } from './_components/workload-chart';

export function AdminDashboardView() {
  const summary = useAdminDashboardSummary();
  const rooms = usePendingAdminRooms();
  const reports = usePendingAdminReports();
  const hasError = summary.isError || rooms.isError || reports.isError;

  if (summary.isPending || rooms.isPending || reports.isPending) {
    return <DashboardSkeleton />;
  }
  if (hasError) {
    return (
      <ErrorState
        onRetry={() =>
          void Promise.all([
            summary.refetch(),
            rooms.refetch(),
            reports.refetch(),
          ])
        }
      />
    );
  }

  const data = summary.data;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Tổng quan hệ thống"
        description="Theo dõi các mục cần được xử lý trong hôm nay."
      />

      <DashboardStats
        newUsers={data.newUsersToday}
        pendingRooms={data.pendingRooms}
        pendingReports={data.pendingReports}
      />

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)]">
        <WorkloadChart
          newUsers={data.newUsersToday}
          pendingReports={data.pendingReports}
          pendingRooms={data.pendingRooms}
        />
        <PriorityQueue
          pendingReports={data.pendingReports}
          pendingRooms={data.pendingRooms}
        />
      </section>

      <DashboardQueues
        rooms={rooms.data?.rooms ?? []}
        reports={reports.data?.reports ?? []}
        pendingRoomCount={data.pendingRooms}
      />
    </div>
  );
}
