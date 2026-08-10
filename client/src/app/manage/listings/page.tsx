import type { Metadata } from 'next';
import { BackButton } from '@/components/ui/back-button';
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
      {/* The header already shows this exact action on desktop (manage mode) —
          only shown here on mobile, where that button is hidden for space. */}
      <BackButton label="Về trang tìm phòng" className="sm:hidden" />
      <PageHeader
        title="Tin đăng của tôi"
        description="Tìm kiếm, lọc và quản lý toàn bộ tin đăng bạn đã đăng."
      />
      <ManageNavigation pathname="/manage/listings" />
      <MyListingsView />
    </PageContainer>
  );
}
