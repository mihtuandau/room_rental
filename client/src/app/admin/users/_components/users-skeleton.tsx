import { Skeleton } from '@/components/ui/skeleton';

export function UsersSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <Skeleton className="h-9 w-44" />
          <Skeleton className="mt-3 h-5 w-80" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-32 w-full rounded-lg" />
        ))}
      </div>
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 p-5">
          <Skeleton className="h-20 w-full" />
        </div>
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="grid grid-cols-5 gap-4 border-b border-zinc-100 px-5 py-4"
          >
            <Skeleton className="h-10" />
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
            <Skeleton className="h-9" />
          </div>
        ))}
      </div>
    </div>
  );
}
