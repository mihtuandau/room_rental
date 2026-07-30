'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Amenity } from '@/features/amenities/api';
import type { AmenityType } from '@/lib/constants';
import {
  AMENITY_ICON_LABELS,
  AMENITY_ICON_OPTIONS,
  AMENITY_TYPES,
  AMENITY_TYPE_LABELS,
  type AmenityFormValues,
} from '../_lib/amenities-config';
import { AmenitySymbol } from './amenity-symbol';

export function AmenityFormDialog({
  item,
  loading,
  onClose,
  onSave,
}: {
  item: Amenity | 'new' | null;
  loading: boolean;
  onClose: () => void;
  onSave: (value: AmenityFormValues) => void;
}) {
  const data = item && item !== 'new' ? item : null;
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [type, setType] = useState<AmenityType>('basic');

  return (
    <Dialog open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-2xl overflow-hidden"
        onOpenAutoFocus={() => {
          setName(data?.name ?? '');
          setIcon(data?.icon ?? '');
          setDescription(data?.description ?? '');
          setIsActive(data?.isActive ?? true);
          setType(data?.type ?? 'basic');
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {data ? 'Chỉnh sửa tiện ích' : 'Thêm tiện ích mới'}
          </DialogTitle>
          <p className="mt-1 text-sm text-zinc-600">
            Cập nhật thông tin tiện ích cho hệ thống Trọ Ơi.
          </p>
        </DialogHeader>
        <DialogBody className="grid gap-x-6 gap-y-5 sm:grid-cols-[minmax(0,1.4fr)_minmax(180px,1fr)]">
          <label className="block text-sm font-medium text-zinc-800">
            Tên tiện ích
            <Input
              className="mt-2 h-11"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-zinc-800">
            <span className="block">Danh mục</span>
            <Select
              value={type}
              onValueChange={(value) => setType(value as AmenityType)}
            >
              <SelectTrigger className="mt-2 h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AMENITY_TYPES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {AMENITY_TYPE_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <section className="border-t border-zinc-100 pt-5 sm:col-span-2">
            <p className="text-sm font-medium text-zinc-800">Chọn biểu tượng</p>
            <p className="mt-1 text-xs text-zinc-500">
              Biểu tượng giúp người thuê nhận diện tiện ích nhanh hơn.
            </p>
            <div className="mt-3 grid grid-cols-5 gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-4 sm:grid-cols-10">
              {AMENITY_ICON_OPTIONS.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`Chọn biểu tượng ${AMENITY_ICON_LABELS[value]}`}
                  aria-pressed={icon === value}
                  title={AMENITY_ICON_LABELS[value]}
                  onClick={() => setIcon(value)}
                  className={`relative flex h-11 items-center justify-center rounded-md border bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${icon === value ? 'border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-100' : 'border-zinc-200 hover:border-brand-300'}`}
                >
                  <AmenitySymbol icon={value} />
                  {icon === value ? (
                    <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-brand-600 text-white">
                      <Check className="h-2.5 w-2.5" aria-hidden />
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </section>
          <label className="border-t border-zinc-100 pt-5 text-sm font-medium text-zinc-800 sm:col-span-2">
            Mô tả tiện ích
            <Textarea
              className="mt-2 min-h-24 resize-none"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Nhập mô tả chi tiết về tiện ích này..."
            />
          </label>
          <div className="flex items-center justify-between rounded-lg border border-brand-100 bg-brand-50/50 p-4 sm:col-span-2">
            <div>
              <p className="text-sm font-medium text-zinc-900">
                Hiển thị trên tin đăng
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Tắt tùy chọn này để tạm ẩn tiện ích khỏi catalogue công khai.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              aria-label="Hiển thị tiện ích trên tin đăng"
              onClick={() => setIsActive((value) => !value)}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 ${isActive ? 'bg-brand-600' : 'bg-zinc-300'}`}
            >
              <span
                className={`h-5 w-5 rounded-full bg-white shadow-card transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            disabled={!name.trim() || loading}
            onClick={() =>
              onSave({
                name: name.trim(),
                type,
                ...(icon.trim() ? { icon: icon.trim() } : {}),
                ...(description.trim()
                  ? { description: description.trim() }
                  : {}),
                isActive,
              })
            }
          >
            {loading ? 'Đang lưu…' : 'Lưu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
