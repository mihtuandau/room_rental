'use client';

import type {
  FieldErrors,
  UseFormRegister,
} from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { LocationPicker } from '@/components/rooms/location-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Field } from '@/features/auth/components/field';
import type { Amenity } from '@/features/amenities/api';
import type { ProvinceOption } from '@/features/locations/api';
import type {
  CreateRoomFormInput,
  CreateRoomFormOutput,
} from '@/features/rooms/schemas';
import {
  AMENITY_TYPE_LABELS,
  ROOM_TYPE_OPTIONS,
  type AmenityType,
} from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Control } from 'react-hook-form';
import { CurrencyField } from './new-listing-ui';

type ListingErrors = FieldErrors<CreateRoomFormInput>;
type ListingRegister = UseFormRegister<CreateRoomFormInput>;
type ListingControl = Control<
  CreateRoomFormInput,
  unknown,
  CreateRoomFormOutput
>;

export function MainInformationStep({
  roomType,
  control,
  register,
  errors,
  onRoomType,
}: {
  roomType?: CreateRoomFormInput['roomType'];
  control: ListingControl;
  register: ListingRegister;
  errors: ListingErrors;
  onRoomType: (roomType: CreateRoomFormInput['roomType']) => void;
}) {
  return (
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
                onClick={() => onRoomType(type.value)}
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
    </div>
  );
}

export function LocationStep({
  provinces,
  city,
  latitude,
  longitude,
  addressQueries,
  autoSearch,
  register,
  errors,
  onCity,
  onCoordinates,
  onLocationFieldChange,
}: {
  provinces: ProvinceOption[];
  city?: string;
  latitude?: number;
  longitude?: number;
  addressQueries: string[];
  autoSearch: boolean;
  register: ListingRegister;
  errors: ListingErrors;
  onCity: (city: string) => void;
  onCoordinates: (coordinates: {
    latitude: number;
    longitude: number;
  }) => void;
  onLocationFieldChange: () => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1 block text-sm font-medium">
          Tỉnh, thành phố
        </label>
        <Select value={city || undefined} onValueChange={onCity}>
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
          <p className="mt-1 text-sm text-danger-600">{errors.city.message}</p>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          id="district"
          label="Quận, huyện"
          placeholder="Quận 7"
          error={errors.district?.message}
          {...register('district', { onChange: onLocationFieldChange })}
        />
        <Field
          id="ward"
          label="Phường, xã"
          placeholder="Không bắt buộc"
          error={errors.ward?.message}
          {...register('ward', { onChange: onLocationFieldChange })}
        />
      </div>
      <Field
        id="address"
        label="Địa chỉ cụ thể"
        placeholder="Số nhà, tên đường (không bắt buộc)"
        error={errors.address?.message}
        {...register('address', { onChange: onLocationFieldChange })}
      />
      <div className="border-t border-zinc-200 pt-5">
        <LocationPicker
          addressQueries={addressQueries}
          autoSearch={autoSearch}
          latitude={latitude}
          longitude={longitude}
          onChange={onCoordinates}
          error={errors.latitude?.message ?? errors.longitude?.message}
        />
      </div>
    </div>
  );
}

export function DetailsAmenitiesStep({
  control,
  register,
  errors,
  showRoomCounts,
  amenityGroups,
  selectedAmenityIds,
  onToggleAmenity,
}: {
  control: ListingControl;
  register: ListingRegister;
  errors: ListingErrors;
  showRoomCounts: boolean;
  amenityGroups: Array<{ type: AmenityType; items: Amenity[] }>;
  selectedAmenityIds: number[];
  onToggleAmenity: (id: number) => void;
}) {
  return (
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
                        onCheckedChange={() => onToggleAmenity(amenity.id)}
                      />
                      {amenity.name}
                    </label>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">
            Chưa có tiện ích nào để chọn.
          </p>
        )}
      </div>
    </div>
  );
}
