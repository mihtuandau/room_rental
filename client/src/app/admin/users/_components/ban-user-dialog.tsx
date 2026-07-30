'use client';

import { LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { AdminUser } from '@/features/admin/api';

export function BanUserDialog({
  user,
  isPending,
  onClose,
  onConfirm,
}: {
  user: AdminUser | null;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (user: AdminUser) => void;
}) {
  return (
    <Dialog
      open={Boolean(user)}
      onOpenChange={(open) => {
        if (!open && !isPending) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Khóa tài khoản này?</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p className="text-sm text-zinc-600">
            {user?.fullName || user?.phone || 'Tài khoản này'} sẽ không thể
            đăng nhập và toàn bộ phiên hiện tại sẽ bị thu hồi.
          </p>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Hủy
          </Button>
          <Button
            variant="danger"
            disabled={!user || isPending}
            onClick={() => {
              if (user) onConfirm(user);
            }}
          >
            <LockKeyhole className="h-4 w-4" aria-hidden />
            {isPending ? 'Đang khóa…' : 'Khóa tài khoản'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
