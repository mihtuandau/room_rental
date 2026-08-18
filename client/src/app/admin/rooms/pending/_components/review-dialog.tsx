'use client';

import { EyeOff, MapPin, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ErrorState, PermissionDeniedState } from '@/components/ui/states';
import { Skeleton } from '@/components/ui/skeleton';
import { isForbiddenError } from '@/lib/api-client';
import type { AdminPendingRoom } from '@/features/admin/api';
import { useAdminRoomReview } from '@/features/admin/hooks';
import { formatDate } from '../_lib/pending-config';

export function ReviewDialog({
  roomId,
  onClose,
  onApprove,
  onReject,
  onHide,
  onRestore,
  onToggleVerify,
  isVerifying,
}: {
  roomId: number | null;
  onClose: () => void;
  onApprove: (room: AdminPendingRoom) => void;
  onReject: (room: AdminPendingRoom) => void;
  onHide: (room: AdminPendingRoom) => void;
  onRestore: (room: AdminPendingRoom) => void;
  onToggleVerify: (room: AdminPendingRoom) => void;
  isVerifying: boolean;
}) {
  const review = useAdminRoomReview(roomId);
  const room = review.data;

  return (
    <Dialog open={roomId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Chi tiết tin đăng</DialogTitle></DialogHeader>
        <DialogBody>
          {review.isPending ? (
            <Skeleton className="h-96 w-full" />
          ) : review.isError ? isForbiddenError(review.error) ? (
            <PermissionDeniedState />
          ) : (
            <ErrorState onRetry={() => void review.refetch()} />
          ) : room ? (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-3">
                {room.images.slice(0, 3).map((image) => (
                  // eslint-disable-next-line @next/next/no-img-element -- moderation images can use arbitrary remote sources
                  <img key={image.url} src={image.url} alt="Ảnh tin đăng" className="h-36 w-full rounded-md object-cover" />
                ))}
                {room.images.length === 0 ? (
                  <div className="col-span-3 flex h-36 items-center justify-center rounded-md bg-zinc-100 text-sm text-zinc-500">Tin chưa có ảnh</div>
                ) : null}
              </div>
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900">{room.title}</h3>
                    <p className="mt-1 flex items-center gap-1 text-sm text-zinc-600">
                      <MapPin className="h-4 w-4" aria-hidden />
                      {[room.address, room.ward, room.district, room.city].filter(Boolean).join(', ')}
                    </p>
                  </div>
                  {room.status !== 'hidden' ? (
                    <Button variant="outline" size="sm" onClick={() => onToggleVerify(room)} disabled={isVerifying}>
                      <ShieldCheck className="h-4 w-4" aria-hidden />
                      {room.isVerified ? 'Bỏ xác minh' : 'Xác minh tin'}
                    </Button>
                  ) : null}
                </div>
                <p className="mt-4 whitespace-pre-line text-sm leading-6 text-zinc-700">{room.description || 'Chủ trọ chưa bổ sung mô tả.'}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Info title="Chủ trọ" lines={[room.owner.fullName || 'Chưa cập nhật tên', room.owner.contactPhone || room.owner.phone || 'Chưa có số điện thoại', room.owner.email || 'Chưa có email']} />
                <Info title="Tiện ích" lines={room.amenities.length ? room.amenities.map((amenity) => amenity.name) : ['Chưa khai báo tiện ích']} />
              </div>
              <div>
                <h4 className="font-semibold text-zinc-900">Lịch sử kiểm duyệt</h4>
                <div className="mt-3 space-y-3">
                  {room.moderations.length ? room.moderations.map((item) => (
                    <div key={item.id} className="border-l-2 border-brand-200 pl-3">
                      <p className="text-sm font-medium text-zinc-800">{item.action} · {item.admin.fullName || 'Quản trị viên'}</p>
                      <p className="text-xs text-zinc-500">{formatDate(item.createdAt)}{item.note ? ` — ${item.note}` : ''}</p>
                    </div>
                  )) : <p className="text-sm text-zinc-500">Chưa có lịch sử kiểm duyệt.</p>}
                </div>
              </div>
            </div>
          ) : null}
        </DialogBody>
        {room ? (
          <DialogFooter>
            {room.status === 'pending' ? (
              <>
                <Button variant="danger" onClick={() => onReject(room)}>Từ chối</Button>
                <Button onClick={() => onApprove(room)}>Duyệt tin</Button>
              </>
            ) : room.status === 'active' ? (
              <Button variant="danger" onClick={() => onHide(room)}><EyeOff className="h-4 w-4" aria-hidden />Ẩn tin</Button>
            ) : (
              <Button onClick={() => onRestore(room)}>Khôi phục tin</Button>
            )}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function Info({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-md bg-zinc-50 p-4">
      <h4 className="text-sm font-semibold text-zinc-900">{title}</h4>
      <div className="mt-2 space-y-1 text-sm text-zinc-600">{lines.map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}</div>
    </div>
  );
}
