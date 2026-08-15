'use client';

import Link from 'next/link';
import { Pencil, PlusCircle, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { RoomStatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { MyRoomItem } from '@/features/rooms/api';
import { useDeleteRoom } from '@/features/rooms/hooks';
import { ROOM_STATUS_LABELS, ROOM_TYPE_LABELS } from '@/lib/constants';
import { formatPrice } from '@/lib/utils';

const PLACEHOLDER_IMAGE = 'https://placehold.co/200x150?text=Tro+Oi';

export function ListingsToolbar({
  keyword,
  status,
  allStatusValue,
  onKeywordChange,
  onStatusChange,
}: {
  keyword: string;
  status: string;
  allStatusValue: string;
  onKeywordChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-zinc-200 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
      <h2 className="font-semibold">Tin đăng của tôi</h2>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            aria-hidden
          />
          <Input
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
            placeholder="Tìm theo tên tin đăng…"
            aria-label="Tìm theo tên tin đăng"
            className="pl-9 sm:w-56"
          />
        </div>
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger
            aria-label="Lọc theo trạng thái"
            className="sm:w-44"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={allStatusValue}>Tất cả trạng thái</SelectItem>
            {Object.entries(ROOM_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/manage/listings/new">
            <PlusCircle className="h-4 w-4" aria-hidden />
            Đăng tin mới
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function MyListingsTable({ rooms }: { rooms: MyRoomItem[] }) {
  return (
    <>
      <div className="space-y-3 p-3 md:hidden">
        {rooms.map((room) => <MobileRoomCard key={room.id} room={room} />)}
      </div>
      <div className="hidden overflow-x-auto md:block">
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
          {rooms.map((room) => (
            <RoomRow key={room.id} room={room} />
          ))}
        </tbody>
        </table>
      </div>
    </>
  );
}

function MobileRoomCard({ room }: { room: MyRoomItem }) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-3 shadow-card">
      <div className="flex gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- API images can use arbitrary hosts. */}
        <img
          src={room.images[0]?.url ?? PLACEHOLDER_IMAGE}
          alt=""
          className="h-20 w-20 shrink-0 rounded-lg object-cover"
        />
        <div className="min-w-0 flex-1">
          {room.status === 'active' ? (
            <Link href={`/room/${room.slug}`} className="line-clamp-2 text-sm font-semibold text-zinc-900 hover:text-brand-700">
              {room.title}
            </Link>
          ) : (
            <p className="line-clamp-2 text-sm font-semibold text-zinc-900">{room.title}</p>
          )}
          <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
            {ROOM_TYPE_LABELS[room.roomType]} · {[room.district, room.city].filter(Boolean).join(', ')}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-zinc-100 pt-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand-700">
            {formatPrice(room.price)}<span className="font-normal text-zinc-500">/tháng</span>
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">{room.viewCount.toLocaleString('vi-VN')} lượt xem</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <RoomStatusBadge status={room.status} />
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/manage/listings/${room.id}/edit`} aria-label="Sửa tin đăng">
              <Pencil className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <DeleteListingDialog room={room} />
        </div>
      </div>
    </article>
  );
}

function RoomRow({ room }: { room: MyRoomItem }) {
  return (
    <tr className="align-middle">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- API images can use arbitrary hosts. */}
          <img
            src={room.images[0]?.url ?? PLACEHOLDER_IMAGE}
            alt=""
            className="h-12 w-12 shrink-0 rounded-md object-cover"
          />
          <div className="min-w-0">
            {room.status === 'active' ? (
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
              {ROOM_TYPE_LABELS[room.roomType]} · {[room.district, room.city].filter(Boolean).join(', ')} ·{' '}
              {formatPrice(room.price)}/tháng
            </p>
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <RoomStatusBadge status={room.status} />
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
        {room.publishedAt
          ? new Date(room.publishedAt).toLocaleDateString('vi-VN')
          : '—'}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
        {room.viewCount.toLocaleString('vi-VN')}
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild>
            <Link
              href={`/manage/listings/${room.id}/edit`}
              aria-label="Sửa tin đăng"
            >
              <Pencil className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <DeleteListingDialog room={room} />
        </div>
      </td>
    </tr>
  );
}

function DeleteListingDialog({ room }: { room: MyRoomItem }) {
  const deleteRoom = useDeleteRoom();

  async function handleDelete() {
    try {
      await deleteRoom.mutateAsync(room.id);
      toast.success('Đã xoá tin đăng.');
    } catch {
      toast.error('Không xoá được tin đăng, thử lại nhé.');
    }
  }

  return (
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
  );
}
