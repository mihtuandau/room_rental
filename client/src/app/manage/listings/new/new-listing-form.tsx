'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Amenity } from '@/features/amenities/api';
import type { ProvinceOption } from '@/features/locations/api';
import { ImageReviewStep } from './_components/image-review-step';
import {
  DetailsAmenitiesStep,
  LocationStep,
  MainInformationStep,
} from './_components/new-listing-steps';
import {
  LISTING_STEPS,
  ListingPreview,
  ListingStepper,
} from './_components/new-listing-ui';
import { useNewListingForm } from './_hooks/use-new-listing-form';

export function NewListingForm({
  amenities,
  provinces,
}: {
  amenities: Amenity[];
  provinces: ProvinceOption[];
}) {
  const listing = useNewListingForm(amenities);
  const {
    register,
    control,
    formState: { errors, isSubmitting },
  } = listing;

  return (
    <form
      onSubmit={listing.onFormSubmit}
      noValidate
      className="space-y-6 pb-20 sm:pb-0"
      onKeyDown={(event) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        if (!listing.isLastStep) void listing.goNext();
      }}
    >
      <ListingStepper
        current={listing.step}
        onStepClick={(index) =>
          index <= listing.step && listing.setStep(index)
        }
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5">
            <p className="hidden text-xs font-semibold uppercase tracking-wide text-brand-700 sm:block">
              Bước {listing.step + 1} / {LISTING_STEPS.length}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-zinc-950">
              {LISTING_STEPS[listing.step]}
            </h2>
          </div>
          {listing.step === 0 ? (
            <MainInformationStep
              roomType={listing.roomType}
              control={control}
              register={register}
              errors={errors}
              onRoomType={listing.selectRoomType}
            />
          ) : null}
          {listing.step === 1 ? (
            <LocationStep
              provinces={provinces}
              city={listing.city}
              latitude={listing.latitudeValue}
              longitude={listing.longitudeValue}
              addressQueries={listing.addressQueries}
              autoSearch={listing.canAutoSearchLocation}
              register={register}
              errors={errors}
              onCity={(value) => {
                listing.setValue('city', value, { shouldValidate: true });
                listing.clearCoordinates();
              }}
              onCoordinates={listing.setCoordinates}
              onLocationFieldChange={listing.clearCoordinates}
            />
          ) : null}
          {listing.step === 2 ? (
            <DetailsAmenitiesStep
              control={control}
              register={register}
              errors={errors}
              showRoomCounts={listing.showRoomCounts}
              amenityGroups={listing.amenityGroups}
              selectedAmenityIds={listing.selectedAmenityIds}
              onToggleAmenity={listing.toggleAmenity}
            />
          ) : null}
          {listing.step === 3 ? (
            <ImageReviewStep
              images={listing.images}
              imageError={listing.imageError}
              title={listing.title}
              roomType={listing.roomType}
              price={listing.priceValue}
              area={listing.areaValue}
              city={listing.city}
              district={listing.district}
              amenityCount={listing.selectedAmenityIds.length}
              onFiles={listing.handleFiles}
              onRemove={listing.removeImage}
            />
          ) : null}
        </div>
        <ListingPreview
          step={listing.step}
          title={listing.title}
          roomType={listing.roomType}
          price={listing.priceValue}
          area={listing.areaValue}
          city={listing.city}
          district={listing.district}
          amenityCount={listing.selectedAmenityIds.length}
          imageCount={listing.images.length}
        />
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between border-t border-zinc-200 bg-white/95 px-4 py-3 shadow-[0_-8px_20px_rgba(0,0,0,0.06)] backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:shadow-none">
        {listing.step > 0 ? (
          <Button type="button" variant="outline" onClick={listing.goBack}>
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Quay lại
          </Button>
        ) : (
          <span />
        )}
        {listing.isLastStep ? (
          <Button
            type="submit"
            disabled={listing.busy || listing.images.length === 0}
            aria-describedby={
              listing.imageError
                ? 'listing-images-error'
                : 'listing-images-help'
            }
          >
            {listing.isUploadingImages
              ? 'Đang tải ảnh lên…'
              : isSubmitting
                ? 'Đang đăng tin…'
                : 'Đăng tin'}
          </Button>
        ) : (
          <Button type="button" onClick={() => void listing.goNext()}>
            Tiếp theo
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
        )}
      </div>
    </form>
  );
}
