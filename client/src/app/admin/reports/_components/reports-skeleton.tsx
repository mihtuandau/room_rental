import { Skeleton } from '@/components/ui/skeleton';

export function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Skeleton className="h-9 w-56" />
          <Skeleton className="mt-2 h-5 w-full max-w-xl" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton
            key={index}
            className={index === 2 ? 'col-span-2 h-32 rounded-xl md:col-span-1' : 'h-32 rounded-xl'}
          />
        ))}
      </div>
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 p-4 sm:p-5">
          <Skeleton className="h-10 w-44" />
        </div>
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="grid gap-3 border-b border-zinc-100 px-5 py-4 sm:grid-cols-4 sm:items-center">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-9 w-24 sm:justify-self-end" />
          </div>
        ))}
      </div>
    </div>
  );
}
