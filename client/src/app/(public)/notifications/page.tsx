import type { Metadata } from 'next';
import { NotificationsView } from './notifications-view';

export const metadata: Metadata = {
  title: 'Thông báo',
  // Private, per-user content — nothing here should be indexed.
  robots: { index: false, follow: false },
};

export default function NotificationsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-xl font-semibold tracking-tight">Thông báo</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Cập nhật về tin đăng và tìm kiếm đã lưu của bạn.
      </p>
      <div className="mt-6">
        <NotificationsView />
      </div>
    </div>
  );
}
