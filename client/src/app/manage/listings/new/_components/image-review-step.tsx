'use client';

import { ImagePlus, X } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGES_PER_ROOM,
  ROOM_TYPE_LABELS,
} from '@/lib/constants';
import type { CreateRoomFormInput } from '@/features/rooms/schemas';
import { ReviewRow } from './new-listing-ui';

export interface StagedImage {
  file: File;
  previewUrl: string;
}

export function ImageReviewStep({
  images,
  imageError,
  title,
  roomType,
  price,
  area,
  city,
  district,
  amenityCount,
  onFiles,
  onRemove,
}: {
  images: StagedImage[];
  imageError: string | null;
  title?: string;
  roomType?: CreateRoomFormInput['roomType'];
  price: number;
  area: number;
  city?: string;
  district?: string;
  amenityCount: number;
  onFiles: (files: FileList | null) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((image, index) => (
            <div
              key={image.previewUrl}
              className="group relative aspect-square overflow-hidden rounded-lg border border-zinc-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
              <img
                src={image.previewUrl}
                alt=""
                className="h-full w-full object-cover"
              />
              {index === 0 ? (
                <span className="absolute bottom-1 left-1 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                  Ảnh bìa
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => onRemove(index)}
                aria-label="Xoá ảnh"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          ))}

          {images.length < MAX_IMAGES_PER_ROOM ? (
            <label className="relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-zinc-300 text-zinc-500 transition-colors hover:border-brand-600 hover:text-brand-600 focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600 focus-within:ring-offset-2">
              <input
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(',')}
                multiple
                aria-label="Thêm ảnh phòng"
                aria-describedby={
                  imageError ? 'listing-images-error' : 'listing-images-help'
                }
                aria-invalid={Boolean(imageError)}
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={(event) => {
                  onFiles(event.target.files);
                  event.target.value = '';
                }}
              />
              <ImagePlus className="h-5 w-5" aria-hidden />
              <span className="text-xs">Thêm ảnh</span>
            </label>
          ) : null}
        </div>
        <p id="listing-images-help" className="text-xs text-zinc-500">
          Cần ít nhất 1 ảnh. Ảnh đầu tiên sẽ là ảnh bìa. Tối đa{' '}
          {MAX_IMAGES_PER_ROOM} ảnh, mỗi ảnh dưới 5MB.
        </p>
        {imageError ? (
          <p
            id="listing-images-error"
            role="alert"
            className="text-sm text-danger-600"
          >
            {imageError}
          </p>
        ) : null}
      </div>

      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 lg:hidden">
        <h3 className="mb-2 text-sm font-semibold text-zinc-900">
          Xem lại thông tin
        </h3>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
          <ReviewRow label="Tiêu đề" value={title || '—'} />
          <ReviewRow
            label="Loại hình"
            value={roomType ? ROOM_TYPE_LABELS[roomType] : '—'}
          />
          <ReviewRow
            label="Giá thuê"
            value={price > 0 ? `${formatPrice(price)}/tháng` : '—'}
          />
          <ReviewRow
            label="Diện tích"
            value={area > 0 ? `${area} m²` : '—'}
          />
          <ReviewRow
            label="Vị trí"
            value={[district, city].filter(Boolean).join(', ') || '—'}
          />
          <ReviewRow label="Tiện ích" value={`${amenityCount} tiện ích`} />
        </dl>
      </div>
    </div>
  );
}
