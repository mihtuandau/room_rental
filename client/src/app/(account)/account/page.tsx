import type { Metadata } from 'next';
import { BackButton } from '@/components/ui/back-button';
import { AccountView } from '@/features/users/account-view';

export const metadata: Metadata = {
  title: 'Tài khoản của bạn',
  // A private, signed-in-only page — nothing here should be indexed.
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10 sm:px-6">
      <BackButton label="Về trang tìm phòng" className="mb-4 sm:hidden" />
      <h1 className="mb-6 text-xl font-semibold tracking-tight">Tài khoản của bạn</h1>
      <AccountView />
    </div>
  );
}
