import { RoomGridSkeleton } from '@/components/rooms/room-card-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function FavoritesLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <Skeleton className="h-8 w-48 rounded-lg" />
      <Skeleton className="mt-2 h-5 w-64" />

      <div className="mt-6">
        <RoomGridSkeleton count={6} />
      </div>
    </div>
  );
}
