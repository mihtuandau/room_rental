import { Skeleton } from '@/components/ui/skeleton';

export function PendingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-20 w-80" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-[520px] w-full" />
    </div>
  );
}
