import { PageContainer } from '@/components/layout/page-shell';
import { ReportsSkeleton } from './_components/reports-skeleton';

export default function AdminReportsLoading() {
  return (
    <PageContainer>
      <ReportsSkeleton />
    </PageContainer>
  );
}
