import { RoomGridSkeleton } from '@/components/rooms/room-card-skeleton';

export default function FavoritesLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-200" />
      <div className="mt-2 h-5 w-64 animate-pulse rounded bg-zinc-200" />

      <div className="mt-6">
        <RoomGridSkeleton count={4} />
      </div>
    </div>
  );
}
