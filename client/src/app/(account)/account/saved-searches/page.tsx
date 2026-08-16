import type { Metadata } from 'next';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { AuthRequired } from '@/components/auth/auth-required';
import { PageContainer, PageHeader } from '@/components/layout/page-shell';
import { SavedSearchesView } from '@/features/saved-searches/saved-searches-view';

export const metadata: Metadata = {
  title: 'Tìm kiếm đã lưu',
  robots: { index: false, follow: false },
};

export default function SavedSearchesPage() {
  return (
    <PageContainer size="narrow" className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Tài khoản', href: '/account' },
          { label: 'Tìm kiếm đã lưu' },
        ]}
      />
      <PageHeader
        title="Tìm kiếm đã lưu"
        description="Quản lý điều kiện tìm phòng và trạng thái nhận thông báo."
      />
      <AuthRequired nextPath="/account/saved-searches">
        <SavedSearchesView />
      </AuthRequired>
    </PageContainer>
  );
}
