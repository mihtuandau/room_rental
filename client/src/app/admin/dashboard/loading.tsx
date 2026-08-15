import { PageContainer } from '@/components/layout/page-shell';
import { DashboardSkeleton } from './_components/dashboard-skeleton';

export default function AdminDashboardLoading() {
  return (
    <PageContainer>
      <DashboardSkeleton />
    </PageContainer>
  );
}
