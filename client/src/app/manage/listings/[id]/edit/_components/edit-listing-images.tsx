'use client';

import { ImagePlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGES_PER_ROOM } from '@/lib/constants';
import type { MyRoomDetail } from '@/features/rooms/api';

export function EditListingImages({
  images,
  isUploading,
  isDeleting,
  onFiles,
  onDelete,
}: {
  images: MyRoomDetail['images'];
  isUploading: boolean;
  isDeleting: boolean;
  onFiles: (files: FileList | null) => void;
  onDelete: (imageId: string) => void;
}) {
  const canAdd = images.length < MAX_IMAGES_PER_ROOM;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Hình ảnh
        </h2>
        {canAdd ? (
          <label className="relative flex cursor-pointer items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800">
            <input
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              multiple
              disabled={isUploading}
              aria-label="Thêm ảnh phòng"
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={(event) => {
                onFiles(event.target.files);
                event.target.value = '';
              }}
            />
            <ImagePlus className="h-4 w-4" aria-hidden />
            {isUploading ? 'Đang tải…' : 'Thêm ảnh'}
          </label>
        ) : null}
      </div>

      <div className="grid grid-cols-3 auto-rows-[96px] gap-3">
        {images.map((image, index) => (
          <div
            key={image.id}
            className={cn(
              'group relative overflow-hidden rounded-lg border border-zinc-200',
              index === 0 && 'col-span-2 row-span-2',
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary remote image */}
            <img src={image.url} alt="" className="h-full w-full object-cover" />
            {image.isCover ? (
              <span className="absolute bottom-1 left-1 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                Ảnh bìa
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => onDelete(image.id)}
              disabled={isDeleting}
              aria-label="Xoá ảnh"
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-60"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        ))}

        {canAdd ? (
          <label className="relative flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-zinc-300 text-zinc-400 transition-colors hover:border-brand-600 hover:text-brand-600">
            <input
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              multiple
              disabled={isUploading}
              aria-label="Thêm ảnh phòng"
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={(event) => {
                onFiles(event.target.files);
                event.target.value = '';
              }}
            />
            <ImagePlus className="h-5 w-5" aria-hidden />
            <span className="text-xs">
              {isUploading ? 'Đang tải…' : 'Thêm ảnh'}
            </span>
          </label>
        ) : null}
      </div>
      <p className="mt-3 text-xs text-zinc-500">
        Tối đa {MAX_IMAGES_PER_ROOM} ảnh, mỗi ảnh dưới 5MB. Thêm/xoá ảnh có hiệu
        lực ngay, không cần bấm lưu.
      </p>
    </section>
  );
}
