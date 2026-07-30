import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-72" />
        <Skeleton className="mt-3 h-5 w-96" />
      </div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton
            key={index}
            className={
              index === 2
                ? 'col-span-2 h-32 w-full rounded-lg sm:col-span-1'
                : 'h-32 w-full rounded-lg'
            }
          />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
        <Skeleton className="h-80 w-full rounded-lg" />
        <Skeleton className="h-80 w-full rounded-lg" />
      </div>
    </div>
  );
}
