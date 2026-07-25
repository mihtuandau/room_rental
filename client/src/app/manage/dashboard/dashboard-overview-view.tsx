'use client';

import { Eye, Home, MessageCircle, ShieldCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { RoomStatusBadge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import type { RoomStatus } from '@/lib/constants';
import { useMyRooms } from '@/features/rooms/hooks';
import type { MyRoomItem } from '@/features/rooms/api';

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

  // Real, not fabricated: summed straight from each room's own counters —
  // no trend chart or activity feed here, since the backend only tracks a
  // single cumulative counter per room, not a day-by-day history.
  const totalViews = rooms.reduce((sum, r) => sum + r.viewCount, 0);
  const totalContacts = rooms.reduce((sum, r) => sum + r.contactCount, 0);
  const activeCount = rooms.filter((r) => r.status === 'active').length;
  const verifiedCount = rooms.filter((r) => r.isVerified).length;

  const topViewed = [...rooms].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5);
  const topContacted = [...rooms].sort((a, b) => b.contactCount - a.contactCount).slice(0, 5);
  const recentRooms = [...rooms]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Eye} label="Tổng lượt xem" value={totalViews.toLocaleString('vi-VN')} />
        <StatCard
          icon={MessageCircle}
          label="Tổng lượt liên hệ"
          value={totalContacts.toLocaleString('vi-VN')}
        />
        <StatCard icon={Home} label="Tin đang hiển thị" value={`${activeCount} / ${rooms.length}`} />
        <StatCard
          icon={ShieldCheck}
          label="Tin đã xác minh"
          value={`${verifiedCount} / ${rooms.length}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <BarListPanel
          title="Lượt xem theo tin đăng"
          emptyLabel="Chưa có lượt xem nào."
          rooms={topViewed}
          valueOf={(r) => r.viewCount}
        />
        <BarListPanel
          title="Lượt liên hệ theo tin đăng"
          emptyLabel="Chưa có lượt liên hệ nào."
          rooms={topContacted}
          valueOf={(r) => r.contactCount}
        />

        <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-5">
          <h2 className="text-lg font-semibold">Tin đăng gần đây</h2>
          <ul className="mt-4 space-y-4">
            {recentRooms.map((room) => (
              <li key={room.id} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900">{room.title}</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(room.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <RoomStatusBadge status={room.status} className="shrink-0" />
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-5">
          <h2 className="text-lg font-semibold">Trạng thái tin đăng</h2>
          <StatusDonutChart rooms={rooms} />
        </div>
      </div>
    </div>
  );
}

// Same semantics as RoomStatusBadge's colour mapping (badge.tsx) — active is
// the "good" state (brand), pending is "awaiting" (warning), rejected is
// "danger"; draft/hidden/expired are all neutral but get distinct zinc steps
// so adjacent donut segments stay visually separable even though none of
// them individually needs to stand out.
const STATUS_STROKE_CLASS: Record<RoomStatus, string> = {
  active: 'stroke-brand-600',
  pending: 'stroke-warning-600',
  rejected: 'stroke-danger-600',
  draft: 'stroke-zinc-300',
  hidden: 'stroke-zinc-400',
  expired: 'stroke-zinc-500',
};

const DONUT_STATUS_ORDER: RoomStatus[] = [
  'active',
  'pending',
  'hidden',
  'rejected',
  'expired',
  'draft',
];

function StatusDonutChart({ rooms }: { rooms: MyRoomItem[] }) {
  const total = rooms.length;
  const counts = DONUT_STATUS_ORDER.map((status) => ({
    status,
    count: rooms.filter((r) => r.status === status).length,
  }));

  const size = 160;
  const center = size / 2;
  const radius = 60;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;

  const nonZero = counts.filter((c) => c.count > 0);
  const segments = nonZero.map((c, i) => ({
    ...c,
    length: (c.count / total) * circumference,
    offset: nonZero.slice(0, i).reduce((sum, prev) => sum + (prev.count / total) * circumference, 0),
  }));

  return (
    <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="shrink-0"
        role="img"
        aria-label={`Tổng ${total} tin đăng theo trạng thái`}
      >
        {/* Rotate only the arcs — 12 o'clock start — so the centered text below stays upright. */}
        <g transform={`rotate(-90 ${center} ${center})`}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-zinc-100"
          />
          {segments.map((seg) => (
            <circle
              key={seg.status}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              strokeDasharray={`${seg.length} ${circumference - seg.length}`}
              strokeDashoffset={-seg.offset}
              className={STATUS_STROKE_CLASS[seg.status]}
            />
          ))}
        </g>
        <text
          x={center}
          y={center - 6}
          textAnchor="middle"
          className="fill-zinc-900 text-2xl font-semibold"
        >
          {total}
        </text>
        <text x={center} y={center + 16} textAnchor="middle" className="fill-zinc-500 text-xs">
          tin đăng
        </text>
      </svg>

      <ul className="w-full space-y-2">
        {counts.map(({ status, count }) => (
          <li key={status} className="flex items-center justify-between gap-4 text-sm">
            <RoomStatusBadge status={status} />
            <span className="font-medium text-zinc-900">{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BarListPanel({
  title,
  emptyLabel,
  rooms,
  valueOf,
}: {
  title: string;
  emptyLabel: string;
  rooms: MyRoomItem[];
  valueOf: (room: MyRoomItem) => number;
}) {
  const max = Math.max(...rooms.map(valueOf), 0);

  if (max === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-5">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-4 text-sm text-zinc-500">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4 space-y-3">
        {rooms.map((room) => {
          const value = valueOf(room);
          return (
            <div key={room.id} className="space-y-1">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="truncate text-zinc-700">{room.title}</span>
                <span className="shrink-0 font-medium text-zinc-900">
                  {value.toLocaleString('vi-VN')}
                </span>
              </div>
              <div className="h-2 rounded-full bg-zinc-100">
                <div
                  className="h-2 rounded-full bg-brand-600"
                  style={{ width: `${(value / max) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[76px] w-full rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
