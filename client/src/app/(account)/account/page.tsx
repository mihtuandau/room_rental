import type { Metadata } from 'next';
import { BackButton } from '@/components/ui/back-button';
import { AuthRequired } from '@/components/auth/auth-required';
import { PageContainer, PageHeader } from '@/components/layout/page-shell';
import { AccountHubView } from '@/features/users/account-hub-view';

export const metadata: Metadata = {
  title: 'Tài khoản của bạn',
  // A private, signed-in-only page — nothing here should be indexed.
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <PageContainer size="wide" className="max-w-4xl space-y-6">
      <BackButton label="Về trang tìm phòng" className="sm:hidden" />
      <PageHeader title="Tài khoản của bạn" description="Quản lý hồ sơ, bảo mật và các thiết lập cá nhân." />
      <AuthRequired nextPath="/account">
        <AccountHubView />
      </AuthRequired>
    </PageContainer>
  );
}
