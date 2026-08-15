import { Skeleton } from '@/components/ui/skeleton';
import { PageContainer } from '@/components/layout/page-shell';
import { NewListingFormSkeleton } from './new-listing-form';

export default function NewListingLoading() {
  return (
    <PageContainer className="space-y-6">
      <div>
        <Skeleton className="h-9 w-56" />
        <Skeleton className="mt-2 h-5 w-full max-w-3xl" />
        <Skeleton className="mt-2 h-5 w-2/3 max-w-2xl" />
      </div>
      <NewListingFormSkeleton />
    </PageContainer>
  );
}
