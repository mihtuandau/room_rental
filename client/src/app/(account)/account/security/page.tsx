import type { Metadata } from 'next';
import { BackButton } from '@/components/ui/back-button';
import { AuthRequired } from '@/components/auth/auth-required';
import { PageContainer, PageHeader } from '@/components/layout/page-shell';
import { AccountSecurityView } from '@/features/users/account-security-view';

export const metadata: Metadata = {
  title: 'Bảo mật tài khoản',
  robots: { index: false, follow: false },
};

export default function AccountSecurityPage() {
  return (
    <PageContainer size="narrow" className="space-y-6">
      <BackButton label="Về tài khoản" className="sm:hidden" />
      <PageHeader
        title="Bảo mật tài khoản"
        description="Quản lý phương thức đăng nhập và trạng thái xác minh."
      />
      <AuthRequired nextPath="/account/security">
        <AccountSecurityView />
      </AuthRequired>
    </PageContainer>
  );
}
