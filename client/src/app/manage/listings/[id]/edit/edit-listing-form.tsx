'use client';

import { Button } from '@/components/ui/button';
import type { Amenity } from '@/features/amenities/api';
import type { ProvinceOption } from '@/features/locations/api';
import type { MyRoomDetail } from '@/features/rooms/api';
import { EditListingFields } from './_components/edit-listing-fields';
import { EditListingImages } from './_components/edit-listing-images';
import { EditListingSidebar } from './_components/edit-listing-sidebar';
import { useEditListingForm } from './_hooks/use-edit-listing-form';

const FORM_ID = 'edit-listing-form';

export function EditListingForm({
  room,
  amenities,
  provinces,
}: {
  room: MyRoomDetail;
  amenities: Amenity[];
  provinces: ProvinceOption[];
}) {
  const listing = useEditListingForm(room, amenities);
  const {
    register,
    setValue,
    formState: { errors, isSubmitting },
  } = listing;

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-zinc-200 bg-white p-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Sửa tin đăng
          </h1>
          <p className="mt-1 truncate text-sm text-zinc-600">{room.title}</p>
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <div className="text-right text-xs text-zinc-500">
            <p>Cập nhật lần cuối</p>
            <p className="font-medium text-zinc-900">
              {new Date(room.updatedAt).toLocaleString('vi-VN', {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={listing.discardChanges}
            disabled={listing.busy}
          >
            Huỷ thay đổi
          </Button>
          <Button type="submit" form={FORM_ID} disabled={listing.busy}>
            {isSubmitting ? 'Đang lưu…' : 'Lưu thay đổi'}
          </Button>
        </div>
      </div>
      <form
        id={FORM_ID}
        onSubmit={listing.submit}
        noValidate
        className="grid grid-cols-1 gap-6 lg:grid-cols-[7fr_5fr]"
      >
        <div className="space-y-6">
          <EditListingImages
            images={room.images}
            isUploading={listing.isUploadingImage}
            isDeleting={listing.isDeletingImage}
            isSettingCover={listing.isSettingCoverImage}
            settingCoverImageId={listing.settingCoverImageId}
            onFiles={(files) => void listing.uploadImages(files)}
            onDelete={listing.removeImage}
            onSetCover={listing.makeCoverImage}
          />
          <EditListingFields
            roomType={listing.roomType}
            city={listing.city}
            provinceCode={listing.provinceCode}
            ward={listing.ward}
            provinces={provinces}
            latitude={listing.latitudeValue}
            longitude={listing.longitudeValue}
            addressQueries={listing.addressQueries}
            autoSearch={listing.canAutoSearchLocation}
            amenityGroups={listing.amenityGroups}
            selectedAmenityIds={listing.selectedAmenityIds}
            register={register}
            errors={errors}
            setValue={setValue}
            onClearCoordinates={listing.clearCoordinates}
            onToggleAmenity={listing.toggleAmenity}
          />
        </div>
        <EditListingSidebar
          room={room}
          register={register}
          errors={errors}
          isDeleting={listing.isDeletingRoom}
          onDelete={() => void listing.removeListing()}
        />
      </form>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-zinc-200 bg-white/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur md:hidden">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={listing.discardChanges}
          disabled={listing.busy}
        >
          Huỷ thay đổi
        </Button>
        <Button
          type="submit"
          form={FORM_ID}
          className="flex-1"
          disabled={listing.busy}
        >
          {isSubmitting ? 'Đang lưu…' : 'Lưu thay đổi'}
        </Button>
      </div>
    </div>
  );
}
