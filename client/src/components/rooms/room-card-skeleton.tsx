import { Skeleton } from '@/components/ui/skeleton';

/**
 * Mirrors RoomCard's structure exactly — a skeleton with different proportions
 * makes the layout jump the moment real data lands.
 */
export function RoomCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-surface-card shadow-sm ring-1 ring-border-subtle">
      <Skeleton className="aspect-square w-full rounded-none sm:aspect-[4/3]" />
      <div className="space-y-2 p-2.5 sm:p-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/5" />
      </div>
    </div>
  );
}

/** Render as many as the page size so the page height doesn't collapse. */
export function RoomGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <RoomCardSkeleton key={i} />
      ))}
    </div>
  );
}
