import type { Metadata } from 'next';
import { BackButton } from '@/components/ui/back-button';
import { PageContainer, PageHeader } from '@/components/layout/page-shell';
import { DashboardOverviewView } from './dashboard-overview-view';
import { ManageNavigation } from '@/components/layout/manage-shell';

export const metadata: Metadata = {
  title: 'Tổng quan',
  // A private, signed-in-only page — nothing here should be indexed.
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return (
    <PageContainer className="space-y-6">
      <BackButton label="Về trang tìm phòng" className="sm:hidden" />
      <PageHeader
        title="Tổng quan tin đăng"
        description="Theo dõi hiệu quả tiếp cận người thuê trên các tin đăng của bạn."
      />
      <ManageNavigation pathname="/manage/dashboard" />
      <DashboardOverviewView />
    </PageContainer>
  );
}
