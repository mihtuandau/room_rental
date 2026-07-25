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
        <h1 className="text-xl font-semibold tracking-tight">Tin đăng của tôi</h1>
        <p className="text-sm text-zinc-600">
          Tìm kiếm, lọc và quản lý toàn bộ tin đăng bạn đã đăng.
        </p>
      </div>
      <MyListingsView />
    </div>
  );
}
