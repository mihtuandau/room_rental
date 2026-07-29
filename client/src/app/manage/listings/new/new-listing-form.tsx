'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm, useWatch, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Check, ChevronLeft, ChevronRight, ImagePlus, X } from 'lucide-react';
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
import { Field } from '@/features/auth/components/field';
import { ApiError } from '@/lib/api-client';
import { cn, formatPrice } from '@/lib/utils';
import {
  ACCEPTED_IMAGE_TYPES,
  AMENITY_TYPE_LABELS,
  MAX_IMAGES_PER_ROOM,
  MAX_IMAGE_BYTES,
  ROOM_TYPE_LABELS,
  ROOM_TYPE_OPTIONS,
  type AmenityType,
} from '@/lib/constants';
import { uploadToCloudinary } from '@/features/storage/api';
import { useCreateRoom, useSetRoomAmenities } from '@/features/rooms/hooks';
import { confirmRoomImage } from '@/features/rooms/api';
import {
  createRoomSchema,
  type CreateRoomFormInput,
  type CreateRoomFormOutput,
} from '@/features/rooms/schemas';
import type { Amenity } from '@/features/amenities/api';
import type { ProvinceOption } from '@/features/locations/api';

const AMENITY_TYPE_ORDER: AmenityType[] = ['basic', 'utility', 'security', 'nearby'];

const STEPS = [
  'Thông tin chính',
  'Vị trí',
  'Chi tiết và tiện ích',
  'Hình ảnh và xem lại',
] as const;

const STEP_FIELDS: (keyof CreateRoomFormInput)[][] = [
  ['title', 'roomType', 'price', 'area', 'description'],
  ['city', 'district', 'ward', 'address'],
  ['deposit', 'maxOccupants', 'bedrooms', 'bathrooms'],
  [],
];

const ROOM_TYPES_WITH_ROOM_COUNTS = new Set([
  'whole_house',
  'mini_apartment',
  'serviced_apartment',
]);

interface StagedImage {
  file: File;
  previewUrl: string;
}

export function NewListingForm({
  amenities,
  provinces,
}: {
  amenities: Amenity[];
  provinces: ProvinceOption[];
}) {
  const router = useRouter();
  const createRoom = useCreateRoom();
  const setRoomAmenities = useSetRoomAmenities();

  const [step, setStep] = useState(0);
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<number[]>([]);
  const [images, setImages] = useState<StagedImage[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateRoomFormInput, unknown, CreateRoomFormOutput>({
    resolver: zodResolver(createRoomSchema),
  });

  const [roomType, city, district, price, area, title] = useWatch({
    control,
    name: ['roomType', 'city', 'district', 'price', 'area', 'title'],
  });
  const priceValue = Number(price);
  const areaValue = Number(area);
  const showRoomCounts = ROOM_TYPES_WITH_ROOM_COUNTS.has(roomType);

  const amenityGroups = AMENITY_TYPE_ORDER.map((type) => ({
    type,
    items: amenities.filter((a) => a.type === type),
  })).filter((g) => g.items.length > 0);

  const toggleAmenity = (id: number) => {
    setSelectedAmenityIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  };

  const selectRoomType = (value: CreateRoomFormInput['roomType']) => {
    setValue('roomType', value, { shouldValidate: true });
    if (!ROOM_TYPES_WITH_ROOM_COUNTS.has(value)) {
      setValue('bedrooms', undefined);
      setValue('bathrooms', undefined);
    }
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    // Validate before staging — a rejected file after upload wastes the user's data.
    const tooBig = files.find((f) => f.size > MAX_IMAGE_BYTES);
    if (tooBig) return toast.error(`"${tooBig.name}" vượt quá 5MB.`);
    const badType = files.find((f) => !ACCEPTED_IMAGE_TYPES.includes(f.type));
    if (badType) return toast.error('Chỉ chấp nhận ảnh JPG, PNG hoặc WebP.');
    if (images.length + files.length > MAX_IMAGES_PER_ROOM) {
      return toast.error(`Mỗi tin chỉ đăng tối đa ${MAX_IMAGES_PER_ROOM} ảnh.`);
    }

    setImages((prev) => [
      ...prev,
      ...files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) })),
    ]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const goNext = async () => {
    const fields = STEP_FIELDS[step];
    const valid = fields.length === 0 || (await trigger(fields, { shouldFocus: true }));
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = handleSubmit(async (values) => {
    try {
      const room = await createRoom.mutateAsync({
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

      if (images.length > 0) {
        setIsUploadingImages(true);
        // Sequential, not Promise.all: each file needs its own fresh signature,
        // and the first must land before "isCover" is meaningful.
        for (let i = 0; i < images.length; i++) {
          const uploaded = await uploadToCloudinary(images[i].file, 'room-image');
          await confirmRoomImage(room.id, uploaded, i === 0);
        }
      }

      if (selectedAmenityIds.length > 0) {
        await setRoomAmenities.mutateAsync({
          roomId: room.id,
          amenityIds: selectedAmenityIds,
        });
      }

      toast.success('Đã đăng tin. Tin của bạn đang chờ admin duyệt.');
      // Not /room/[slug] — a brand-new listing is status: 'pending' and that
      // page only ever shows 'active' listings, so it would just 404 here.
      router.push('/manage/listings');
    } catch (err) {
      // A Google account has no phone until one is added on the profile page —
      // this is the specific 400 the backend returns for that case.
      if (err instanceof ApiError && err.message.toLowerCase().includes('contact phone')) {
        toast.error('Cần thêm số điện thoại liên hệ trước khi đăng tin.', {
          action: {
            label: 'Cập nhật hồ sơ',
            onClick: () => router.push('/manage/account'),
          },
        });
        return;
      }
      if (err instanceof ApiError && err.status === 401) {
        router.push(`/login?next=${encodeURIComponent('/manage/listings/new')}`);
        return;
      }
      toast.error('Không đăng tin được, thử lại nhé.');
    } finally {
      setIsUploadingImages(false);
    }
  });

  const busy = isSubmitting || isUploadingImages;
  const isLastStep = step === STEPS.length - 1;

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="space-y-6 pb-20 sm:pb-0"
      onKeyDown={(e) => {
        if (e.key !== 'Enter') return;
        // Never let Enter implicitly submit the wizard — e.g. pressing it on
        // the image step (nothing there needs Enter) used to create the
        // listing on the spot, before the user ever picked a file. Only an
        // explicit click on "Đăng tin" may submit; on earlier steps, Enter
        // just advances instead.
        e.preventDefault();
        if (!isLastStep) void goNext();
      }}
    >
      <Stepper current={step} onStepClick={(i) => i <= step && setStep(i)} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5">
            <p className="hidden text-xs font-semibold uppercase tracking-wide text-brand-700 sm:block">
              Bước {step + 1} / {STEPS.length}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-zinc-950">{STEPS[step]}</h2>
          </div>

          {step === 0 && (
          <div className="space-y-5">
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
                      onClick={() => selectRoomType(type.value)}
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <CurrencyField
                control={control}
                name="price"
                id="price"
                label="Giá thuê mỗi tháng"
                placeholder="2.500.000"
                error={errors.price?.message}
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

          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <CurrencyField
                control={control}
                name="deposit"
                id="deposit"
                label="Tiền cọc"
                placeholder="Không bắt buộc"
                error={errors.deposit?.message}
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
              {showRoomCounts ? (
                <>
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
                </>
              ) : null}
            </div>

            <div className="border-t border-zinc-200 pt-5">
              <h3 className="mb-3 text-sm font-semibold text-zinc-900">Tiện ích</h3>
            {amenityGroups.length > 0 ? (
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
            ) : (
              <p className="text-sm text-zinc-500">Chưa có tiện ích nào để chọn.</p>
            )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {images.map((image, index) => (
                  <div
                    key={image.previewUrl}
                    className="group relative aspect-square overflow-hidden rounded-lg border border-zinc-200"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview, next/image can't handle blob: URLs */}
                    <img
                      src={image.previewUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    {index === 0 && (
                      <span className="absolute bottom-1 left-1 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                        Ảnh bìa
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      aria-label="Xoá ảnh"
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                ))}

                {images.length < MAX_IMAGES_PER_ROOM && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-zinc-300 text-zinc-400 transition-colors hover:border-brand-600 hover:text-brand-600"
                  >
                    <ImagePlus className="h-5 w-5" aria-hidden />
                    <span className="text-xs">Thêm ảnh</span>
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
                  handleFiles(e.target.files);
                  e.target.value = '';
                }}
              />
              <p className="text-xs text-zinc-500">
                Ảnh đầu tiên sẽ là ảnh bìa. Tối đa {MAX_IMAGES_PER_ROOM} ảnh, mỗi ảnh dưới 5MB.
              </p>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 lg:hidden">
              <h3 className="mb-2 text-sm font-semibold text-zinc-900">Xem lại thông tin</h3>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                <ReviewRow label="Tiêu đề" value={title || '—'} />
                <ReviewRow
                  label="Loại hình"
                  value={roomType ? ROOM_TYPE_LABELS[roomType] : '—'}
                />
                <ReviewRow
                  label="Giá thuê"
                  value={priceValue > 0 ? `${formatPrice(priceValue)}/tháng` : '—'}
                />
                <ReviewRow
                  label="Diện tích"
                  value={areaValue > 0 ? `${areaValue} m²` : '—'}
                />
                <ReviewRow
                  label="Vị trí"
                  value={[district, city].filter(Boolean).join(', ') || '—'}
                />
                <ReviewRow label="Tiện ích" value={`${selectedAmenityIds.length} tiện ích`} />
              </dl>
            </div>
          </div>
        )}
        </div>

        <ListingPreview
          step={step}
          title={title}
          roomType={roomType}
          price={priceValue}
          area={areaValue}
          city={city}
          district={district}
          amenityCount={selectedAmenityIds.length}
          imageCount={images.length}
        />
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between border-t border-zinc-200 bg-white/95 px-4 py-3 shadow-[0_-8px_20px_rgba(0,0,0,0.06)] backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:shadow-none">
        {step > 0 ? (
          <Button type="button" variant="outline" onClick={goBack}>
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Quay lại
          </Button>
        ) : (
          <span />
        )}

        {isLastStep ? (
          <Button type="submit" disabled={busy}>
            {isUploadingImages
              ? 'Đang tải ảnh lên…'
              : isSubmitting
                ? 'Đang đăng tin…'
                : 'Đăng tin'}
          </Button>
        ) : (
          <Button type="button" onClick={goNext}>
            Tiếp theo
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
        )}
      </div>
    </form>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 sm:justify-start">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="truncate font-medium text-zinc-900 sm:ml-auto">{value}</dd>
    </div>
  );
}

function CurrencyField({
  control,
  name,
  id,
  label,
  placeholder,
  error,
}: {
  control: Control<CreateRoomFormInput, unknown, CreateRoomFormOutput>;
  name: 'price' | 'deposit';
  id: string;
  label: string;
  placeholder: string;
  error?: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div>
          <label htmlFor={id} className="mb-1 block text-sm font-medium">
            {label}
          </label>
          <div className="relative">
            <input
              id={id}
              ref={field.ref}
              name={field.name}
              inputMode="numeric"
              autoComplete="off"
              value={formatCurrencyInput(field.value)}
              onBlur={field.onBlur}
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, '');
                field.onChange(digits === '' ? '' : Number(digits));
              }}
              placeholder={placeholder}
              aria-invalid={!!error || undefined}
              aria-describedby={error ? `${id}-error` : `${id}-suffix`}
              className={cn(
                'h-10 w-full rounded-md border bg-white px-3 pr-10 text-sm transition-colors placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-offset-1',
                error
                  ? 'border-danger-600 focus:ring-danger-600'
                  : 'border-zinc-300 focus:border-brand-600 focus:ring-brand-600',
              )}
            />
            <span
              id={`${id}-suffix`}
              className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-zinc-500"
            >
              ₫
            </span>
          </div>
          {error ? (
            <p id={`${id}-error`} className="mt-1 text-sm text-danger-600">
              {error}
            </p>
          ) : null}
        </div>
      )}
    />
  );
}

function formatCurrencyInput(value: unknown) {
  if (value === '' || value === undefined || value === null) return '';
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) return '';
  return new Intl.NumberFormat('vi-VN').format(numberValue);
}

function ListingPreview({
  step,
  title,
  roomType,
  price,
  area,
  city,
  district,
  amenityCount,
  imageCount,
}: {
  step: number;
  title?: string;
  roomType?: CreateRoomFormInput['roomType'];
  price: number;
  area: number;
  city?: string;
  district?: string;
  amenityCount: number;
  imageCount: number;
}) {
  return (
    <aside className="sticky top-24 hidden space-y-4 lg:block">
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Xem trước tin</p>
        <h3 className="mt-2 line-clamp-2 text-lg font-semibold text-zinc-950">
          {title || 'Tiêu đề tin đăng của bạn'}
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          {roomType ? ROOM_TYPE_LABELS[roomType] : 'Chưa chọn loại hình'}
        </p>
        <p className="mt-4 text-xl font-semibold text-brand-700">
          {price > 0 ? `${formatPrice(price)}/tháng` : 'Chưa nhập giá'}
        </p>
        <dl className="mt-4 space-y-3 border-t border-zinc-200 pt-4 text-sm">
          <ReviewRow label="Diện tích" value={area > 0 ? `${area} m²` : '—'} />
          <ReviewRow
            label="Vị trí"
            value={[district, city].filter(Boolean).join(', ') || '—'}
          />
          <ReviewRow label="Tiện ích" value={`${amenityCount} mục`} />
          <ReviewRow label="Hình ảnh" value={`${imageCount} ảnh`} />
        </dl>
      </div>
      <div className="rounded-xl border border-brand-100 bg-brand-50 p-4">
        <p className="text-sm font-medium text-brand-900">
          Đang hoàn thành bước {step + 1}/{STEPS.length}
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
          <div
            className="h-full rounded-full bg-brand-600 transition-all"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        <p className="mt-3 text-xs leading-5 text-brand-800">
          Thông tin rõ ràng và ảnh thật giúp tin được duyệt nhanh hơn.
        </p>
      </div>
    </aside>
  );
}

function Stepper({
  current,
  onStepClick,
}: {
  current: number;
  onStepClick: (index: number) => void;
}) {
  return (
    <>
      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
              Bước {current + 1}/{STEPS.length}
            </p>
            <p className="mt-1 text-sm font-medium text-zinc-900">{STEPS[current]}</p>
          </div>
          <span className="text-sm text-zinc-500">{Math.round(((current + 1) / STEPS.length) * 100)}%</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-200">
          <div
            className="h-full rounded-full bg-brand-600 transition-all"
            style={{ width: `${((current + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="relative hidden px-5 sm:block">
        <div className="absolute left-10 right-10 top-5 h-0.5 bg-zinc-200" aria-hidden />
        <ol className="relative grid grid-cols-4">
        {STEPS.map((label, i) => {
          const state = i < current ? 'done' : i === current ? 'current' : 'upcoming';
          return (
            <li key={label} className="flex min-w-0 flex-col items-center gap-2 px-2 text-center">
              <button
                type="button"
                onClick={() => onStepClick(i)}
                disabled={i > current}
                aria-current={state === 'current' ? 'step' : undefined}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-4 border-white text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2',
                  state === 'upcoming'
                    ? 'bg-zinc-200 text-zinc-600'
                    : 'bg-brand-600 text-white',
                )}
              >
                {state === 'done' ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
              </button>
              <span
                className={cn(
                  'text-xs font-medium md:text-sm',
                  state === 'current'
                    ? 'text-brand-700'
                    : state === 'done'
                      ? 'text-zinc-700'
                      : 'text-zinc-500',
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
        </ol>
      </div>
    </>
  );
}
