import { Skeleton } from '@/components/ui/skeleton';
import { PageContainer } from '@/components/layout/page-shell';
import { FormSkeleton } from './edit-listing-view';

export default function EditListingLoading() {
  return (
    <PageContainer className="space-y-6">
      <Skeleton className="h-10 w-32 sm:hidden" />
      <FormSkeleton />
    </PageContainer>
  );
}
