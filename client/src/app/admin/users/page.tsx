import type { Metadata } from 'next';
import { PageContainer } from '@/components/layout/page-shell';
import { AdminUsersView } from './users-view';

export const metadata: Metadata = {
  title: 'Người dùng quản trị',
  robots: { index: false, follow: false },
};

export default function AdminUsersPage() {
  return (
    <PageContainer>
      <AdminUsersView />
    </PageContainer>
  );
}
