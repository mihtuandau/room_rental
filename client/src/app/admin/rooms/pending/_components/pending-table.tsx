'use client';

import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  MapPin,
  RotateCcw,
  Search,
  XCircle,
} from 'lucide-react';
import {
  adminStickyActionCellClassName,
  adminStickyActionHeadClassName,
  adminTableHeadClassName,
  adminTableRowClassName,
} from '@/components/admin/admin-page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/states';
import type { AdminPendingRoom } from '@/features/admin/api';
import {
  formatCompactMoney,
  formatDate,
  ROOM_QUEUE_STATUS_LABELS,
  ROOM_TYPE_LABELS,
} from '../_lib/pending-config';

export function PendingTable({
  rooms,
  page,
  total,
  totalPages,
  hasFilters,
  isUpdating,
  onClear,
  onReview,
  onApprove,
  onReject,
  onHide,
  onRestore,
  onPage,
}: {
  rooms: AdminPendingRoom[];
  page: number;
  total: number;
  totalPages: number;
  hasFilters: boolean;
  isUpdating: boolean;
  onClear: () => void;
  onReview: (room: AdminPendingRoom) => void;
  onApprove: (room: AdminPendingRoom) => void;
  onReject: (room: AdminPendingRoom) => void;
  onHide: (room: AdminPendingRoom) => void;
  onRestore: (room: AdminPendingRoom) => void;
  onPage: (page: number) => void;
}) {
  return (
    <>
      {rooms.length === 0 ? (
        <EmptyState
          icon={<Search className="h-10 w-10" />}
          title="Không có tin phù hợp"
          description="Thử thay đổi từ khóa hoặc điều kiện lọc."
          action={hasFilters ? { label: 'Xóa bộ lọc', onClick: onClear } : undefined}
        />
      ) : (
        <div className="overflow-x-auto">
          <p className="px-5 pb-2 text-xs text-zinc-500 md:hidden">
            Vuốt ngang để xem đầy đủ thông tin.
          </p>
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className={adminTableHeadClassName}>
              <tr>
                <th className="px-5 py-3">Ngày gửi</th>
                <th className="px-4 py-3">Tin đăng</th>
                <th className="px-4 py-3">Loại & giá</th>
                <th className="px-4 py-3">Chủ trọ</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className={`${adminStickyActionHeadClassName} px-5 py-3`}>Thao tác</th>
              </tr>
            </thead>
            <tbody className={isUpdating ? 'opacity-60' : undefined}>
              {rooms.map((room) => (
                <RoomRow
                  key={room.id}
                  room={room}
                  onReview={() => onReview(room)}
                  onApprove={() => onApprove(room)}
                  onReject={() => onReject(room)}
                  onHide={() => onHide(room)}
                  onRestore={() => onRestore(room)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
      {total > 0 ? (
        <nav aria-label="Phân trang tin đăng" className="flex items-center justify-between border-t border-zinc-100 px-5 py-3">
          <p className="text-xs text-zinc-500">Trang {page} / {totalPages}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page === 1} onClick={() => onPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Trước
            </Button>
            <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => onPage(page + 1)}>
              Sau
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </nav>
      ) : null}
    </>
  );
}

function RoomRow({
  room,
  onReview,
  onApprove,
  onReject,
  onHide,
  onRestore,
}: {
  room: AdminPendingRoom;
  onReview: () => void;
  onApprove: () => void;
  onReject: () => void;
  onHide: () => void;
  onRestore: () => void;
}) {
  const status = room.status as keyof typeof ROOM_QUEUE_STATUS_LABELS;

  return (
    <tr className={adminTableRowClassName}>
      <td className="px-5 py-4 text-zinc-600">{formatDate(room.createdAt)}</td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-16 overflow-hidden rounded-md bg-zinc-100">
            {room.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin thumbnails can use arbitrary remote sources
              <img src={room.images[0].url} alt="" className="h-full w-full object-cover" />
            ) : (
              <MapPin className="m-4 h-4 w-4 text-zinc-400" />
            )}
          </div>
          <div>
            <p className="max-w-64 truncate font-medium text-zinc-900">{room.title}</p>
            <p className="mt-1 text-xs text-zinc-500">
              {[room.ward, room.district, room.city].filter(Boolean).join(', ')}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <p className="text-zinc-700">{ROOM_TYPE_LABELS[room.roomType]}</p>
        <p className="mt-1 font-medium text-zinc-900">{formatCompactMoney(room.price)}/tháng</p>
      </td>
      <td className="px-4 py-4">
        <p className="font-medium text-zinc-800">{room.owner.fullName || 'Chưa cập nhật tên'}</p>
        <p className="mt-1 text-xs text-zinc-500">
          {room.owner.phone || room.owner.email || 'Chưa có thông tin liên hệ'}
        </p>
      </td>
      <td className="px-4 py-4">
        <div className="space-y-1.5">
          <Badge variant={room.status === 'pending' ? 'warning' : 'neutral'}>
            {ROOM_QUEUE_STATUS_LABELS[status] ?? room.status}
          </Badge>
          <p className={room.isVerified ? 'text-xs text-brand-700' : 'text-xs text-zinc-500'}>
            {room.isVerified ? 'Đã xác minh' : 'Chưa xác minh'}
          </p>
        </div>
      </td>
      <td className={`${adminStickyActionCellClassName} px-5 py-4`}>
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" aria-label={`Xem chi tiết ${room.title}`} onClick={onReview}>
            <Eye className="h-4 w-4" aria-hidden />
          </Button>
          {room.status === 'pending' ? (
            <>
              <Button size="icon" variant="ghost" className="text-brand-700 hover:bg-brand-50 hover:text-brand-800" aria-label={`Duyệt ${room.title}`} onClick={onApprove}>
                <BadgeCheck className="h-4 w-4" aria-hidden />
              </Button>
              <Button size="icon" variant="ghost" className="text-danger-600 hover:bg-danger-50 hover:text-danger-700" aria-label={`Từ chối ${room.title}`} onClick={onReject}>
                <XCircle className="h-4 w-4" aria-hidden />
              </Button>
            </>
          ) : room.status === 'active' ? (
            <Button size="icon" variant="ghost" className="text-danger-600 hover:bg-danger-50 hover:text-danger-700" aria-label={`Ẩn ${room.title}`} onClick={onHide}>
              <EyeOff className="h-4 w-4" aria-hidden />
            </Button>
          ) : (
            <Button size="icon" variant="ghost" className="text-brand-700 hover:bg-brand-50 hover:text-brand-800" aria-label={`Khôi phục ${room.title}`} onClick={onRestore}>
              <RotateCcw className="h-4 w-4" aria-hidden />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}
