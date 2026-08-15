import { PageContainer } from '@/components/layout/page-shell';
import { PendingSkeleton } from './_components/pending-skeleton';

export default function PendingRoomsLoading() {
  return (
    <PageContainer>
      <PendingSkeleton />
    </PageContainer>
  );
}
