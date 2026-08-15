import { Skeleton } from '@/components/ui/skeleton';
import { PageContainer } from '@/components/layout/page-shell';

export default function Loading() {
  return (
    <PageContainer className="space-y-6">
      <Skeleton className="h-10 w-40 sm:hidden" />
      <div>
        <Skeleton className="h-9 w-56" />
        <Skeleton className="mt-2 h-5 w-full max-w-xl" />
      </div>
      <div className="border-b border-zinc-200">
        <div className="flex h-12 items-center gap-2">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-lg" />
    </PageContainer>
  );
}
