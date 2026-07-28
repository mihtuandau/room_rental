import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-6 lg:px-8 xl:px-10">
      <Skeleton className="h-8 w-52" />
      <Skeleton className="mt-3 h-5 w-full max-w-md" />
      <Skeleton className="mt-8 h-44 w-full rounded-lg" />
    </div>
  );
}
