'use client';

import { useState, type FormEventHandler } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import type { Amenity } from '@/features/amenities/api';
import { buildLocationSearchQueries } from '@/features/locations/geocoding';
import { confirmRoomImage, deleteRoom } from '@/features/rooms/api';
import { useCreateRoom, useSetRoomAmenities } from '@/features/rooms/hooks';
import {
  createRoomSchema,
  type CreateRoomFormInput,
  type CreateRoomFormOutput,
} from '@/features/rooms/schemas';
import {
  deleteUnconfirmedRoomImage,
  uploadToCloudinary,
} from '@/features/storage/api';
import { ApiError } from '@/lib/api-client';
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGES_PER_ROOM,
  MAX_IMAGE_BYTES,
  type AmenityType,
} from '@/lib/constants';
import type { StagedImage } from '../_components/image-review-step';
import { LISTING_STEPS } from '../_components/new-listing-ui';

const AMENITY_TYPE_ORDER: AmenityType[] = [
  'basic',
  'utility',
  'security',
  'nearby',
];
const STEP_FIELDS: (keyof CreateRoomFormInput)[][] = [
  ['title', 'roomType', 'price', 'area', 'description'],
  ['city', 'provinceCode', 'ward', 'wardCode', 'address', 'latitude', 'longitude'],
  ['deposit', 'maxOccupants', 'bedrooms', 'bathrooms'],
  [],
];
const ROOM_TYPES_WITH_BEDROOM_COUNTS = new Set([
  'whole_house',
  'mini_apartment',
  'serviced_apartment',
]);

export function useNewListingForm(
  amenities: Amenity[],
  onContactRequired: () => void,
) {
  const router = useRouter();
  const createRoom = useCreateRoom();
  const setRoomAmenities = useSetRoomAmenities();
  const [step, setStep] = useState(0);
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<number[]>([]);
  const [images, setImages] = useState<StagedImage[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const form = useForm<
    CreateRoomFormInput,
    unknown,
    CreateRoomFormOutput
  >({ resolver: zodResolver(createRoomSchema) });
  const {
    control,
    handleSubmit,
    setValue,
    trigger,
    formState: { isSubmitting },
  } = form;
  const [
    roomType,
    city,
    provinceCode,
    district,
    ward,
    wardCode,
    address,
    latitude,
    longitude,
    price,
    area,
    title,
  ] = useWatch({
    control,
    name: [
      'roomType',
      'city',
      'provinceCode',
      'district',
      'ward',
      'wardCode',
      'address',
      'latitude',
      'longitude',
      'price',
      'area',
      'title',
    ],
  });

  const amenityGroups = AMENITY_TYPE_ORDER.map((type) => ({
    type,
    items: amenities.filter((amenity) => amenity.type === type),
  })).filter((group) => group.items.length > 0);
  const addressQueries = buildLocationSearchQueries({
    address,
    ward,
    district,
    city,
  });

  function toggleAmenity(id: number) {
    setSelectedAmenityIds((current) =>
      current.includes(id)
        ? current.filter((amenityId) => amenityId !== id)
        : [...current, id],
    );
  }

  function selectRoomType(value: CreateRoomFormInput['roomType']) {
    setValue('roomType', value, { shouldValidate: true });
    if (!ROOM_TYPES_WITH_BEDROOM_COUNTS.has(value)) {
      setValue('bedrooms', undefined);
    }
  }

  function clearCoordinates() {
    setValue('latitude', undefined, { shouldDirty: true });
    setValue('longitude', undefined, { shouldDirty: true });
  }

  function setCoordinates(coordinates: {
    latitude: number;
    longitude: number;
  }) {
    setValue('latitude', coordinates.latitude, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue('longitude', coordinates.longitude, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const files = Array.from(fileList);
    const tooBig = files.find((file) => file.size > MAX_IMAGE_BYTES);
    const badType = files.find(
      (file) => !ACCEPTED_IMAGE_TYPES.includes(file.type),
    );

    if (tooBig) {
      setImageError(
        `Ảnh "${tooBig.name}" vượt quá 5MB. Chọn ảnh nhỏ hơn nhé.`,
      );
      return;
    }
    if (badType) {
      setImageError('Chỉ chấp nhận ảnh JPG, PNG hoặc WebP.');
      return;
    }
    if (images.length + files.length > MAX_IMAGES_PER_ROOM) {
      setImageError(
        `Mỗi tin chỉ đăng tối đa ${MAX_IMAGES_PER_ROOM} ảnh.`,
      );
      return;
    }

    setImageError(null);
    setImages((current) => [
      ...current,
      ...files.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
  }

  function removeImage(index: number) {
    setImages((current) => {
      URL.revokeObjectURL(current[index].previewUrl);
      return current.filter((_, imageIndex) => imageIndex !== index);
    });
  }

  async function goNext() {
    const fields = STEP_FIELDS[step];
    const valid =
      fields.length === 0 ||
      (await trigger(fields, { shouldFocus: true }));
    if (valid) {
      setStep((current) =>
        Math.min(current + 1, LISTING_STEPS.length - 1),
      );
    }
  }

  async function submitListing(values: CreateRoomFormOutput) {
    let createdRoomId: number | null = null;
    try {
      const room = await createRoom.mutateAsync({
        ...values,
        description: values.description || undefined,
        district: values.district?.trim() || undefined,
        ward: values.ward || undefined,
        address: values.address || undefined,
      });
      createdRoomId = room.id;
      setIsUploadingImages(true);
      for (let index = 0; index < images.length; index += 1) {
        let uploaded: Awaited<ReturnType<typeof uploadToCloudinary>> | null = null;
        try {
          uploaded = await uploadToCloudinary(
            images[index].file,
            'room-image',
            room.id,
          );
          await confirmRoomImage(room.id, uploaded, index === 0);
        } catch (error) {
          if (uploaded) {
            await deleteUnconfirmedRoomImage(room.id, uploaded.public_id).catch(
              () => undefined,
            );
          }
          throw error;
        }
      }
      if (selectedAmenityIds.length) {
        await setRoomAmenities.mutateAsync({
          roomId: room.id,
          amenityIds: selectedAmenityIds,
        });
      }
      toast.success('Đã đăng tin. Tin của bạn đang chờ admin duyệt.');
      router.push('/manage/listings');
    } catch (error) {
      if (createdRoomId !== null) {
        await deleteRoom(createdRoomId).catch(() => undefined);
      }
      if (
        error instanceof ApiError &&
        error.message.toLowerCase().includes('contact phone')
      ) {
        onContactRequired();
        toast.error('Bạn cần thêm số điện thoại liên hệ trước khi đăng tin.');
        return;
      }
      if (error instanceof ApiError && error.status === 401) {
        router.push(
          `/login?next=${encodeURIComponent('/manage/listings/new')}`,
        );
        return;
      }
      if (
        error instanceof ApiError &&
        (error.status === 429 || error.status === 503)
      ) {
        toast.error(
          error.status === 429
            ? 'Bạn thao tác hơi nhanh. Đợi một chút rồi thử lại.'
            : 'Hệ thống tải ảnh chưa sẵn sàng. Bạn thử lại sau nhé.',
        );
        return;
      }
      if (error instanceof Error && error.message.includes('Tải ảnh')) {
        toast.error('Không thể tải ảnh lên. Kiểm tra kết nối và thử lại nhé.');
        return;
      }
      if (error instanceof ApiError && error.message) {
        toast.error(error.message);
        return;
      }
      toast.error('Không đăng tin được, bạn kiểm tra lại thông tin và thử lại nhé.');
    } finally {
      setIsUploadingImages(false);
    }
  }

  const submitValues = handleSubmit(async (values) => {
    await submitListing(values);
  });

  const onFormSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    if (!images.length) {
      event.preventDefault();
      setImageError(
        'Thêm ít nhất một ảnh để người thuê có thể xem phòng trước khi đăng tin.',
      );
      return;
    }
    void submitValues(event);
  };

  return {
    ...form,
    step,
    setStep,
    roomType,
    city,
    provinceCode,
    district,
    ward,
    wardCode,
    title,
    priceValue: Number(price),
    areaValue: Number(area),
    latitudeValue: typeof latitude === 'number' ? latitude : undefined,
    longitudeValue: typeof longitude === 'number' ? longitude : undefined,
    addressQueries,
    canAutoSearchLocation: Boolean(city && (ward || address)),
    showBedroomCount: ROOM_TYPES_WITH_BEDROOM_COUNTS.has(roomType),
    showBathroomCount: Boolean(roomType),
    amenityGroups,
    selectedAmenityIds,
    images,
    imageError,
    isUploadingImages,
    busy: isSubmitting || isUploadingImages,
    isLastStep: step === LISTING_STEPS.length - 1,
    selectRoomType,
    clearCoordinates,
    setCoordinates,
    toggleAmenity,
    handleFiles,
    removeImage,
    goNext,
    goBack: () => setStep((current) => Math.max(current - 1, 0)),
    onFormSubmit,
  };
}
