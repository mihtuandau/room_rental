'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Pencil, PlusCircle, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { RoomStatusBadge } from '@/components/ui/badge';
import { ROOM_STATUS_LABELS, ROOM_TYPE_LABELS } from '@/lib/constants';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import { useDeleteRoom, useMyRooms } from '@/features/rooms/hooks';
import type { MyRoomItem } from '@/features/rooms/api';

const PLACEHOLDER_IMAGE = 'https://placehold.co/200x150?text=Tro+Oi';
const PAGE_SIZE = 8;
const ALL_STATUS = '__all__';

export function MyListingsView() {
  const { data: rooms, isPending, isError, refetch } = useMyRooms();
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState(ALL_STATUS);
  const [page, setPage] = useState(1);

  if (isPending) return <DashboardSkeleton />;
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

  const filtered = rooms.filter((r) => {
    const matchesKeyword = r.title.toLowerCase().includes(keyword.trim().toLowerCase());
    const matchesStatus = statusFilter === ALL_STATUS || r.status === statusFilter;
    return matchesKeyword && matchesStatus;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-semibold">Tin đăng của tôi</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
              aria-hidden
            />
            <Input
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo tên tin đăng…"
              aria-label="Tìm theo tên tin đăng"
              className="pl-9 sm:w-56"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger aria-label="Lọc theo trạng thái" className="sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_STATUS}>Tất cả trạng thái</SelectItem>
              {Object.entries(ROOM_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button asChild>
            <Link href="/manage/listings/new">
              <PlusCircle className="h-4 w-4" aria-hidden />
              Đăng tin mới
            </Link>
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Không tìm thấy tin đăng phù hợp"
          description="Thử đổi từ khoá hoặc bộ lọc trạng thái."
          className="py-12"
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-brand-50/60 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Tin đăng</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Ngày hiển thị</th>
                  <th className="px-4 py-3">Lượt xem</th>
                  <th className="px-4 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {paged.map((room) => (
                  <RoomRow key={room.id} room={room} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 text-sm text-zinc-600">
            <p>
              Hiển thị {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, filtered.length)} trong {filtered.length} tin
              đăng
            </p>
            {totalPages > 1 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Sau
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function RoomRow({ room }: { room: MyRoomItem }) {
  const deleteRoom = useDeleteRoom();
  // Only an active listing has a real public page — anything else 404s there,
  // since /room/[slug] only ever shows status: 'active' listings.
  const isViewable = room.status === 'active';

  const handleDelete = async () => {
    try {
      await deleteRoom.mutateAsync(room.id);
      toast.success('Đã xoá tin đăng.');
    } catch {
      toast.error('Không xoá được tin đăng, thử lại nhé.');
    }
  };

  return (
    <tr className="align-middle">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- remote/placeholder host, see room-card.tsx */}
          <img
            src={room.images[0]?.url ?? PLACEHOLDER_IMAGE}
            alt=""
            className="h-12 w-12 shrink-0 rounded-md object-cover"
          />
          <div className="min-w-0">
            {isViewable ? (
              <Link
                href={`/room/${room.slug}`}
                className="block truncate font-medium text-zinc-900 hover:text-brand-700"
              >
                {room.title}
              </Link>
            ) : (
              <p className="truncate font-medium text-zinc-900">{room.title}</p>
            )}
            <p className="truncate text-xs text-zinc-500">
              {ROOM_TYPE_LABELS[room.roomType]} · {room.district}, {room.city} ·{' '}
              {formatPrice(room.price)}/tháng
            </p>
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <RoomStatusBadge status={room.status} />
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
        {room.publishedAt ? new Date(room.publishedAt).toLocaleDateString('vi-VN') : '—'}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
        {room.viewCount.toLocaleString('vi-VN')}
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/manage/listings/${room.id}/edit`} aria-label="Sửa tin đăng">
              <Pencil className="h-4 w-4" aria-hidden />
            </Link>
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Xoá tin đăng">
                <Trash2 className="h-4 w-4" aria-hidden />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Xoá tin đăng?</DialogTitle>
              </DialogHeader>
              <DialogBody>
                <p className="text-sm text-zinc-600">
                  Tin đăng &quot;{room.title}&quot; sẽ bị xoá và không thể khôi phục.
                </p>
              </DialogBody>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Huỷ
                  </Button>
                </DialogClose>
                <Button
                  type="button"
                  variant="danger"
                  onClick={handleDelete}
                  disabled={deleteRoom.isPending}
                >
                  {deleteRoom.isPending ? 'Đang xoá…' : 'Xoá tin đăng'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </td>
    </tr>
  );
}

function DashboardSkeleton() {
  return <Skeleton className="h-96 w-full rounded-xl" />;
}
