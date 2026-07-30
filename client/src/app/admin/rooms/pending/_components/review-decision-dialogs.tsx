'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import type { AdminPendingRoom } from '@/features/admin/api';

export function ApproveRoomDialog({
  room,
  pending,
  onClose,
  onApprove,
}: {
  room: AdminPendingRoom | null;
  pending: boolean;
  onClose: () => void;
  onApprove: () => void;
}) {
  return (
    <Dialog
      open={Boolean(room)}
      onOpenChange={(open) => !open && !pending && onClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duyệt tin này?</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p className="text-sm leading-6 text-zinc-600">
            “{room?.title}” sẽ được công khai cho người thuê tìm kiếm.
          </p>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={onApprove} disabled={pending}>
            {pending ? 'Đang duyệt…' : 'Duyệt tin'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RejectRoomDialog({
  room,
  note,
  pending,
  onNote,
  onClose,
  onReject,
}: {
  room: AdminPendingRoom | null;
  note: string;
  pending: boolean;
  onNote: (value: string) => void;
  onClose: () => void;
  onReject: () => void;
}) {
  return (
    <Dialog
      open={Boolean(room)}
      onOpenChange={(open) => !open && !pending && onClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Từ chối tin đăng</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p className="text-sm text-zinc-600">
            Nêu rõ lý do để chủ trọ có thể chỉnh sửa và gửi lại.
          </p>
          <Textarea
            className="mt-4 min-h-28"
            value={note}
            onChange={(event) => onNote(event.target.value)}
            placeholder="Ví dụ: Ảnh chưa thể hiện rõ phòng thực tế…"
          />
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            variant="danger"
            disabled={!note.trim() || pending}
            onClick={onReject}
          >
            {pending ? 'Đang gửi…' : 'Từ chối tin'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
