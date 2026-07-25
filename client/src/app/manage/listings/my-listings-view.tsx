'use client';

import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { RoomStatusBadge } from '@/components/ui/badge';
import { ROOM_TYPE_LABELS } from '@/lib/constants';
import { formatPrice } from '@/lib/utils';
import { useMyRooms } from '@/features/rooms/hooks';
import type { MyRoomItem } from '@/features/rooms/api';

const PLACEHOLDER_IMAGE = 'https://placehold.co/200x150?text=Tro+Oi';

export function MyListingsView() {
  const { data: rooms, isPending, isError, refetch } = useMyRooms();

  if (isPending) return <ListSkeleton />;
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
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button asChild>
          <Link href="/manage/listings/new">
            <PlusCircle className="h-4 w-4" aria-hidden />
            Đăng tin mới
          </Link>
        </Button>
      </div>

      <ul className="space-y-3">
        {rooms.map((room) => (
          <RoomRow key={room.id} room={room} />
        ))}
      </ul>
    </div>
  );
}

function RoomRow({ room }: { room: MyRoomItem }) {
  // Only an active listing has a real public page — anything else 404s there,
  // since /room/[slug] only ever shows status: 'active' listings.
  const isViewable = room.status === 'active';

  const content = (
    <div className="flex items-center gap-4 rounded-lg border border-zinc-200 p-3 transition-colors hover:bg-zinc-50">
      {/* eslint-disable-next-line @next/next/no-img-element -- remote/placeholder host, see room-card.tsx */}
      <img
        src={room.images[0]?.url ?? PLACEHOLDER_IMAGE}
        alt=""
        className="h-16 w-20 shrink-0 rounded-md object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-medium">{room.title}</h3>
          <RoomStatusBadge status={room.status} />
        </div>
        <p className="mt-0.5 text-xs text-zinc-500">
          {ROOM_TYPE_LABELS[room.roomType]} ·{' '}
          {room.district}, {room.city}
        </p>
        <p className="mt-1 text-sm font-semibold text-zinc-900">
          {formatPrice(room.price)}
          <span className="font-normal text-zinc-500">/tháng</span>
        </p>
      </div>
    </div>
  );

  return (
    <li>
      {isViewable ? <Link href={`/room/${room.slug}`}>{content}</Link> : content}
    </li>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-lg" />
      ))}
    </div>
  );
}
