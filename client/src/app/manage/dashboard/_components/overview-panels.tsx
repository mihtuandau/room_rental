import { Eye, Home, MessageCircle, ShieldCheck } from 'lucide-react';
import { RoomStatusBadge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import type { MyRoomItem } from '@/features/rooms/api';
import type { RoomStatus } from '@/lib/constants';

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

export function OverviewStats({ rooms }: { rooms: MyRoomItem[] }) {
  const totalViews = rooms.reduce((sum, room) => sum + room.viewCount, 0);
  const totalContacts = rooms.reduce((sum, room) => sum + room.contactCount, 0);
  const activeCount = rooms.filter((room) => room.status === 'active').length;
  const verifiedCount = rooms.filter((room) => room.isVerified).length;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        icon={Eye}
        label="Tổng lượt xem"
        value={totalViews.toLocaleString('vi-VN')}
      />
      <StatCard
        icon={MessageCircle}
        label="Tổng lượt liên hệ"
        value={totalContacts.toLocaleString('vi-VN')}
      />
      <StatCard
        icon={Home}
        label="Tin đang hiển thị"
        value={`${activeCount} / ${rooms.length}`}
      />
      <StatCard
        icon={ShieldCheck}
        label="Tin đã xác minh"
        value={`${verifiedCount} / ${rooms.length}`}
      />
    </div>
  );
}

export function OverviewPanels({ rooms }: { rooms: MyRoomItem[] }) {
  const topViewed = [...rooms]
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 5);
  const topContacted = [...rooms]
    .sort((a, b) => b.contactCount - a.contactCount)
    .slice(0, 5);
  const recentRooms = [...rooms]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 4);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <BarListPanel
        title="Lượt xem theo tin đăng"
        emptyLabel="Chưa có lượt xem nào."
        rooms={topViewed}
        valueOf={(room) => room.viewCount}
      />
      <BarListPanel
        title="Lượt liên hệ theo tin đăng"
        emptyLabel="Chưa có lượt liên hệ nào."
        rooms={topContacted}
        valueOf={(room) => room.contactCount}
      />
      <RecentListings rooms={recentRooms} />
      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-5">
        <h2 className="text-lg font-semibold">Trạng thái tin đăng</h2>
        <StatusDonutChart rooms={rooms} />
      </div>
    </div>
  );
}

function RecentListings({ rooms }: { rooms: MyRoomItem[] }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-5">
      <h2 className="text-lg font-semibold">Tin đăng gần đây</h2>
      <ul className="mt-4 space-y-4">
        {rooms.map((room) => (
          <li
            key={room.id}
            className="flex items-start justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-900">
                {room.title}
              </p>
              <p className="text-xs text-zinc-500">
                {new Date(room.createdAt).toLocaleDateString('vi-VN')}
              </p>
            </div>
            <RoomStatusBadge status={room.status} className="shrink-0" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusDonutChart({ rooms }: { rooms: MyRoomItem[] }) {
  const total = rooms.length;
  const counts = DONUT_STATUS_ORDER.map((status) => ({
    status,
    count: rooms.filter((room) => room.status === status).length,
  }));
  const nonZero = counts.filter(({ count }) => count > 0);
  const size = 160;
  const center = size / 2;
  const radius = 60;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;
  const segments = nonZero.map((item, index) => ({
    ...item,
    length: (item.count / total) * circumference,
    offset: nonZero
      .slice(0, index)
      .reduce(
        (sum, previous) =>
          sum + (previous.count / total) * circumference,
        0,
      ),
  }));

  return (
    <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="shrink-0"
        role="img"
        aria-label={`Tổng ${total} tin đăng theo trạng thái`}
      >
        <g transform={`rotate(-90 ${center} ${center})`}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-zinc-100"
          />
          {segments.map((segment) => (
            <circle
              key={segment.status}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              strokeDasharray={`${segment.length} ${circumference - segment.length}`}
              strokeDashoffset={-segment.offset}
              className={STATUS_STROKE_CLASS[segment.status]}
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
        <text
          x={center}
          y={center + 16}
          textAnchor="middle"
          className="fill-zinc-500 text-xs"
        >
          tin đăng
        </text>
      </svg>
      <ul className="w-full space-y-2">
        {counts.map(({ status, count }) => (
          <li
            key={status}
            className="flex items-center justify-between gap-4 text-sm"
          >
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
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      {max === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">{emptyLabel}</p>
      ) : (
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
      )}
    </div>
  );
}

export function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-[76px] w-full rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-48 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
