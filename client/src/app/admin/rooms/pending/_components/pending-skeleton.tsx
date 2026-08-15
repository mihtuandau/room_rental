import { Skeleton } from '@/components/ui/skeleton';

export function PendingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Skeleton className="h-9 w-56" />
          <Skeleton className="mt-2 h-5 w-full max-w-xl" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-32 w-full rounded-xl" />
        ))}
      </div>
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 p-4 sm:p-5">
          <div className="flex gap-3">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="grid gap-3 border-b border-zinc-100 px-5 py-4 sm:grid-cols-5 sm:items-center">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-24 sm:justify-self-end" />
          </div>
        ))}
      </div>
    </div>
  );
}
