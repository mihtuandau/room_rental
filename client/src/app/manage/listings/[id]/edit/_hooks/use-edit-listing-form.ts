'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import type { Amenity } from '@/features/amenities/api';
import { buildLocationSearchQueries } from '@/features/locations/geocoding';
import { confirmRoomImage, type MyRoomDetail } from '@/features/rooms/api';
import {
  roomKeys,
  useDeleteRoom,
  useDeleteRoomImage,
  useSetRoomCoverImage,
  useSetRoomAmenities,
  useUpdateRoom,
} from '@/features/rooms/hooks';
import {
  createRoomSchema,
  type CreateRoomFormInput,
  type CreateRoomFormOutput,
} from '@/features/rooms/schemas';
import { uploadToCloudinary } from '@/features/storage/api';
import { ApiError } from '@/lib/api-client';
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGES_PER_ROOM,
  MAX_IMAGE_BYTES,
  type AmenityType,
} from '@/lib/constants';

const AMENITY_TYPE_ORDER: AmenityType[] = [
  'basic',
  'utility',
  'security',
  'nearby',
];

export function useEditListingForm(
  room: MyRoomDetail,
  amenities: Amenity[],
) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const updateRoom = useUpdateRoom(room.id);
  const setRoomAmenities = useSetRoomAmenities();
  const deleteRoom = useDeleteRoom();
  const deleteImage = useDeleteRoomImage(room.id);
  const setCoverImage = useSetRoomCoverImage(room.id);
  const initialAmenityIds = room.amenities.map((amenity) => amenity.id);
  const [selectedAmenityIds, setSelectedAmenityIds] =
    useState(initialAmenityIds);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const defaultValues: CreateRoomFormInput = {
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
    latitude: room.latitude ?? undefined,
    longitude: room.longitude ?? undefined,
  };
  const form = useForm<
    CreateRoomFormInput,
    unknown,
    CreateRoomFormOutput
  >({
    resolver: zodResolver(createRoomSchema),
    defaultValues,
  });
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting },
  } = form;
  const [roomType, city, district, ward, address, latitude, longitude] =
    useWatch({
      control,
      name: [
        'roomType',
        'city',
        'district',
        'ward',
        'address',
        'latitude',
        'longitude',
      ],
    });
  const amenityGroups = AMENITY_TYPE_ORDER.map((type) => ({
    type,
    items: amenities.filter((amenity) => amenity.type === type),
  })).filter((group) => group.items.length > 0);

  function clearCoordinates() {
    setValue('latitude', undefined, { shouldDirty: true });
    setValue('longitude', undefined, { shouldDirty: true });
  }

  function toggleAmenity(id: number) {
    setSelectedAmenityIds((current) =>
      current.includes(id)
        ? current.filter((amenityId) => amenityId !== id)
        : [...current, id],
    );
  }

  function discardChanges() {
    reset(defaultValues);
    setSelectedAmenityIds(initialAmenityIds);
  }

  async function uploadImages(fileList: FileList | null) {
    if (!fileList?.length) return;
    const files = Array.from(fileList);
    const tooBig = files.find((file) => file.size > MAX_IMAGE_BYTES);
    const badType = files.find(
      (file) => !ACCEPTED_IMAGE_TYPES.includes(file.type),
    );

    if (tooBig) {
      toast.error(`"${tooBig.name}" vượt quá 5MB.`);
      return;
    }
    if (badType) {
      toast.error('Chỉ chấp nhận ảnh JPG, PNG hoặc WebP.');
      return;
    }
    if (room.images.length + files.length > MAX_IMAGES_PER_ROOM) {
      toast.error(`Mỗi tin chỉ đăng tối đa ${MAX_IMAGES_PER_ROOM} ảnh.`);
      return;
    }

    setIsUploadingImage(true);
    try {
      for (let index = 0; index < files.length; index += 1) {
        const uploaded = await uploadToCloudinary(
          files[index],
          'room-image',
          room.id,
        );
        await confirmRoomImage(
          room.id,
          uploaded,
          room.images.length === 0 && index === 0,
        );
      }
      await queryClient.invalidateQueries({
        queryKey: roomKeys.all,
      });
    } catch {
      toast.error('Tải ảnh lên thất bại, thử lại nhé.');
    } finally {
      setIsUploadingImage(false);
    }
  }

  function removeImage(imageId: string) {
    deleteImage.mutate(imageId, {
      onError: () => toast.error('Không xoá được ảnh, thử lại nhé.'),
    });
  }

  function makeCoverImage(imageId: string) {
    setCoverImage.mutate(imageId, {
      onSuccess: () => toast.success('Đã đặt làm ảnh bìa.'),
      onError: () =>
        toast.error('Không đặt được ảnh bìa. Bạn thử lại nhé.'),
    });
  }

  const submit = handleSubmit(async (values) => {
    try {
      await updateRoom.mutateAsync({
        ...values,
        description: values.description || undefined,
        ward: values.ward || undefined,
        address: values.address || undefined,
      });
      await setRoomAmenities.mutateAsync({
        roomId: room.id,
        amenityIds: selectedAmenityIds,
      });
      toast.success('Đã lưu thay đổi.');
      router.push('/manage/listings');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.push(
          `/login?next=${encodeURIComponent(
            `/manage/listings/${room.id}/edit`,
          )}`,
        );
        return;
      }
      toast.error('Không lưu được, thử lại nhé.');
    }
  });

  async function removeListing() {
    try {
      await deleteRoom.mutateAsync(room.id);
      toast.success('Đã xoá tin đăng.');
      router.push('/manage/listings');
    } catch {
      toast.error('Không xoá được tin đăng, thử lại nhé.');
    }
  }

  return {
    ...form,
    roomType,
    city,
    latitudeValue: typeof latitude === 'number' ? latitude : undefined,
    longitudeValue: typeof longitude === 'number' ? longitude : undefined,
    addressQueries: buildLocationSearchQueries({
      address,
      ward,
      district,
      city,
    }),
    canAutoSearchLocation: Boolean(city && district && (ward || address)),
    amenityGroups,
    selectedAmenityIds,
    isUploadingImage,
    isDeletingImage: deleteImage.isPending,
    isSettingCoverImage: setCoverImage.isPending,
    settingCoverImageId: setCoverImage.variables,
    isDeletingRoom: deleteRoom.isPending,
    busy:
      isSubmitting ||
      isUploadingImage ||
      deleteImage.isPending ||
      setCoverImage.isPending,
    clearCoordinates,
    toggleAmenity,
    discardChanges,
    uploadImages,
    removeImage,
    makeCoverImage,
    submit,
    removeListing,
  };
}
