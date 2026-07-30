import { Skeleton } from '@/components/ui/skeleton';

export function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-20 w-80" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton
            key={index}
            className={
              index === 2 ? 'col-span-2 h-32 md:col-span-1' : 'h-32'
            }
          />
        ))}
      </div>
      <Skeleton className="h-[520px] w-full" />
    </div>
  );
}
