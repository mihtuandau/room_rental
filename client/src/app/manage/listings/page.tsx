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
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      {/* The header already shows this exact action on desktop (manage mode) —
          only shown here on mobile, where that button is hidden for space. */}
      <BackButton label="Về trang tìm phòng" className="mb-4 sm:hidden" />
      <h1 className="mb-6 text-xl font-semibold tracking-tight">Tin của tôi</h1>
      <MyListingsView />
    </div>
  );
}
