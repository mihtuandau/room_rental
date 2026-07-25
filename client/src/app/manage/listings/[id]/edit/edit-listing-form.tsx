'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ImagePlus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import {
  ACCEPTED_IMAGE_TYPES,
  AMENITY_TYPE_LABELS,
  MAX_IMAGES_PER_ROOM,
  MAX_IMAGE_BYTES,
  ROOM_TYPE_OPTIONS,
  type AmenityType,
} from '@/lib/constants';
import { uploadToCloudinary } from '@/features/storage/api';
import { confirmRoomImage, type MyRoomDetail } from '@/features/rooms/api';
import {
  roomKeys,
  useDeleteRoom,
  useDeleteRoomImage,
  useSetRoomAmenities,
  useUpdateRoom,
} from '@/features/rooms/hooks';
import {
  createRoomSchema,
  type CreateRoomFormInput,
  type CreateRoomFormOutput,
} from '@/features/rooms/schemas';
import type { Amenity } from '@/features/amenities/api';
import type { ProvinceOption } from '@/features/locations/api';

const AMENITY_TYPE_ORDER: AmenityType[] = ['basic', 'utility', 'security', 'nearby'];

export function EditListingForm({
  room,
  amenities,
  provinces,
}: {
  room: MyRoomDetail;
  amenities: Amenity[];
  provinces: ProvinceOption[];
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const updateRoom = useUpdateRoom(room.id);
  const setRoomAmenities = useSetRoomAmenities();
  const deleteRoom = useDeleteRoom();
  const deleteImage = useDeleteRoomImage(room.id);

  const [selectedAmenityIds, setSelectedAmenityIds] = useState<number[]>(
    room.amenities.map((a) => a.id),
  );
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateRoomFormInput, unknown, CreateRoomFormOutput>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      title: room.title,
      description: room.description ?? '',
      roomType: room.roomType,
      price: room.price,
      area: room.area ?? undefined,
      deposit: room.deposit ?? undefined,
      bedrooms: room.bedrooms ?? undefined,
      bathrooms: room.bathrooms ?? undefined,
      maxOccupants: room.maxOccupants ?? undefined,
      city: room.city,
      district: room.district,
      ward: room.ward ?? '',
      address: room.address ?? '',
    },
  });

  const roomType = watch('roomType');
  const city = watch('city');

  const amenityGroups = AMENITY_TYPE_ORDER.map((type) => ({
    type,
    items: amenities.filter((a) => a.type === type),
  })).filter((g) => g.items.length > 0);

  const toggleAmenity = (id: number) => {
    setSelectedAmenityIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    const tooBig = files.find((f) => f.size > MAX_IMAGE_BYTES);
    if (tooBig) return toast.error(`"${tooBig.name}" vượt quá 5MB.`);
    const badType = files.find((f) => !ACCEPTED_IMAGE_TYPES.includes(f.type));
    if (badType) return toast.error('Chỉ chấp nhận ảnh JPG, PNG hoặc WebP.');
    if (room.images.length + files.length > MAX_IMAGES_PER_ROOM) {
      return toast.error(`Mỗi tin chỉ đăng tối đa ${MAX_IMAGES_PER_ROOM} ảnh.`);
    }

    setIsUploadingImage(true);
    try {
      // Sequential, not Promise.all — each file needs its own fresh signature.
      for (const file of files) {
        const uploaded = await uploadToCloudinary(file, 'room-image');
        await confirmRoomImage(room.id, uploaded, room.images.length === 0);
      }
      await qc.invalidateQueries({ queryKey: roomKeys.mineDetail(room.id) });
    } catch {
      toast.error('Tải ảnh lên thất bại, thử lại nhé.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteImage = (imageId: string) => {
    deleteImage.mutate(imageId, {
      onError: () => toast.error('Không xoá được ảnh, thử lại nhé.'),
    });
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateRoom.mutateAsync({
        title: values.title,
        description: values.description || undefined,
        roomType: values.roomType,
        price: values.price,
        area: values.area,
        deposit: values.deposit,
        bedrooms: values.bedrooms,
        bathrooms: values.bathrooms,
        maxOccupants: values.maxOccupants,
        city: values.city,
        district: values.district,
        ward: values.ward || undefined,
        address: values.address || undefined,
      });

      await setRoomAmenities.mutateAsync({
        roomId: room.id,
        amenityIds: selectedAmenityIds,
      });

      toast.success('Đã lưu thay đổi.');
      router.push('/manage/listings');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/manage/listings/${room.id}/edit`)}`);
        return;
      }
      toast.error('Không lưu được, thử lại nhé.');
    }
  });

  const handleDelete = async () => {
    try {
      await deleteRoom.mutateAsync(room.id);
      toast.success('Đã xoá tin đăng.');
      router.push('/manage/listings');
    } catch {
      toast.error('Không xoá được tin đăng, thử lại nhé.');
    }
  };

  const busy = isSubmitting || isUploadingImage;

  return (
    <form onSubmit={onSubmit} className="space-y-8" noValidate>
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Thông tin cơ bản
        </h2>

        <Field
          id="title"
          label="Tiêu đề tin đăng"
          placeholder="Phòng trọ full nội thất gần ĐH Bách Khoa"
          error={errors.title?.message}
          {...register('title')}
        />

        <div>
          <label className="mb-1 block text-sm font-medium">Loại phòng</label>
          <div className="flex flex-wrap gap-2">
            {ROOM_TYPE_OPTIONS.map((type) => {
              const active = roomType === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setValue('roomType', type.value, { shouldValidate: true })}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2',
                    active
                      ? 'border-brand-600 bg-brand-50 font-medium text-brand-700'
                      : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50',
                  )}
                >
                  {type.label}
                </button>
              );
            })}
          </div>
          {errors.roomType && (
            <p className="mt-1 text-sm text-danger-600">{errors.roomType.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium">
            Mô tả
          </label>
          <Textarea
            id="description"
            rows={4}
            placeholder="Phòng sạch sẽ, an ninh, giờ giấc tự do, gần trường đại học…"
            error={!!errors.description}
            {...register('description')}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-danger-600">{errors.description.message}</p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Giá &amp; diện tích
        </h2>
        <div className="grid grid-cols-2 gap-4">
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
            id="maxOccupants"
            label="Số người tối đa"
            type="number"
            inputMode="numeric"
            placeholder="Không bắt buộc"
            error={errors.maxOccupants?.message}
            {...register('maxOccupants')}
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
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Vị trí
        </h2>
        <div>
          <label className="mb-1 block text-sm font-medium">Tỉnh, thành phố</label>
          <Select
            value={city || undefined}
            onValueChange={(v) => setValue('city', v, { shouldValidate: true })}
          >
            <SelectTrigger aria-label="Tỉnh, thành phố">
              <SelectValue placeholder="Chọn tỉnh, thành phố" />
            </SelectTrigger>
            <SelectContent>
              {provinces.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.city && (
            <p className="mt-1 text-sm text-danger-600">{errors.city.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field
            id="district"
            label="Quận, huyện"
            placeholder="Quận 7"
            error={errors.district?.message}
            {...register('district')}
          />
          <Field
            id="ward"
            label="Phường, xã"
            placeholder="Không bắt buộc"
            error={errors.ward?.message}
            {...register('ward')}
          />
        </div>

        <Field
          id="address"
          label="Địa chỉ cụ thể"
          placeholder="Số nhà, tên đường (không bắt buộc)"
          error={errors.address?.message}
          {...register('address')}
        />
      </section>

      {amenityGroups.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Tiện ích
          </h2>
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            {amenityGroups.map((group) => (
              <div key={group.type} className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {AMENITY_TYPE_LABELS[group.type]}
                </p>
                {group.items.map((amenity) => {
                  const id = `amenity-${amenity.id}`;
                  return (
                    <label
                      key={amenity.id}
                      htmlFor={id}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <Checkbox
                        id={id}
                        checked={selectedAmenityIds.includes(amenity.id)}
                        onCheckedChange={() => toggleAmenity(amenity.id)}
                      />
                      {amenity.name}
                    </label>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Hình ảnh
        </h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {room.images.map((image) => (
            <div
              key={image.id}
              className="group relative aspect-square overflow-hidden rounded-lg border border-zinc-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- remote host (Cloudinary), see upload-image-cloudinary skill */}
              <img src={image.url} alt="" className="h-full w-full object-cover" />
              {image.isCover && (
                <span className="absolute bottom-1 left-1 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                  Ảnh bìa
                </span>
              )}
              <button
                type="button"
                onClick={() => handleDeleteImage(image.id)}
                disabled={deleteImage.isPending}
                aria-label="Xoá ảnh"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-60"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          ))}

          {room.images.length < MAX_IMAGES_PER_ROOM && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-zinc-300 text-zinc-400 transition-colors hover:border-brand-600 hover:text-brand-600 disabled:pointer-events-none disabled:opacity-60"
            >
              <ImagePlus className="h-5 w-5" aria-hidden />
              <span className="text-xs">{isUploadingImage ? 'Đang tải…' : 'Thêm ảnh'}</span>
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          multiple
          className="sr-only"
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <p className="text-xs text-zinc-500">
          Tối đa {MAX_IMAGES_PER_ROOM} ảnh, mỗi ảnh dưới 5MB. Thêm/xoá ảnh có hiệu lực ngay,
          không cần bấm lưu.
        </p>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" size="lg" className="flex-1" disabled={busy}>
          {isSubmitting ? 'Đang lưu…' : 'Lưu thay đổi'}
        </Button>

        <Dialog>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="lg">
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
                Tin đăng &quot;{room.title}&quot; sẽ bị xoá và không thể khôi phục.
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
                onClick={handleDelete}
                disabled={deleteRoom.isPending}
              >
                {deleteRoom.isPending ? 'Đang xoá…' : 'Xoá tin đăng'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </form>
  );
}
