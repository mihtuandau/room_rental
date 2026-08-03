import type { Metadata } from 'next';
import { BackButton } from '@/components/ui/back-button';
import { DashboardOverviewView } from './dashboard-overview-view';
import { ManageNavigation } from '@/components/layout/manage-shell';

export const metadata: Metadata = {
  title: 'Tổng quan',
  // A private, signed-in-only page — nothing here should be indexed.
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
      <BackButton label="Về trang tìm phòng" className="mb-4 sm:hidden" />
      <div className="mb-6 space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Tổng quan tin đăng</h1>
        <p className="text-sm text-zinc-600">
          Theo dõi hiệu quả tiếp cận người thuê trên các tin đăng của bạn.
        </p>
      </div>
      <ManageNavigation pathname="/manage/dashboard" />
      <DashboardOverviewView />
    </div>
  );
}
