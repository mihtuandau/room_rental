import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <Skeleton className="h-9 w-44" />
      <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
      <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-10">
        <div className="space-y-6">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
        <Skeleton className="mt-8 h-72 w-full rounded-2xl lg:mt-0" />
      </div>
    </div>
  );
}
