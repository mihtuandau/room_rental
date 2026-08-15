import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
} from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { LocationPicker } from '@/components/rooms/location-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/features/auth/components/field';
import type { Amenity } from '@/features/amenities/api';
import type { ProvinceOption } from '@/features/locations/api';
import { useWardOptions } from '@/features/locations/hooks';
import type { CreateRoomFormInput } from '@/features/rooms/schemas';
import {
  AMENITY_TYPE_LABELS,
  ROOM_TYPE_OPTIONS,
  type AmenityType,
} from '@/lib/constants';
import { cn } from '@/lib/utils';

type AmenityGroup = { type: AmenityType; items: Amenity[] };

export function EditListingFields({
  roomType,
  city,
  provinceCode,
  ward,
  provinces,
  latitude,
  longitude,
  addressQueries,
  autoSearch,
  amenityGroups,
  selectedAmenityIds,
  register,
  errors,
  setValue,
  onClearCoordinates,
  onToggleAmenity,
}: {
  roomType: CreateRoomFormInput['roomType'];
  city?: string;
  provinceCode?: number;
  ward?: string;
  provinces: ProvinceOption[];
  latitude?: number;
  longitude?: number;
  addressQueries: string[];
  autoSearch: boolean;
  amenityGroups: AmenityGroup[];
  selectedAmenityIds: number[];
  register: UseFormRegister<CreateRoomFormInput>;
  errors: FieldErrors<CreateRoomFormInput>;
  setValue: UseFormSetValue<CreateRoomFormInput>;
  onClearCoordinates: () => void;
  onToggleAmenity: (id: number) => void;
}) {
  return (
    <>
      <MainFields
        roomType={roomType}
        register={register}
        errors={errors}
        setValue={setValue}
      />
      <LocationFields
        city={city}
        provinceCode={provinceCode}
        ward={ward}
        provinces={provinces}
        latitude={latitude}
        longitude={longitude}
        addressQueries={addressQueries}
        autoSearch={autoSearch}
        register={register}
        errors={errors}
        setValue={setValue}
        onClearCoordinates={onClearCoordinates}
      />
      {amenityGroups.length ? (
        <AmenityFields
          groups={amenityGroups}
          selectedIds={selectedAmenityIds}
          onToggle={onToggleAmenity}
        />
      ) : null}
    </>
  );
}

function MainFields({
  roomType,
  register,
  errors,
  setValue,
}: Pick<
  Parameters<typeof EditListingFields>[0],
  'roomType' | 'register' | 'errors' | 'setValue'
>) {
  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Thông tin tin đăng
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
                onClick={() =>
                  setValue('roomType', type.value, { shouldValidate: true })
                }
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
        {errors.roomType ? (
          <p className="mt-1 text-sm text-danger-600">
            {errors.roomType.message}
          </p>
        ) : null}
      </div>
      <div>
        <label
          htmlFor="description"
          className="mb-1 block text-sm font-medium"
        >
          Mô tả
        </label>
        <Textarea
          id="description"
          rows={4}
          placeholder="Phòng sạch sẽ, an ninh, giờ giấc tự do, gần trường đại học…"
          error={Boolean(errors.description)}
          {...register('description')}
        />
        {errors.description ? (
          <p className="mt-1 text-sm text-danger-600">
            {errors.description.message}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function LocationFields({
  city,
  provinceCode,
  ward,
  provinces,
  latitude,
  longitude,
  addressQueries,
  autoSearch,
  register,
  errors,
  setValue,
  onClearCoordinates,
}: Pick<
  Parameters<typeof EditListingFields>[0],
  | 'city'
  | 'provinceCode'
  | 'ward'
  | 'provinces'
  | 'latitude'
  | 'longitude'
  | 'addressQueries'
  | 'autoSearch'
  | 'register'
  | 'errors'
  | 'setValue'
  | 'onClearCoordinates'
>) {
  const wardsQuery = useWardOptions(provinceCode);

  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Vị trí
      </h2>
      <div>
        <label className="mb-1 block text-sm font-medium">
          Tỉnh, thành phố
        </label>
        <Select
          value={city || undefined}
          onValueChange={(value) => {
            setValue('city', value, { shouldValidate: true });
            const province = provinces.find((item) => item.value === value);
            setValue('provinceCode', province?.code, {
              shouldValidate: true,
            });
            setValue('ward', '', { shouldValidate: true });
            setValue('wardCode', undefined, { shouldValidate: true });
            onClearCoordinates();
          }}
        >
          <SelectTrigger aria-label="Tỉnh, thành phố">
            <SelectValue placeholder="Chọn tỉnh, thành phố" />
          </SelectTrigger>
          <SelectContent>
            {provinces.map((province) => (
              <SelectItem key={province.value} value={province.value}>
                {province.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.city ? (
          <p className="mt-1 text-sm text-danger-600">
            {errors.city.message}
          </p>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          id="district"
          label="Khu vực cũ (không bắt buộc)"
          placeholder="Chỉ dùng cho địa chỉ lịch sử"
          error={errors.district?.message}
          {...register('district', { onChange: onClearCoordinates })}
        />
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="ward">
            Phường, xã hoặc đặc khu
          </label>
          <Select
            value={ward || undefined}
            onValueChange={(value) => {
              setValue('ward', value, { shouldValidate: true });
              const option = wardsQuery.data?.find(
                (wardOption) => wardOption.value === value,
              );
              setValue('wardCode', option?.code, { shouldValidate: true });
              onClearCoordinates();
            }}
            disabled={!provinceCode || wardsQuery.isPending}
          >
            <SelectTrigger id="ward" aria-label="Phường, xã hoặc đặc khu">
              <SelectValue
                placeholder={
                  wardsQuery.isPending
                    ? 'Đang tải phường, xã…'
                    : 'Chọn phường, xã'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {ward &&
              !wardsQuery.data?.some((option) => option.value === ward) ? (
                <SelectItem value={ward}>{ward}</SelectItem>
              ) : null}
              {wardsQuery.data?.map((option) => (
                <SelectItem
                  key={option.code ?? option.value}
                  value={option.value}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.ward ? (
            <p className="mt-1 text-sm text-danger-600">
              {errors.ward.message}
            </p>
          ) : null}
        </div>
      </div>
      <Field
        id="address"
        label="Địa chỉ cụ thể"
        placeholder="Số nhà, tên đường (không bắt buộc)"
        error={errors.address?.message}
        {...register('address', { onChange: onClearCoordinates })}
      />
      <div className="border-t border-zinc-200 pt-5">
        <LocationPicker
          addressQueries={addressQueries}
          autoSearch={autoSearch}
          latitude={latitude}
          longitude={longitude}
          onChange={(coordinates) => {
            setValue('latitude', coordinates.latitude, {
              shouldDirty: true,
              shouldValidate: true,
            });
            setValue('longitude', coordinates.longitude, {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
          error={errors.latitude?.message ?? errors.longitude?.message}
        />
      </div>
    </section>
  );
}

function AmenityFields({
  groups,
  selectedIds,
  onToggle,
}: {
  groups: AmenityGroup[];
  selectedIds: number[];
  onToggle: (id: number) => void;
}) {
  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Tiện ích
      </h2>
      <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
        {groups.map((group) => (
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
                    checked={selectedIds.includes(amenity.id)}
                    onCheckedChange={() => onToggle(amenity.id)}
                  />
                  {amenity.name}
                </label>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
