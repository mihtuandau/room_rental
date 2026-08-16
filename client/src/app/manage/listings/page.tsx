import type { Metadata } from 'next';
import { PageContainer, PageHeader } from '@/components/layout/page-shell';
import { MyListingsView } from './my-listings-view';
import { ManageNavigation } from '@/components/layout/manage-shell';

export const metadata: Metadata = {
  title: 'Tin của tôi',
  // A private, signed-in-only page — nothing here should be indexed.
  robots: { index: false, follow: false },
};

export default function MyListingsPage() {
  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Tin đăng của tôi"
        description="Tìm kiếm, lọc và quản lý toàn bộ tin đăng bạn đã đăng."
      />
      <ManageNavigation pathname="/manage/listings" />
      <MyListingsView />
    </PageContainer>
  );
}
