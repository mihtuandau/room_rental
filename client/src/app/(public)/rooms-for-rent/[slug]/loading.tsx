import { RoomGridSkeleton } from '@/components/rooms/room-card-skeleton';

export default function AreaLandingLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      {/* Back button */}
      <div className="mb-4 h-5 w-32 animate-pulse rounded bg-zinc-200" />

      {/* Heading & description */}
      <div className="h-8 w-64 animate-pulse rounded-lg bg-zinc-200" />
      <div className="mt-2 h-5 w-full max-w-xl animate-pulse rounded bg-zinc-200" />

      {/* Room count label */}
      <div className="mt-6 h-4 w-20 animate-pulse rounded bg-zinc-200" />

      {/* Room grid skeleton */}
      <div className="mt-4">
        <RoomGridSkeleton count={6} />
      </div>
    </div>
  );
}
