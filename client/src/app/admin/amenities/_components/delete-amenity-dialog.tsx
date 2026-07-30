'use client';

import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Amenity } from '@/features/amenities/api';

export function DeleteAmenityDialog({
  item,
  pending,
  onClose,
  onDelete,
}: {
  item: Amenity | null;
  pending: boolean;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <Dialog open={Boolean(item)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xóa tiện ích?</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="flex gap-3 rounded-lg bg-warning-50 p-4 text-sm leading-6 text-zinc-700">
            <TriangleAlert className="h-5 w-5 shrink-0 text-warning-600" />
            “{item?.name}” sẽ bị gỡ khỏi catalogue và mọi tin đăng liên quan.
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button variant="danger" disabled={pending} onClick={onDelete}>
            {pending ? 'Đang xóa…' : 'Xóa tiện ích'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
