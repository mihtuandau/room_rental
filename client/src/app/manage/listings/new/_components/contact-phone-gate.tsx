'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { VN_PHONE } from '@/features/auth/schemas';
import { useUpdateProfile } from '@/features/users/hooks';

export function ContactPhoneGate({
  open,
  initialPhone,
  onOpenChange,
  onVerified,
}: {
  open: boolean;
  initialPhone: string;
  onOpenChange: (open: boolean) => void;
  onVerified: () => Promise<void>;
}) {
  const [phone, setPhone] = useState(initialPhone);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const updateProfile = useUpdateProfile();
  const isPending = updateProfile.isPending;

  async function savePhoneAndContinue() {
    const normalizedPhone = phone.trim();
    if (!VN_PHONE.test(normalizedPhone)) {
      setPhoneError('Số điện thoại không hợp lệ.');
      return;
    }

    setPhoneError(null);
    try {
      await updateProfile.mutateAsync({ contactPhone: normalizedPhone });
      toast.success('Đã lưu số điện thoại. Tin đăng sẽ được tiếp tục.');
      await onVerified();
    } catch {
      toast.error('Không thể lưu số điện thoại. Bạn thử lại nhé.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Thêm số điện thoại để đăng tin
          </DialogTitle>
          <p className="mt-1 text-sm text-zinc-600">
            Số điện thoại giúp người thuê liên hệ với bạn và bảo vệ tin đăng.
          </p>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <div>
            <label
              htmlFor="listingContactPhone"
              className="mb-1.5 block text-sm font-medium"
            >
              Số điện thoại liên hệ
            </label>
            <Input
              id="listingContactPhone"
              inputMode="tel"
              autoComplete="tel"
              placeholder="0912345678"
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value);
                setPhoneError(null);
              }}
              error={Boolean(phoneError)}
              disabled={isPending}
            />
            {phoneError ? (
              <p className="mt-1 text-sm text-danger-600">{phoneError}</p>
            ) : null}
          </div>
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Để sau
          </Button>
          <Button
            type="button"
            onClick={() => void savePhoneAndContinue()}
            disabled={isPending}
          >
            {isPending ? 'Đang lưu…' : 'Lưu và tiếp tục đăng tin'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
