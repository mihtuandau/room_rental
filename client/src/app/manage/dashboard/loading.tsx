import { Skeleton } from '@/components/ui/skeleton';
import { PageContainer } from '@/components/layout/page-shell';
import { OverviewSkeleton } from './_components/overview-panels';

export default function DashboardLoading() {
  return (
    <PageContainer className="space-y-6">
      <Skeleton className="h-10 w-40 sm:hidden" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Skeleton className="h-9 w-56" />
          <Skeleton className="mt-2 h-5 w-full max-w-xl" />
        </div>
        <Skeleton className="h-10 w-full sm:w-28" />
      </div>
      <div className="border-b border-zinc-200">
        <div className="flex h-12 items-center gap-2">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
      <OverviewSkeleton />
    </PageContainer>
  );
}
