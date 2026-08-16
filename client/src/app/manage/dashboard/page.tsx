import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      <PageHeader
        title="Tổng quan tin đăng"
        description="Theo dõi hiệu quả tiếp cận người thuê trên các tin đăng của bạn."
        action={<Button size="sm" asChild><Link href="/manage/listings/new"><Plus className="h-4 w-4" aria-hidden />Đăng tin mới</Link></Button>}
      />
      <ManageNavigation pathname="/manage/dashboard" />
      <DashboardOverviewView />
    </PageContainer>
  );
}
