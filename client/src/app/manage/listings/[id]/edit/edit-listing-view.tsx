'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { useMyRoomDetail } from '@/features/rooms/hooks';
import type { Amenity } from '@/features/amenities/api';
import type { ProvinceOption } from '@/features/locations/api';
import { EditListingForm } from './edit-listing-form';

export function EditListingView({
  roomId,
  amenities,
  provinces,
}: {
  roomId: number;
  amenities: Amenity[];
  provinces: ProvinceOption[];
}) {
  const { data: room, isPending, isError, refetch } = useMyRoomDetail(roomId);

  if (isPending) return <FormSkeleton />;
  // 404 (wrong id) or 403 (someone else's listing) both land here — either
  // way there's nothing this user can edit at this id.
  if (isError) {
    return (
      <ErrorState
        title="Không tìm thấy tin đăng"
        description="Tin đăng không tồn tại hoặc bạn không có quyền chỉnh sửa."
        onRetry={() => refetch()}
      />
    );
  }

  return <EditListingForm room={room} amenities={amenities} provinces={provinces} />;
}

function FormSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-20 w-full rounded-lg" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[7fr_5fr]">
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
