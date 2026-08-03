import type { Metadata } from 'next';
import { BackButton } from '@/components/ui/back-button';
import { AccountSecurityView } from '@/features/users/account-security-view';

export const metadata: Metadata = {
  title: 'Bảo mật tài khoản',
  robots: { index: false, follow: false },
};

export default function AccountSecurityPage() {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10 sm:px-6">
      <BackButton label="Về tài khoản" className="mb-4 sm:hidden" />
      <h1 className="mb-2 text-xl font-semibold tracking-tight">Bảo mật tài khoản</h1>
      <p className="mb-6 text-sm text-zinc-600">Quản lý phương thức đăng nhập và trạng thái xác minh.</p>
      <AccountSecurityView />
    </div>
  );
}
