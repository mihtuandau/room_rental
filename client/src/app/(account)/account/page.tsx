import type { Metadata } from 'next';
import { BackButton } from '@/components/ui/back-button';
import { AuthRequired } from '@/components/auth/auth-required';
import { PageContainer, PageHeader } from '@/components/layout/page-shell';
import { AccountView } from '@/features/users/account-view';

export const metadata: Metadata = {
  title: 'Tài khoản của bạn',
  // A private, signed-in-only page — nothing here should be indexed.
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <PageContainer size="narrow" className="space-y-6">
      <BackButton label="Về trang tìm phòng" className="sm:hidden" />
      <PageHeader title="Tài khoản của bạn" />
      <AuthRequired nextPath="/account">
        <AccountView />
      </AuthRequired>
    </PageContainer>
  );
}
