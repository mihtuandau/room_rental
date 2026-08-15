import { PageContainer } from '@/components/layout/page-shell';
import { DashboardSkeleton } from './dashboard/_components/dashboard-skeleton';

export default function Loading() {
  return (
    <PageContainer>
      <DashboardSkeleton />
    </PageContainer>
  );
}
