import { RoomGridSkeleton } from '@/components/rooms/room-card-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <Skeleton className="h-8 w-72" />
      <Skeleton className="h-5 w-48" />
      <RoomGridSkeleton count={12} />
    </div>
  );
}
