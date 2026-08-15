import { Skeleton } from '@/components/ui/skeleton';

export function MyListingsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Đang tải tin đăng">
      <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-zinc-200 bg-white sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex items-center gap-3 p-3 sm:p-5">
            <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-8" />
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-zinc-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <Skeleton className="h-10 w-full sm:max-w-xs" />
          <Skeleton className="h-10 w-full sm:w-40" />
        </div>
        <div className="hidden grid-cols-4 gap-4 border-b border-zinc-100 bg-zinc-50 px-5 py-3 sm:grid">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-4 w-24" />
          ))}
        </div>
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="grid gap-3 border-b border-zinc-100 px-4 py-4 sm:grid-cols-4 sm:items-center sm:px-5">
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-9 w-24 sm:justify-self-end" />
          </div>
        ))}
        <div className="flex items-center justify-between px-4 py-3 sm:px-5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </div>
  );
}
