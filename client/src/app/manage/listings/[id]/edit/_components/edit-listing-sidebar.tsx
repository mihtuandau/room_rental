'use client';

import { Banknote, Eye, Trash2 } from 'lucide-react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
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
import { Field } from '@/features/auth/components/field';
import type { MyRoomDetail } from '@/features/rooms/api';
import type { CreateRoomFormInput } from '@/features/rooms/schemas';
import {
  ROOM_STATUS_DESCRIPTIONS,
  ROOM_STATUS_LABELS,
} from '@/lib/constants';

export function EditListingSidebar({
  room,
  register,
  errors,
  isDeleting,
  onDelete,
}: {
  room: MyRoomDetail;
  register: UseFormRegister<CreateRoomFormInput>;
  errors: FieldErrors<CreateRoomFormInput>;
  isDeleting: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <Banknote className="h-4 w-4 text-zinc-500" aria-hidden />
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Giá thuê
          </h2>
        </div>
        <Field
          id="price"
          label="Giá thuê (đ/tháng)"
          type="number"
          inputMode="numeric"
          placeholder="2500000"
          error={errors.price?.message}
          {...register('price')}
        />
        <Field
          id="deposit"
          label="Tiền cọc (đ)"
          type="number"
          inputMode="numeric"
          placeholder="Không bắt buộc"
          error={errors.deposit?.message}
          {...register('deposit')}
        />
      </section>

      <section className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-zinc-500" aria-hidden />
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Trạng thái hiển thị
          </h2>
        </div>
        <div className="flex items-start gap-3 rounded-lg border border-brand-600 bg-brand-50 p-4">
          <span
            className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600"
            aria-hidden
          />
          <div>
            <p className="text-sm font-semibold text-zinc-900">
              {ROOM_STATUS_LABELS[room.status]}
            </p>
            <p className="mt-0.5 text-xs text-zinc-600">
              {ROOM_STATUS_DESCRIPTIONS[room.status]}
            </p>
          </div>
        </div>
        <p className="text-xs text-zinc-500">
          Trạng thái do admin kiểm duyệt, bạn không thể tự thay đổi.
        </p>
      </section>

      <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Thông số nhanh
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Field
            id="area"
            label="Diện tích (m²)"
            type="number"
            inputMode="decimal"
            placeholder="20"
            error={errors.area?.message}
            {...register('area')}
          />
          <Field
            id="bedrooms"
            label="Phòng ngủ"
            type="number"
            inputMode="numeric"
            placeholder="Không bắt buộc"
            error={errors.bedrooms?.message}
            {...register('bedrooms')}
          />
          <Field
            id="bathrooms"
            label="Phòng tắm"
            type="number"
            inputMode="numeric"
            placeholder="Không bắt buộc"
            error={errors.bathrooms?.message}
            {...register('bathrooms')}
          />
          <Field
            id="maxOccupants"
            label="Số người tối đa"
            type="number"
            inputMode="numeric"
            placeholder="Không bắt buộc"
            error={errors.maxOccupants?.message}
            {...register('maxOccupants')}
          />
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Khu vực nguy hiểm
        </h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" className="w-full">
              <Trash2 className="h-4 w-4" aria-hidden />
              Xoá tin đăng
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xoá tin đăng?</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <p className="text-sm text-zinc-600">
                Tin đăng &quot;{room.title}&quot; sẽ bị xoá và không thể khôi
                phục.
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
                onClick={onDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Đang xoá…' : 'Xoá tin đăng'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </div>
  );
}
