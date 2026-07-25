import type { Metadata } from 'next';
import { BackButton } from '@/components/ui/back-button';
import { MyListingsView } from './my-listings-view';

export const metadata: Metadata = {
  title: 'Tin của tôi',
  // A private, signed-in-only page — nothing here should be indexed.
  robots: { index: false, follow: false },
};

export default function MyListingsPage() {
  return (
    <div className="w-full px-4 py-8 md:px-6">
      {/* The header already shows this exact action on desktop (manage mode) —
          only shown here on mobile, where that button is hidden for space. */}
      <BackButton label="Về trang tìm phòng" className="mb-4 sm:hidden" />
      <div className="mb-6 space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Tổng quan tin đăng</h1>
        <p className="text-sm text-zinc-600">
          Quản lý tin đăng và theo dõi hiệu quả tiếp cận người thuê.
        </p>
      </div>
      <MyListingsView />
    </div>
  );
}
