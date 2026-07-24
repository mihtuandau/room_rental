import { Skeleton } from '@/components/ui/skeleton';

/**
 * Mirrors RoomCard's structure exactly — a skeleton with different proportions
 * makes the layout jump the moment real data lands.
 */
export function RoomCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-6 w-1/3" />
      </div>
    </div>
  );
}

/** Render as many as the page size so the page height doesn't collapse. */
export function RoomGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <RoomCardSkeleton key={i} />
      ))}
    </div>
  );
}
